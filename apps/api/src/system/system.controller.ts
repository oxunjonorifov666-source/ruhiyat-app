import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Get('audit-logs')
  @Permissions('system.audit')
  findAuditLogs() { return this.service.findAuditLogs(); }

  @Get('settings')
  @Permissions('system.settings')
  findSettings() { return this.service.findSettings(); }

  @Patch('settings/:key')
  @Permissions('system.settings')
  updateSetting(@Param('key') key: string, @Body() data: any) { return this.service.updateSetting(key, data); }

  @Get('mobile-settings')
  @Permissions('system.settings')
  findMobileSettings() { return this.service.findMobileSettings(); }

  @Patch('mobile-settings/:key')
  @Permissions('system.settings')
  updateMobileSetting(@Param('key') key: string, @Body() data: any) { return this.service.updateMobileSetting(key, data); }

  @Get('api-keys')
  @Permissions('system.settings')
  findApiKeys() { return this.service.findApiKeys(); }

  @Post('api-keys')
  @Permissions('system.settings')
  createApiKey(@Body() data: any) { return this.service.createApiKey(data); }

  @Delete('api-keys/:id')
  @Permissions('system.settings')
  removeApiKey(@Param('id', ParseIntPipe) id: number) { return this.service.removeApiKey(id); }

  @Get('integrations')
  @Permissions('system.settings')
  findIntegrations() { return this.service.findIntegrations(); }

  @Patch('integrations/:id')
  @Permissions('system.settings')
  updateIntegration(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateIntegration(id, data); }
}
