import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PsychologistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.psychologist.findMany({ include: { user: { select: { email: true, phone: true } } } }); }

  async findOne(id: number) {
    const p = await this.prisma.psychologist.findUnique({ where: { id }, include: { user: { select: { email: true, phone: true } } } });
    if (!p) throw new NotFoundException('Psychologist not found');
    return p;
  }

  async create(data: any) { return this.prisma.psychologist.create({ data }); }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.psychologist.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.psychologist.delete({ where: { id } });
    return { message: 'Psychologist deleted' };
  }
}
