import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Get('audit-logs')
  findAuditLogs() { return this.service.findAuditLogs(); }

  @Get('settings')
  findSettings() { return this.service.findSettings(); }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body() data: any) { return this.service.updateSetting(key, data); }

  @Get('mobile-settings')
  findMobileSettings() { return this.service.findMobileSettings(); }

  @Patch('mobile-settings/:key')
  updateMobileSetting(@Param('key') key: string, @Body() data: any) { return this.service.updateMobileSetting(key, data); }

  @Get('api-keys')
  findApiKeys() { return this.service.findApiKeys(); }

  @Post('api-keys')
  createApiKey(@Body() data: any) { return this.service.createApiKey(data); }

  @Delete('api-keys/:id')
  removeApiKey(@Param('id', ParseIntPipe) id: number) { return this.service.removeApiKey(id); }

  @Get('integrations')
  findIntegrations() { return this.service.findIntegrations(); }

  @Patch('integrations/:id')
  updateIntegration(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateIntegration(id, data); }
}
