import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Get('audit-logs')
  @Permissions('system.audit')
  findAuditLogs(
    @CurrentUser() requester: AuthUser,
    @Query() query: any
  ) { 
    return this.service.findAuditLogs(requester, query); 
  }

  @Get('audit-logs/:id')
  @Permissions('system.audit')
  findAuditLogById(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.findAuditLogById(requester, id);
  }

  @Get('settings')
  @Permissions('system.settings')
  findSettings(@CurrentUser() requester: AuthUser) { 
    return this.service.findSettings(requester); 
  }

  @Patch('settings/:key')
  @Permissions('system.settings')
  updateSetting(
    @CurrentUser() requester: AuthUser,
    @Param('key') key: string, 
    @Body() data: any
  ) { 
    return this.service.updateSetting(requester, key, data); 
  }

  @Get('mobile-settings')
  @Permissions('system.settings')
  findMobileSettings(@CurrentUser() requester: AuthUser) { 
    return this.service.findMobileSettings(requester); 
  }

  @Patch('mobile-settings/:key')
  @Permissions('system.settings')
  updateMobileSetting(
    @CurrentUser() requester: AuthUser,
    @Param('key') key: string, 
    @Body() data: any
  ) { 
    return this.service.updateMobileSetting(requester, key, data); 
  }

  @Get('api-keys')
  @Permissions('system.settings')
  findApiKeys(@CurrentUser() requester: AuthUser) { 
    return this.service.findApiKeys(requester); 
  }

  @Post('api-keys')
  @Permissions('system.settings')
  createApiKey(
    @CurrentUser() requester: AuthUser,
    @Body() data: any
  ) { 
    return this.service.createApiKey(requester, data); 
  }

  @Delete('api-keys/:id')
  @Permissions('system.settings')
  removeApiKey(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ) { 
    return this.service.removeApiKey(requester, id); 
  }

  @Get('integrations')
  @Permissions('system.settings')
  findIntegrations(@CurrentUser() requester: AuthUser) { 
    return this.service.findIntegrations(requester); 
  }

  @Patch('integrations/:id')
  @Permissions('system.settings')
  updateIntegration(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: any
  ) { 
    return this.service.updateIntegration(requester, id, data); 
  }

  @Get('auth-sessions')
  @Permissions('system.audit')
  findAuthSessions(@CurrentUser() requester: AuthUser, @Query() query: any) {
    return this.service.findAuthSessions(requester, query);
  }

  @Delete('auth-sessions/:id')
  @Permissions('system.audit')
  revokeAuthSession(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.revokeAuthSession(requester, id);
  }
}
