import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { WellnessService } from './wellness.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';

@Controller('wellness')
@UseGuards(JwtAuthGuard)
export class WellnessController {
  constructor(private readonly service: WellnessService) {}

  @Get('mood/weekly')
  moodWeeklySummary(@CurrentUser() user: AuthUser) {
    return this.service.getMoodWeeklySummary(user.id);
  }

  @Get('mood')
  findMoodEntries(@CurrentUser() user: AuthUser) { 
    return this.service.findMoodEntries(user.id); 
  }
  
  @Post('mood')
  createMoodEntry(@CurrentUser() user: AuthUser, @Body() data: { mood?: unknown; note?: string; factors?: string[] }) {
    return this.service.createMoodEntry(user.id, data);
  }

  @Get('breathing-scenarios')
  findBreathingScenarios() {
    return this.service.findBreathingScenarios();
  }

  @Get('diary')
  findDiaryEntries(@CurrentUser() user: AuthUser) { 
    return this.service.findDiaryEntries(user.id); 
  }
  
  @Post('diary')
  createDiaryEntry(@CurrentUser() user: AuthUser, @Body() data: any) { 
    return this.service.createDiaryEntry(user.id, data); 
  }
  
  @Get('diary/:id')
  findDiaryEntry(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) { 
    return this.service.findDiaryEntry(user.id, id); 
  }
  
  @Patch('diary/:id')
  updateDiaryEntry(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() data: any) { 
    return this.service.updateDiaryEntry(user.id, id, data); 
  }
  
  @Delete('diary/:id')
  removeDiaryEntry(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) { 
    return this.service.removeDiaryEntry(user.id, id); 
  }

  @Get('habits')
  findHabits(@CurrentUser() user: AuthUser) { return this.service.findHabits(user.id); }
  @Post('habits')
  createHabit(@CurrentUser() user: AuthUser, @Body() data: any) { return this.service.createHabit(user.id, data); }
  @Patch('habits/:id')
  updateHabit(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateHabit(user.id, id, data); }
  @Delete('habits/:id')
  removeHabit(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.service.removeHabit(user.id, id); }
  @Post('habits/:id/log')
  logHabit(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.logHabit(user.id, id, data); }

  @Get('sleep')
  findSleepRecords(@CurrentUser() user: AuthUser) { return this.service.findSleepRecords(user.id); }
  @Post('sleep')
  createSleepRecord(@CurrentUser() user: AuthUser, @Body() data: any) { return this.service.createSleepRecord(user.id, data); }

  @Get('breathing')
  findBreathingSessions(@CurrentUser() user: AuthUser) { return this.service.findBreathingSessions(user.id); }
  @Post('breathing')
  createBreathingSession(@CurrentUser() user: AuthUser, @Body() data: any) { return this.service.createBreathingSession(user.id, data); }

  @Get('saved-items')
  findSavedItems(@CurrentUser() user: AuthUser) { return this.service.findSavedItems(user.id); }
  @Post('saved-items')
  createSavedItem(@CurrentUser() user: AuthUser, @Body() data: any) { return this.service.createSavedItem(user.id, data); }
  @Delete('saved-items/:id')
  removeSavedItem(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.service.removeSavedItem(user.id, id); }
}
