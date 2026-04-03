import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { WellnessService } from './wellness.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class WellnessController {
  constructor(private readonly service: WellnessService) {}

  @Get('mood')
  findMoodEntries() { return this.service.findMoodEntries(); }
  @Post('mood')
  createMoodEntry(@Body() data: any) { return this.service.createMoodEntry(data); }

  @Get('diary')
  findDiaryEntries() { return this.service.findDiaryEntries(); }
  @Post('diary')
  createDiaryEntry(@Body() data: any) { return this.service.createDiaryEntry(data); }
  @Get('diary/:id')
  findDiaryEntry(@Param('id', ParseIntPipe) id: number) { return this.service.findDiaryEntry(id); }
  @Patch('diary/:id')
  updateDiaryEntry(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateDiaryEntry(id, data); }
  @Delete('diary/:id')
  removeDiaryEntry(@Param('id', ParseIntPipe) id: number) { return this.service.removeDiaryEntry(id); }

  @Get('habits')
  findHabits() { return this.service.findHabits(); }
  @Post('habits')
  createHabit(@Body() data: any) { return this.service.createHabit(data); }
  @Patch('habits/:id')
  updateHabit(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateHabit(id, data); }
  @Delete('habits/:id')
  removeHabit(@Param('id', ParseIntPipe) id: number) { return this.service.removeHabit(id); }
  @Post('habits/:id/log')
  logHabit(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.logHabit(id, data); }

  @Get('sleep')
  findSleepRecords() { return this.service.findSleepRecords(); }
  @Post('sleep')
  createSleepRecord(@Body() data: any) { return this.service.createSleepRecord(data); }

  @Get('breathing')
  findBreathingSessions() { return this.service.findBreathingSessions(); }
  @Post('breathing')
  createBreathingSession(@Body() data: any) { return this.service.createBreathingSession(data); }

  @Get('saved-items')
  findSavedItems() { return this.service.findSavedItems(); }
  @Post('saved-items')
  createSavedItem(@Body() data: any) { return this.service.createSavedItem(data); }
  @Delete('saved-items/:id')
  removeSavedItem(@Param('id', ParseIntPipe) id: number) { return this.service.removeSavedItem(id); }
}
