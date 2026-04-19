import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityObservabilityService } from '../observability/security-observability.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityObs: SecurityObservabilityService,
  ) {}

  async findAll(requester: AuthUser) {
    const where: any = {};
    if (requester.role !== UserRole.SUPERADMIN) {
      if (requester.centerId == null) {
        throw new ForbiddenException("Sizga markaz tayinlanmagan — rollarni ko'ra olmaysiz");
      }
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

  async create(
    data: { name: string; description?: string; centerId?: number },
    requester: AuthUser,
  ) {
    let targetCenterId: number | null = data.centerId === undefined ? null : data.centerId;
    if (requester.role !== UserRole.SUPERADMIN) {
      if (requester.centerId == null) {
        throw new ForbiddenException("Sizga markaz tayinlanmagan — rol yaratib bo'lmaydi");
      }
      targetCenterId = requester.centerId;
    }

    const role = await this.prisma.role.create({ 
      data: {
        name: data.name,
        description: data.description ?? null,
        centerId: targetCenterId,
        isSystem: false,
      },
    });
    await this.securityObs.record({
      event: 'ROLE_CREATED',
      userId: requester.id,
      success: true,
      details: { actorRole: requester.role, roleId: role.id, name: role.name, centerId: role.centerId },
    });
    return role;
  }

  async findOne(id: number, requester: AuthUser) {
    const where: any = { id };
    
    if (requester.role !== UserRole.SUPERADMIN) {
      if (requester.centerId == null) {
        throw new ForbiddenException("Sizga markaz tayinlanmagan — rolga kira olmaysiz");
      }
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

  async update(
    id: number,
    data: { name?: string; description?: string; centerId?: number },
    requester: AuthUser,
  ) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollarini o'zgartirish mumkin emas");
    }

    const updateData: {
      name?: string;
      description?: string | null;
      centerId?: number | null;
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (requester.role === UserRole.SUPERADMIN && data.centerId !== undefined) {
      updateData.centerId = data.centerId;
    }
    if (Object.keys(updateData).length === 0) {
      return role;
    }
    const updated = await this.prisma.role.update({ 
      where: { id }, 
      data: updateData,
    });
    await this.securityObs.record({
      event: 'ROLE_UPDATED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        roleId: id,
        keysTouched: Object.keys(updateData).slice(0, 32),
      },
    });
    return updated;
  }

  async remove(id: number, requester: AuthUser) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem) {
      throw new ForbiddenException("Tizim rollarini o'chirish mumkin emas");
    }

    await this.prisma.role.delete({ where: { id } });
    await this.securityObs.record({
      event: 'ROLE_DELETED',
      userId: requester.id,
      success: true,
      details: { actorRole: requester.role, roleId: id, name: role.name },
    });
    return { message: 'Rol muvaffaqiyatli o\'chirildi' };
  }

  async getPermissions(id: number, requester: AuthUser) {
    await this.findOne(id, requester);
    return this.prisma.permission.findMany({ where: { roleId: id } });
  }

  async addPermission(
    id: number,
    data: { resource: string; action: string },
    requester: AuthUser,
  ) {
    const role = await this.findOne(id, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollariga ruxsatnomalar qo'shish mumkin emas");
    }

    const perm = await this.prisma.permission.create({ 
      data: { roleId: id, resource: data.resource, action: data.action },
    });
    await this.securityObs.record({
      event: 'ROLE_PERMISSION_ADDED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        roleId: id,
        permissionId: perm.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
    return perm;
  }

  async removePermission(roleId: number, permissionId: number, requester: AuthUser) {
    const role = await this.findOne(roleId, requester);
    
    if (role.isSystem && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Tizim rollaridan ruxsatnomalarni o'chirish mumkin emas");
    }

    await this.prisma.permission.delete({ 
      where: { id: permissionId, roleId } 
    });
    await this.securityObs.record({
      event: 'ROLE_PERMISSION_REMOVED',
      userId: requester.id,
      success: true,
      details: { actorRole: requester.role, roleId, permissionId },
    });
    return { message: 'Ruxsatnoma muvaffaqiyatli o\'chirildi' };
  }
}
