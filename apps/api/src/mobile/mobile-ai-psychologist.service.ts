import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOpenAiApiKey } from '../common/openai-key.util';

@Injectable()
export class MobileAiPsychologistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async getSetting(key: string): Promise<string | null> {
    const row = await this.prisma.mobileAppSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  async getOrCreateConversation(userId: number) {
    let conv = await this.prisma.aiPsychologistConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conv) {
      conv = await this.prisma.aiPsychologistConversation.create({ data: { userId } });
    }
    return conv;
  }

  async listMessages(userId: number) {
    const conv = await this.getOrCreateConversation(userId);
    return this.prisma.aiPsychologistMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async sendMessage(userId: number, text: string) {
    const content = text?.trim();
    if (!content) throw new BadRequestException('Xabar bo‘sh');

    const apiKey = await resolveOpenAiApiKey(this.config, this.prisma);
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "AI xizmati hozircha sozlanmagan. OPENAI_API_KEY yoki Superadmin panelida API kalitni kiriting.",
      );
    }

    const conv = await this.getOrCreateConversation(userId);
    const systemPrompt =
      (await this.getSetting('ai_dilosh_system_prompt')) ||
      'Siz Ruhiyat ilovasidagi yordamchi psixologsiz. Foydalanuvchiga qisqa, iliq va xavfsiz javob bering. Tibbiy diagnoz qo‘ymang.';

    const model = (await this.getSetting('ai_dilosh_model')) || 'gpt-4o-mini';

    await this.prisma.aiPsychologistMessage.create({
      data: { conversationId: conv.id, role: 'user', content },
    });

    const history = await this.prisma.aiPsychologistMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new ServiceUnavailableException(`AI xizmati javob bermadi: ${err.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const assistantText = json.choices?.[0]?.message?.content?.trim();
    if (!assistantText) {
      throw new ServiceUnavailableException('AI bo‘sh javob qaytardi');
    }

    const assistant = await this.prisma.aiPsychologistMessage.create({
      data: { conversationId: conv.id, role: 'assistant', content: assistantText },
    });

    await this.prisma.aiPsychologistConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return { userMessage: content, assistant };
  }
}
