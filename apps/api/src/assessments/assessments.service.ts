import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOpenAiApiKey } from '../common/openai-key.util';

import { CreateTestDto } from './dto/create-test.dto';
import type { TestInterpretationV2 } from './test-interpretation.types';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAllTests(opts?: { publishedOnly?: boolean }) {
    const where: any = {};
    if (opts?.publishedOnly) {
      where.isPublished = true;
    }
    const [data, total] = await Promise.all([
      this.prisma.test.findMany({
        where,
        include: {
          _count: { select: { questions: true, testResults: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.test.count({ where }),
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async findTest(id: number) {
    const test = await this.prisma.test.findUnique({ 
      where: { id }, 
      include: { 
        questions: { 
          include: { 
            answers: { orderBy: { orderIndex: 'asc' } } 
          }, 
          orderBy: { orderIndex: 'asc' } 
        } 
      } 
    });
    if (!test) throw new NotFoundException('Test topilmadi');
    return test;
  }

  async createTest(dto: CreateTestDto, createdBy?: number) { 
    return this.prisma.test.create({ 
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        type: dto.type || 'psychological',
        duration: dto.duration,
        imageUrl: dto.imageUrl,
        /** Sukut: mobil ilovada ko‘rinsin; Draft faqat aniq `isPublished: false` bo‘lsa */
        isPublished: dto.isPublished !== false,
        createdBy,
        questions: {
          create: dto.questions.map(q => ({
            text: q.text,
            type: q.type || 'single_choice',
            orderIndex: q.orderIndex || 0,
            imageUrl: q.imageUrl,
            answers: {
              create: q.answers.map(a => ({
                text: a.text,
                isCorrect: a.isCorrect || false,
                score: a.score || 0,
                orderIndex: a.orderIndex || 0
              }))
            }
          }))
        }
      },
      include: {
        questions: { include: { answers: true } }
      }
    }); 
  }

  async importTemplate(template: CreateTestDto, userId?: number) {
    return this.createTest(template, userId);
  }

  async updateTest(id: number, data: any) {
    await this.findTest(id);
    return this.prisma.test.update({ 
      where: { id }, 
      data,
      include: { questions: { include: { answers: true } } }
    });
  }

  async removeTest(id: number) {
    await this.findTest(id);
    await this.prisma.test.delete({ where: { id } });
    return { message: 'Test o\'chirildi' };
  }

  async getQuestions(id: number) {
    await this.findTest(id);
    return this.prisma.question.findMany({ 
      where: { testId: id }, 
      include: { answers: true }, 
      orderBy: { orderIndex: 'asc' } 
    });
  }

  async submitTest(testId: number, data: any, userId: number) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true, description: true, category: true },
    });
    if (!test) throw new NotFoundException('Test topilmadi');

    const interpretation = await this.buildTestInterpretation(test, {
      score: data.score,
      maxScore: data.maxScore,
      responses: data.responses,
      clientHint: typeof data.interpretation === 'string' ? data.interpretation : undefined,
    });

    return this.prisma.testResult.create({
      data: {
        testId,
        userId,
        score: data.score,
        maxScore: data.maxScore,
        responses: data.responses,
        interpretation,
        completedAt: new Date(),
      },
      include: { test: { select: { id: true, title: true, description: true } } },
    });
  }

  private clipArr(raw: unknown, max: number, maxLen = 220): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .slice(0, max)
      .map((s) => (s.length > maxLen ? `${s.slice(0, maxLen)}…` : s));
  }

  private heuristicInterpretationV2(
    test: { title: string; description: string | null; category: string | null },
    ctx: { score: number; maxScore: number },
  ): TestInterpretationV2 {
    const { score, maxScore } = ctx;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const desc = test.description?.trim();
    return {
      v: 2,
      headline: `${test.title} — ${pct}%`,
      summary: [
        `Sizning umumiy ballingiz: ${score} / ${maxScore} (${pct}%).`,
        desc ? `${desc.slice(0, 320)}${desc.length > 320 ? '…' : ''}` : 'Bu test natijasi sizning hozirgi holatingiz haqida umumiy tasvir beradi.',
        'Natija shaxsiy kuzatuv uchun mo‘ljallangan; tibbiy diagnoz hisoblanmaydi.',
      ].join(' '),
      strengths: [
        'Testni oxirigacha bajarib, o‘z holatingizga qiziqish bildirdingiz — bu o‘z-o‘zini kuzatish uchun muhim qadam.',
      ],
      attention: [
        'Agar natija sizni bezovta qilsa yoki kuchli stress, uyqu muammosi, xavfsizlik tashvishi bo‘lsa — malakali mutaxassisga murojaat qiling.',
      ],
      selfCare: [
        'Kuniga 10–15 daqiqa tinch nafas mashqlari.',
        'Ishonchli odam bilan qisqa suhbat — his-tuyg‘ularni nomlash.',
        'Rejim: uyqu va ovqat vaqtini barqarorlashtirish.',
      ],
      closing:
        'Bu xulosa avtomatik tahlil va umumiy yo‘nalishni ko‘rsatadi; dori yoki diagnoz o‘rnini bosmaydi. Zarurat bo‘lsa — psixolog/psixiatr bilan maslahatlashing.',
      scorePercent: pct,
    };
  }

  private normalizeAiV2(
    parsed: Record<string, unknown>,
    test: { title: string },
    pct: number,
  ): TestInterpretationV2 {
    const headline = String(parsed.headline || `${test.title} — ${pct}%`).slice(0, 220);
    const summary = String(parsed.summary || '').trim().slice(0, 2000);
    return {
      v: 2,
      headline,
      summary: summary || `Test natijasi: ${pct}%.`,
      strengths: this.clipArr(parsed.strengths, 5),
      attention: this.clipArr(parsed.attention, 5),
      selfCare: this.clipArr(parsed.selfCare, 6),
      closing: String(parsed.closing || '')
        .trim()
        .slice(0, 800),
      scorePercent: pct,
    };
  }

  private async buildTestInterpretation(
    test: { title: string; description: string | null; category: string | null },
    ctx: { score: number; maxScore: number; responses: unknown; clientHint?: string },
  ): Promise<string> {
    const { score, maxScore } = ctx;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const fallback = this.heuristicInterpretationV2(test, { score, maxScore });

    const apiKey = await resolveOpenAiApiKey(this.config, this.prisma);
    if (!apiKey) {
      return JSON.stringify(fallback);
    }

    try {
      const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      const payload = {
        testTitle: test.title,
        testCategory: test.category,
        testDescription: test.description,
        score,
        maxScore,
        percent: pct,
        responsesSummary:
          typeof ctx.responses === 'object' ? JSON.stringify(ctx.responses).slice(0, 6000) : String(ctx.responses),
      };
      const schemaHint = `Faqat bitta JSON obyekt qaytaring (boshqa matn yo‘q), kalitlar:
{"headline":"string","summary":"string","strengths":["string"],"attention":["string"],"selfCare":["string"],"closing":"string"}
Barcha matnlar o‘zbek tilida bo‘lsin. strengths 2–4 ta qisqa gap, attention 2–3 ta, selfCare 3–5 ta amaliy maslahat. Tibbiy diagnoz qo‘ymang, dori tavsiya qilmang.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          max_tokens: 900,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Siz Ruhiyat ilovasi uchun psixologik test natijasini tahlil qiluvchi yordamchisisiz. Foydalanuvchiga iliq, hurmat bilan murojaat qiling.',
            },
            {
              role: 'user',
              content: `${schemaHint}\n\nMa’lumot (JSON): ${JSON.stringify(payload)}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(`OpenAI test interpretation: ${res.status} ${errText.slice(0, 200)}`);
        return JSON.stringify(fallback);
      }
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content?.trim();
      if (!raw) return JSON.stringify(fallback);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return JSON.stringify(fallback);
      }
      const merged = this.normalizeAiV2(parsed, test, pct);
      merged.v = 2;
      merged.scorePercent = pct;
      if (!merged.strengths.length && !merged.summary) {
        return JSON.stringify(fallback);
      }
      return JSON.stringify(merged);
    } catch (e) {
      this.logger.warn(`AI test interpretation: ${e instanceof Error ? e.message : e}`);
    }
    return JSON.stringify(fallback);
  }

  async findAllResults() {
    const [data, total] = await Promise.all([
      this.prisma.testResult.findMany({ include: { test: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.testResult.count(),
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async findResultsForUser(userId: number) {
    const [data, total] = await Promise.all([
      this.prisma.testResult.findMany({
        where: { userId },
        include: { test: { select: { id: true, title: true, description: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.testResult.count({ where: { userId } }),
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async findResult(id: number) {
    const result = await this.prisma.testResult.findUnique({ where: { id }, include: { test: true } });
    if (!result) throw new NotFoundException('Test result not found');
    return result;
  }
}
