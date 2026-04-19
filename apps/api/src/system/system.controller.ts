import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import {
  UpdateSystemSettingDto,
  UpdateMobileAppSettingDto,
  CreateApiKeyDto,
  UpdateIntegrationSettingDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TenantGuard)
@Roles(UserRole.SUPERADMIN)
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
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateSetting(
    @CurrentUser() requester: AuthUser,
    @Param('key') key: string, 
    @Body() data: UpdateSystemSettingDto
  ) { 
    return this.service.updateSetting(requester, key, data); 
  }

  @Get('mobile-settings')
  @Permissions('system.settings')
  findMobileSettings(@CurrentUser() requester: AuthUser) { 
    return this.service.findMobileSettings(requester); 
  }

  @Patch('mobile-settings/:key')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateMobileSetting(
    @CurrentUser() requester: AuthUser,
    @Param('key') key: string, 
    @Body() data: UpdateMobileAppSettingDto
  ) { 
    return this.service.updateMobileSetting(requester, key, data); 
  }

  @Get('api-keys')
  @Permissions('system.settings')
  findApiKeys(@CurrentUser() requester: AuthUser) { 
    return this.service.findApiKeys(requester); 
  }

  @Post('api-keys')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  createApiKey(
    @CurrentUser() requester: AuthUser,
    @Body() data: CreateApiKeyDto
  ) { 
    return this.service.createApiKey(requester, data); 
  }

  @Delete('api-keys/:id')
  @UseGuards(StepUpGuard)
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
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateIntegration(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: UpdateIntegrationSettingDto
  ) { 
    return this.service.updateIntegration(requester, id, data); 
  }

  @Get('auth-sessions')
  @Permissions('system.audit')
  findAuthSessions(@CurrentUser() requester: AuthUser, @Query() query: any) {
    return this.service.findAuthSessions(requester, query);
  }

  @Delete('auth-sessions/:id')
  @UseGuards(StepUpGuard)
  @Permissions('system.audit')
  revokeAuthSession(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.revokeAuthSession(requester, id);
  }
}
