import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTests() { return this.prisma.test.findMany(); }

  async findTest(id: number) {
    const test = await this.prisma.test.findUnique({ where: { id }, include: { questions: { include: { answers: true } } } });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async createTest(data: any) { return this.prisma.test.create({ data }); }

  async updateTest(id: number, data: any) {
    await this.findTest(id);
    return this.prisma.test.update({ where: { id }, data });
  }

  async removeTest(id: number) {
    await this.findTest(id);
    await this.prisma.test.delete({ where: { id } });
    return { message: 'Test deleted' };
  }

  async getQuestions(id: number) {
    await this.findTest(id);
    return this.prisma.question.findMany({ where: { testId: id }, include: { answers: true }, orderBy: { orderIndex: 'asc' } });
  }

  async submitTest(testId: number, data: any) {
    return this.prisma.testResult.create({ data: { testId, ...data, completedAt: new Date() } });
  }

  async findAllResults() { return this.prisma.testResult.findMany({ include: { test: true } }); }

  async findResult(id: number) {
    const result = await this.prisma.testResult.findUnique({ where: { id }, include: { test: true } });
    if (!result) throw new NotFoundException('Test result not found');
    return result;
  }
}
