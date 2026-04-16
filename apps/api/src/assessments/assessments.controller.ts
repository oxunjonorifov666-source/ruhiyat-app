import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateTestDto } from './dto/create-test.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get('tests')
  findAllTests(@Query('published') published?: string) {
    return this.service.findAllTests({ publishedOnly: published === 'true' });
  }

  @Get('tests/:id')
  findTest(@Param('id', ParseIntPipe) id: number) { return this.service.findTest(id); }

  @Post('tests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assessments.write')
  createTest(@Body() data: CreateTestDto, @Req() req: any) { 
    const userId = req.user?.id;
    return this.service.createTest(data, userId); 
  }

  @Post('tests/import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assessments.write')
  importTemplate(@Body() data: CreateTestDto, @Req() req: any) { 
    const userId = req.user?.id;
    return this.service.importTemplate(data, userId); 
  }

  @Patch('tests/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assessments.write')
  updateTest(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateTest(id, data); }

  @Delete('tests/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assessments.delete')
  removeTest(@Param('id', ParseIntPipe) id: number) { return this.service.removeTest(id); }

  @Get('tests/:id/questions')
  getQuestions(@Param('id', ParseIntPipe) id: number) { return this.service.getQuestions(id); }

  @Post('tests/:id/submit')
  @UseGuards(JwtAuthGuard)
  submitTest(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Req() req: any) { 
    const userId = req.user?.id;
    return this.service.submitTest(id, data, userId); 
  }

  @Get('test-results')
  @UseGuards(JwtAuthGuard)
  findAllResults(@CurrentUser() user: AuthUser) {
    if (user.role === UserRole.SUPERADMIN) {
      return this.service.findAllResults();
    }
    return this.service.findResultsForUser(user.id);
  }

  @Get('test-results/:id')
  @UseGuards(JwtAuthGuard)
  async findResult(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const r = await this.service.findResult(id);
    if (user.role !== UserRole.SUPERADMIN && (r as any).userId !== user.id) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    return r;
  }
}
