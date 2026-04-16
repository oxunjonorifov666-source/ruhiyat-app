import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOpenAiApiKey } from '../common/openai-key.util';

const MOOD_STRING_TO_SCORE: Record<string, number> = {
  happy: 5,
  calm: 4,
  tired: 3,
  sad: 2,
  angry: 1,
  stressed: 2,
  anxious: 2,
};

const WEEKDAY_UZ = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

@Injectable()
export class WellnessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findMoodEntries(userId: number) { return this.prisma.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }

  /** Oxirgi 7 kun (UTC kunlari, mobil grafik bilan mos), statistika + AI/heuristik xulosa */
  async getMoodWeeklySummary(userId: number) {
    const now = new Date();
    const dayKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      dayKeys.push(d.toISOString().slice(0, 10));
    }
    const since = new Date(`${dayKeys[0]}T00:00:00.000Z`);
    const entries = await this.prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const days = dayKeys.map((date) => {
      const dayRows = entries.filter((r) => r.createdAt.toISOString().startsWith(date));
      const moods = dayRows.map((r) => r.mood);
      const value = moods.length ? Math.max(...moods.map((m) => Math.min(5, Math.max(1, m)))) : 0;
      const wd = new Date(`${date}T12:00:00.000Z`).getUTCDay();
      return { date, label: WEEKDAY_UZ[wd], value, count: moods.length };
    });

    const allScores = entries.map((e) => Math.min(5, Math.max(1, e.mood)));
    const weekAverage = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

    const first3 = dayKeys.slice(0, 3);
    const last3 = dayKeys.slice(4, 7);
    const avgForKeys = (keys: string[]) => {
      const scores = entries
        .filter((e) => keys.some((k) => e.createdAt.toISOString().startsWith(k)))
        .map((e) => Math.min(5, Math.max(1, e.mood)));
      return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    };
    const aFirst = avgForKeys(first3);
    const aLast = avgForKeys(last3);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (aFirst != null && aLast != null) {
      if (aLast - aFirst > 0.35) trend = 'up';
      else if (aFirst - aLast > 0.35) trend = 'down';
    }

    const loggedDays = days.filter((d) => d.count > 0).length;
    let aiSummary = this.heuristicMoodSummary(weekAverage, trend, loggedDays, entries.length);
    let aiSource: 'openai' | 'heuristic' = 'heuristic';

    const apiKey = await resolveOpenAiApiKey(this.config, this.prisma);
    if (apiKey && entries.length > 0) {
      try {
        const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
        const userPayload = {
          days: days.map((d) => ({ date: d.date, maxScore: d.value, entries: d.count })),
          weekAverage,
          trend,
          totalEntries: entries.length,
        };
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.55,
            max_tokens: 380,
            messages: [
              {
                role: 'system',
                content:
                  'Siz Ruhiyat ilovasining yordamchisisiz. Foydalanuvchining haftalik kayfiyat yozuvlari bo‘yicha qisqa (3–5 jumla) xulosa o‘zbek tilida bering. Tibbiy diagnoz qo‘ymang, dori tavsiya qilmang. Iliq va amaliy qoidalarni qisqa aytishingiz mumkin.',
              },
              {
                role: 'user',
                content: `Ma’lumot (JSON): ${JSON.stringify(userPayload)}`,
              },
            ],
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const text = json.choices?.[0]?.message?.content?.trim();
          if (text) {
            aiSummary = text;
            aiSource = 'openai';
          }
        }
      } catch {
        /* heuristik qoladi */
      }
    }

    return {
      days,
      weekAverage,
      trend,
      loggedDays,
      totalEntries: entries.length,
      aiSummary,
      aiSource,
    };
  }

  private heuristicMoodSummary(
    weekAverage: number | null,
    trend: 'up' | 'down' | 'stable',
    loggedDays: number,
    totalEntries: number,
  ): string {
    if (!totalEntries) {
      return 'Bu hafta hali kayfiyat belgilanmagan. Asosiy sahifadan kunlik kayfiyatni tanlash orqali odat hosil qilish osonlashadi.';
    }
    const avgStr = weekAverage != null ? weekAverage.toFixed(1) : '';
    const parts: string[] = [];
    if (weekAverage != null) {
      if (weekAverage >= 4.2) parts.push(`Hafta o‘rtacha kayfiyati yuqori (${avgStr}/5).`);
      else if (weekAverage >= 3) parts.push(`Hafta o‘rtacha kayfiyati o‘rtacha (${avgStr}/5).`);
      else parts.push(`Hafta o‘rtacha kayfiyati pastroq (${avgStr}/5); o‘zingizni asrang va kerak bo‘lsa mutaxassisga murojaat qilishni o‘ylab ko‘ring.`);
    }
    if (trend === 'up') parts.push('So‘nggi kunlarda yaxshilanish seziladi.');
    else if (trend === 'down') parts.push('Oxirgi kunlarda biroz pasayish bor — dam olish, uyqu va yengil jismoniy faollik yordam berishi mumkin.');
    else parts.push('Barqarorlik kuzatilmoqda.');
    parts.push(`Jami ${totalEntries} ta yozuv, ${loggedDays} kun belgilangan.`);
    parts.push('Bu xulosa tibbiy hulosa emas; kayfiyatingizni kuzatishni davom eting.');
    return parts.join(' ');
  }

  async createMoodEntry(userId: number, data: { mood?: unknown; note?: string; factors?: string[] }) {
    let moodScore: number;
    if (typeof data.mood === 'number' && !Number.isNaN(data.mood)) {
      moodScore = Math.min(5, Math.max(1, Math.round(data.mood)));
    } else if (typeof data.mood === 'string') {
      const key = data.mood.toLowerCase().trim();
      moodScore = MOOD_STRING_TO_SCORE[key] ?? 3;
    } else {
      throw new BadRequestException('Kayfiyat (mood) kiritilmagan');
    }
    return this.prisma.moodEntry.create({
      data: {
        userId,
        mood: moodScore,
        note: data.note ?? null,
        factors: Array.isArray(data.factors) ? data.factors : [],
      },
    });
  }

  async findBreathingScenarios() {
    return this.prisma.breathingScenario.findMany({
      where: { isPublished: true },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    });
  }

  async findDiaryEntries(userId: number) { return this.prisma.diaryEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async createDiaryEntry(userId: number, data: any) { return this.prisma.diaryEntry.create({ data: { ...data, userId } }); }
  async findDiaryEntry(userId: number, id: number) {
    const e = await this.prisma.diaryEntry.findFirst({ where: { id, userId } });
    if (!e) throw new NotFoundException('Diary entry not found');
    return e;
  }
  async updateDiaryEntry(userId: number, id: number, data: any) { 
    await this.findDiaryEntry(userId, id);
    return this.prisma.diaryEntry.update({ where: { id }, data }); 
  }
  async removeDiaryEntry(userId: number, id: number) { 
    await this.findDiaryEntry(userId, id);
    await this.prisma.diaryEntry.delete({ where: { id } }); 
    return { message: 'Diary entry deleted' }; 
  }

  async findHabits(userId: number) { return this.prisma.habit.findMany({ where: { userId }, include: { logs: { take: 7, orderBy: { completedAt: 'desc' } } } }); }
  async createHabit(userId: number, data: any) { return this.prisma.habit.create({ data: { ...data, userId } }); }
  async updateHabit(userId: number, id: number, data: any) { 
    const h = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!h) throw new NotFoundException('Habit not found');
    return this.prisma.habit.update({ where: { id }, data }); 
  }
  async removeHabit(userId: number, id: number) { 
    const h = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!h) throw new NotFoundException('Habit not found');
    await this.prisma.habit.delete({ where: { id } }); 
    return { message: 'Habit deleted' }; 
  }
  async logHabit(userId: number, habitId: number, data: any) {
    const h = await this.prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!h) throw new NotFoundException('Habit not found');
    return this.prisma.habitLog.create({ data: { habitId, userId, ...data } });
  }

  async findSleepRecords(userId: number) { return this.prisma.sleepRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async createSleepRecord(userId: number, data: any) { return this.prisma.sleepRecord.create({ data: { ...data, userId } }); }

  async findBreathingSessions(userId: number) { return this.prisma.breathingSession.findMany({ where: { userId }, orderBy: { completedAt: 'desc' } }); }
  async createBreathingSession(userId: number, data: any) { return this.prisma.breathingSession.create({ data: { ...data, userId } }); }

  async findSavedItems(userId: number) { return this.prisma.savedItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async createSavedItem(userId: number, data: any) { return this.prisma.savedItem.create({ data: { ...data, userId } }); }
  async removeSavedItem(userId: number, id: number) { 
    const s = await this.prisma.savedItem.findFirst({ where: { id, userId } });
    if (!s) throw new NotFoundException('Saved item not found');
    await this.prisma.savedItem.delete({ where: { id } }); 
    return { message: 'Saved item removed' }; 
  }
}
