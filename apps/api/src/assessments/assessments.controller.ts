import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get('tests')
  findAllTests() { return this.service.findAllTests(); }

  @Get('tests/:id')
  findTest(@Param('id', ParseIntPipe) id: number) { return this.service.findTest(id); }

  @Post('tests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assessments.write')
  createTest(@Body() data: any) { return this.service.createTest(data); }

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
  submitTest(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.submitTest(id, data); }

  @Get('test-results')
  @UseGuards(JwtAuthGuard)
  findAllResults() { return this.service.findAllResults(); }

  @Get('test-results/:id')
  @UseGuards(JwtAuthGuard)
  findResult(@Param('id', ParseIntPipe) id: number) { return this.service.findResult(id); }
}
