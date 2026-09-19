import { prisma } from "../utils/prisma";

export class RoleRepository {
  static async findAll(orgId?: string) {
    return prisma.role.findMany({
      where: orgId ? { OR: [{ organizationId: orgId }, { organizationId: null }] } : {},
      include: { 
        permissions: { include: { permission: true } },
        _count: { select: { members: true } }
      }
    });
  }

  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
  }

  static async create(orgId: string | null, data: any) {
    const { permissions, ...roleData } = data;
    const role = await prisma.role.create({
      data: {
        ...roleData,
        organizationId: orgId,
      }
    });

    if (permissions && permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((pId: string) => ({ roleId: role.id, permissionId: pId }))
      });
    }
    
    return this.findById(role.id);
  }

  static async update(id: string, data: any) {
    const { permissions, ...roleData } = data;
    await prisma.role.update({ where: { id }, data: roleData });

    if (permissions) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: permissions.map((pId: string) => ({ roleId: id, permissionId: pId }))
      });
    }

    return this.findById(id);
  }

  static async delete(id: string) {
    return prisma.role.delete({ where: { id } });
  }

  static async getPermissions() {
    return prisma.permission.findMany();
  }
}
