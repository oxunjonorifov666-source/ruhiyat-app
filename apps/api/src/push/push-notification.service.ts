import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type PushKind = 'chat' | 'content' | 'meeting';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Mobil `notification_prefs` (NotificationSettingsScreen) bilan moslashgan. */
  private prefsAllow(prefs: unknown, kind: PushKind): boolean {
    if (!prefs || typeof prefs !== 'object') return true;
    const p = prefs as Record<string, unknown>;
    if (p.pushEnabled === false) return false;
    if (kind === 'content') return p.remindersEnabled !== false;
    if (kind === 'meeting') return p.sessionReminder !== false;
    return true;
  }

  async sendExpoMessages(
    items: { to: string; title: string; body: string; data?: Record<string, string> }[],
  ): Promise<void> {
    if (!items.length) return;
    const chunkSize = 100;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });
        const j = (await res.json()) as { data?: unknown; errors?: unknown };
        if (!res.ok) {
          this.logger.warn(`Expo push HTTP ${res.status}: ${JSON.stringify(j)}`);
        } else if (j.errors) {
          this.logger.warn(`Expo push errors: ${JSON.stringify(j.errors)}`);
        }
      } catch (e) {
        this.logger.warn(`Expo push fetch failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  /** Xabar DB ga yozilgandan keyin (REST yoki WebSocket) — qabul qiluvchilarga push. */
  async notifyAfterChatMessage(message: {
    chatId: number;
    senderId: number;
    content: string | null;
    type?: string | null;
    attachmentUrl?: string | null;
    sender: { firstName?: string | null; lastName?: string | null; email?: string | null };
  }): Promise<void> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: message.chatId },
      select: {
        title: true,
        participants: { select: { userId: true } },
      },
    });
    if (!chat?.participants?.length) return;
    const recipientUserIds = chat.participants.map((p) => p.userId).filter((id) => id !== message.senderId);
    const senderLabel =
      [message.sender.firstName, message.sender.lastName].filter(Boolean).join(' ').trim() ||
      message.sender.email ||
      'Xabar';
    const preview =
      message.type && message.type !== 'text'
        ? `[${message.type}]`
        : (message.content || '').trim() || (message.attachmentUrl ? 'Fayl' : '');
    return this.notifyChatMessage({
      chatId: message.chatId,
      chatTitle: chat.title,
      recipientUserIds,
      senderLabel,
      preview,
    });
  }

  async notifyChatMessage(params: {
    chatId: number;
    chatTitle: string | null;
    recipientUserIds: number[];
    senderLabel: string;
    preview: string;
  }): Promise<void> {
    const { chatId, chatTitle, recipientUserIds, senderLabel, preview } = params;
    if (!recipientUserIds.length) return;

    const mobiles = await this.prisma.mobileUser.findMany({
      where: { userId: { in: recipientUserIds } },
      select: { userId: true, notificationPrefs: true },
    });
    const allowedUserIds = recipientUserIds.filter((uid) => {
      const mu = mobiles.find((m) => m.userId === uid);
      if (!mu) return true;
      return this.prefsAllow(mu.notificationPrefs, 'chat');
    });
    if (!allowedUserIds.length) return;

    const devices = await this.prisma.mobilePushDevice.findMany({
      where: { userId: { in: allowedUserIds } },
      select: { expoPushToken: true },
    });
    const tokens = [...new Set(devices.map((d) => d.expoPushToken).filter(Boolean))];
    if (!tokens.length) return;

    const title = chatTitle?.trim() || 'Xabar';
    const body = `${senderLabel}: ${preview || '…'}`.slice(0, 180);
    const data: Record<string, string> = {
      type: 'chat',
      chatId: String(chatId),
    };
    await this.sendExpoMessages(tokens.map((to) => ({ to, title, body, data })));
  }

  async notifyNewPublishedContent(params: { articleId: number; title: string }): Promise<void> {
    const { articleId, title } = params;
    const devices = await this.prisma.mobilePushDevice.findMany({
      select: { expoPushToken: true, userId: true },
    });
    if (!devices.length) return;

    const userIds = [...new Set(devices.map((d) => d.userId))];
    const mobiles = await this.prisma.mobileUser.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, notificationPrefs: true },
    });
    const prefsByUser = new Map(mobiles.map((m) => [m.userId, m.notificationPrefs]));

    const messages: { to: string; title: string; body: string; data?: Record<string, string> }[] = [];
    const seen = new Set<string>();
    for (const d of devices) {
      const prefs = prefsByUser.get(d.userId);
      if (!this.prefsAllow(prefs ?? null, 'content')) continue;
      if (seen.has(d.expoPushToken)) continue;
      seen.add(d.expoPushToken);
      messages.push({
        to: d.expoPushToken,
        title: 'Yangi maqola',
        body: title.slice(0, 160),
        data: { type: 'article', articleId: String(articleId) },
      });
    }
    await this.sendExpoMessages(messages);
  }
}
