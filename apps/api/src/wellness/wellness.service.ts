import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WellnessService {
  constructor(private readonly prisma: PrismaService) {}

  async findMoodEntries() { return this.prisma.moodEntry.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createMoodEntry(data: any) { return this.prisma.moodEntry.create({ data }); }

  async findDiaryEntries() { return this.prisma.diaryEntry.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createDiaryEntry(data: any) { return this.prisma.diaryEntry.create({ data }); }
  async findDiaryEntry(id: number) {
    const e = await this.prisma.diaryEntry.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Diary entry not found');
    return e;
  }
  async updateDiaryEntry(id: number, data: any) { return this.prisma.diaryEntry.update({ where: { id }, data }); }
  async removeDiaryEntry(id: number) { await this.prisma.diaryEntry.delete({ where: { id } }); return { message: 'Diary entry deleted' }; }

  async findHabits() { return this.prisma.habit.findMany({ include: { logs: { take: 7, orderBy: { completedAt: 'desc' } } } }); }
  async createHabit(data: any) { return this.prisma.habit.create({ data }); }
  async updateHabit(id: number, data: any) { return this.prisma.habit.update({ where: { id }, data }); }
  async removeHabit(id: number) { await this.prisma.habit.delete({ where: { id } }); return { message: 'Habit deleted' }; }
  async logHabit(habitId: number, data: any) { return this.prisma.habitLog.create({ data: { habitId, ...data } }); }

  async findSleepRecords() { return this.prisma.sleepRecord.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createSleepRecord(data: any) { return this.prisma.sleepRecord.create({ data }); }

  async findBreathingSessions() { return this.prisma.breathingSession.findMany({ orderBy: { completedAt: 'desc' } }); }
  async createBreathingSession(data: any) { return this.prisma.breathingSession.create({ data }); }

  async findSavedItems() { return this.prisma.savedItem.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createSavedItem(data: any) { return this.prisma.savedItem.create({ data }); }
  async removeSavedItem(id: number) { await this.prisma.savedItem.delete({ where: { id } }); return { message: 'Saved item removed' }; }
}
