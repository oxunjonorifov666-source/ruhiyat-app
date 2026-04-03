import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.role.findMany({ include: { permissions: true } }); }

  async create(data: any) { return this.prisma.role.create({ data }); }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { permissions: true } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted' };
  }

  async getPermissions(id: number) {
    await this.findOne(id);
    return this.prisma.permission.findMany({ where: { roleId: id } });
  }

  async addPermission(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.permission.create({ data: { ...data, roleId: id } });
  }
}
