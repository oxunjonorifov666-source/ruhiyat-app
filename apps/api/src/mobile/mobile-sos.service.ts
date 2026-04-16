import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../communication/chat.gateway';

@Injectable()
export class MobileSosService {
  private readonly logger = new Logger(MobileSosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async triggerSos(
    userId: number,
    body: { latitude?: number; longitude?: number; message?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const alert = await this.prisma.sosAlert.create({
      data: {
        userId,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        message: body.message?.trim() || null,
        status: 'NEW',
      },
    });

    const title = '🆘 SOS signal';
    const who = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || `ID ${user.id}`;
    const bodyText = `${who} favqulodda yordam so‘radi.`;

    const superadmins = await this.prisma.user.findMany({
      where: { role: 'SUPERADMIN', isActive: true, isBlocked: false },
      select: { id: true },
    });

    await Promise.all(
      superadmins.map((a) =>
        this.prisma.notification.create({
          data: {
            userId: a.id,
            title,
            body: bodyText,
            type: 'sos',
            metadata: JSON.stringify({ sosAlertId: alert.id, sourceUserId: userId }),
          },
        }),
      ),
    );

    const lastBooking = await this.prisma.bookingSession.findFirst({
      where: { userId, status: { in: ['ACCEPTED', 'PENDING'] } },
      orderBy: { updatedAt: 'desc' },
      include: { psychologist: { select: { userId: true, firstName: true, lastName: true } } },
    });
    if (lastBooking?.psychologist?.userId) {
      const pid = lastBooking.psychologist.userId;
      await this.prisma.notification.create({
        data: {
          userId: pid,
          title,
          body: bodyText,
          type: 'sos',
          metadata: JSON.stringify({ sosAlertId: alert.id, sourceUserId: userId }),
        },
      });
    }

    const payload = {
      type: 'sos',
      alertId: alert.id,
      userId,
      userName: who,
      createdAt: alert.createdAt.toISOString(),
      latitude: alert.latitude,
      longitude: alert.longitude,
      message: alert.message,
    };

    for (const a of superadmins) {
      this.chatGateway.emitToUser(a.id, 'sosAlert', payload);
    }
    if (lastBooking?.psychologist?.userId) {
      this.chatGateway.emitToUser(lastBooking.psychologist.userId, 'sosAlert', payload);
    }

    this.logger.warn(`SOS #${alert.id} from user ${userId}`);
    return { ok: true, alertId: alert.id, createdAt: alert.createdAt };
  }
}
