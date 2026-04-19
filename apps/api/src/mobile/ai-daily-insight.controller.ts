import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { ForbiddenException } from '@nestjs/common';
import { MobileService } from './mobile.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiDailyInsightController {
  constructor(private readonly mobile: MobileService) {}

  private ensureConsumer(user: AuthUser) {
    if (user.role !== UserRole.MOBILE_USER && user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Bu resurs faqat mobil foydalanuvchilar uchun');
    }
  }

  @Get('daily-insight')
  dailyInsight(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.mobile.getDailyInsight(user.id);
  }
}
