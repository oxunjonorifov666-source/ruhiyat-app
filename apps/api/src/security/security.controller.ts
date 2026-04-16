import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';
import { SecurityService } from './security.service';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Get('policy')
  getPolicy(@CurrentUser() requester: AuthUser) {
    return this.service.getPolicy(requester);
  }

  @Patch('policy')
  updatePolicy(@CurrentUser() requester: AuthUser, @Body() body: any) {
    return this.service.updatePolicy(requester, body);
  }

  @Get('sessions')
  listSessions(@CurrentUser() requester: AuthUser, @Query() query: any) {
    return this.service.listSessions(requester, query);
  }

  @Delete('sessions/:id')
  revokeSession(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.revokeSession(requester, id);
  }

  @Post('sessions/logout-all')
  logoutAll(@CurrentUser() requester: AuthUser, @Body() body: any) {
    return this.service.logoutAll(requester, body);
  }

  @Get('logs')
  listSecurityLogs(@CurrentUser() requester: AuthUser, @Query() query: any) {
    return this.service.listSecurityLogs(requester, query);
  }

  @Get('logs/:id')
  getSecurityLog(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.getSecurityLog(requester, id);
  }
}

