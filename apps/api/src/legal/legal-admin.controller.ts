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
import { LegalDocumentKind } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { LegalService } from './legal.service';

@Controller('legal')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TenantGuard)
@Roles(UserRole.SUPERADMIN)
export class LegalAdminController {
  constructor(private readonly legal: LegalService) {}

  @Get('compliance-summary')
  @Permissions('system.settings')
  complianceSummary(@CurrentUser() requester: AuthUser) {
    return this.legal.getComplianceSummary(requester);
  }

  @Get('account-deletion-queue')
  @Permissions('system.settings')
  accountDeletionQueue(@CurrentUser() requester: AuthUser) {
    return this.legal.listAccountDeletionQueue(requester);
  }

  @Get('documents')
  @Permissions('system.settings')
  listDocuments(@Query('kind') kind?: string) {
    if (kind === 'TERMS_OF_SERVICE' || kind === 'PRIVACY_POLICY') {
      return this.legal.listDocuments(kind as LegalDocumentKind);
    }
    return this.legal.listDocuments();
  }

  @Post('documents')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  createDocument(
    @CurrentUser() requester: AuthUser,
    @Body()
    body: {
      kind: LegalDocumentKind;
      version: string;
      title?: string;
      content: string;
      publish?: boolean;
    },
  ) {
    return this.legal.createDocument(requester, body);
  }

  @Patch('documents/:id')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateDocument(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; content?: string },
  ) {
    return this.legal.updateDocument(requester, id, body);
  }

  @Post('documents/:id/activate')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  activateDocument(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.legal.activateDocument(requester, id);
  }

  @Get('ai-safety')
  @Permissions('system.settings')
  getAiSafety() {
    return this.legal.getAiSafetySettings();
  }

  @Patch('ai-safety')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateAiSafety(
    @CurrentUser() requester: AuthUser,
    @Body() body: { primary?: string; secondary?: string },
  ) {
    return this.legal.updateAiSafetySettings(requester, body);
  }

  @Get('crisis-resources')
  @Permissions('system.settings')
  listCrisis() {
    return this.legal.listCrisisResources();
  }

  @Post('crisis-resources')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  createCrisis(
    @CurrentUser() requester: AuthUser,
    @Body()
    body: {
      regionCode?: string;
      sortOrder?: number;
      label: string;
      phoneNumber?: string;
      helpText?: string;
      isActive?: boolean;
    },
  ) {
    return this.legal.createCrisisResource(requester, body);
  }

  @Patch('crisis-resources/:id')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  updateCrisis(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      regionCode?: string;
      sortOrder?: number;
      label?: string;
      phoneNumber?: string;
      helpText?: string;
      isActive?: boolean;
    },
  ) {
    return this.legal.updateCrisisResource(requester, id, body);
  }

  @Delete('crisis-resources/:id')
  @UseGuards(StepUpGuard)
  @Permissions('system.settings')
  deleteCrisis(@CurrentUser() requester: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.legal.deleteCrisisResource(requester, id);
  }
}
