import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(requester: AuthUser) {
    const where: any = {};
    if (requester.role !== UserRole.SUPERADMIN) {
      where.OR = [
        { centerId: requester.centerId },
        { centerId: null, isSystem: true }
      ];
    }
    return this.prisma.role.findMany({ 
      where, 
      include: { permissions: true, _count: { select: { permissions: true } } } 
    });
  }

  async create(data: { name: string; description?: string; centerId?: number }, requester: AuthUser) {
    let targetCenterId = data.centerId;
    if (requester.role !== UserRole.SUPERADMIN) {
      targetCenterId = requester.centerId as number;
    }

    return this.prisma.role.create({ 
      data: {
        ...data,
        centerId: targetCenterId,
        isSystem: false // User created roles are never system roles
      } 
    });
  }

  async findOne(id: number, requester: AuthUser) {
    const where: any = { id };
    
    if (requester.role !== UserRole.SUPERADMIN) {
      where.OR = [
        { id, centerId: requester.centerId },
        { id, centerId: null, isSystem: true }
      ];
    }

    const role = await this.prisma.role.findFirst({ 
      where, 
      include: { permissions: true } 
    });

    if (!role) throw new NotFoundException('Rol topilmadi yoki kirish taqiqlangan');
    return role;
  }

  async update(id: number, data: any, requester: AuthUser) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollarini o'zgartirish mumkin emas");
    }

    return this.prisma.role.update({ 
      where: { id }, 
      data 
    });
  }

  async remove(id: number, requester: AuthUser) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem) {
      throw new ForbiddenException("Tizim rollarini o'chirish mumkin emas");
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Rol muvaffaqiyatli o\'chirildi' };
  }

  async getPermissions(id: number, requester: AuthUser) {
    await this.findOne(id, requester);
    return this.prisma.permission.findMany({ where: { roleId: id } });
  }

  async addPermission(id: number, data: any, requester: AuthUser) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollariga ruxsatnomalar qo'shish mumkin emas");
    }

    return this.prisma.permission.create({ 
      data: { ...data, roleId: id } 
    });
  }

  async removePermission(roleId: number, permissionId: number, requester: AuthUser) {
    const role = await this.findOne(roleId, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollaridan ruxsatnomalarni o'chirish mumkin emas");
    }

    await this.prisma.permission.delete({ 
      where: { id: permissionId, roleId } 
    });
    
    return { message: 'Ruxsatnoma muvaffaqiyatli o\'chirildi' };
  }
}
