import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get('tests')
  findAllTests() { return this.service.findAllTests(); }

  @Get('tests/:id')
  findTest(@Param('id', ParseIntPipe) id: number) { return this.service.findTest(id); }

  @Post('tests')
  @UseGuards(JwtAuthGuard)
  createTest(@Body() data: any) { return this.service.createTest(data); }

  @Patch('tests/:id')
  @UseGuards(JwtAuthGuard)
  updateTest(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateTest(id, data); }

  @Delete('tests/:id')
  @UseGuards(JwtAuthGuard)
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
