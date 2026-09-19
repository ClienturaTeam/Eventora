import { UserRepository } from "../repositories/users.repository";
import { AuditService } from "./audit.service";
import { UserStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

export class UserService {
  static async getMe(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, code: "NOT_FOUND", message: "User not found" };
    return user;
  }

  static async updateMe(id: string, data: any) {
    const updated = await UserRepository.update(id, data);
    return updated;
  }

  static async getAll() {
    return UserRepository.findAll();
  }

  static async getById(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, code: "NOT_FOUND", message: "User not found" };
    return user;
  }

  static async update(id: string, data: any, actorId: string) {
    const user = await this.getById(id);
    const updated = await UserRepository.update(id, data);
    await AuditService.logAction({ organizationId: "PLATFORM", actorId, action: "user.updated", target: id, metadata: data });
    return updated;
  }

  static async updateStatus(id: string, status: UserStatus, actorId: string) {
    await this.getById(id);
    const updated = await UserRepository.update(id, { status });
    await AuditService.logAction({ organizationId: "PLATFORM", actorId, action: "user.status_updated", target: id, metadata: { status } });
    return updated;
  }

  static async delete(id: string, actorId: string) {
    await this.getById(id);
    const deleted = await UserRepository.delete(id);
    await AuditService.logAction({ organizationId: "PLATFORM", actorId, action: "user.deleted", target: id, metadata: {} });
    return deleted;
  }

  static async create(data: any, actorId: string, tenantId?: string) {
    const { firstName, lastName, email, password, roleId, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { status: 400, code: "USER_EXISTS", message: "Email is already registered" };
    }

    let dbRole: any = null;
    if (roleId) {
      dbRole = await prisma.role.findUnique({ where: { id: roleId } });
    } else if (role) {
      dbRole = await prisma.role.findFirst({
        where: { name: role, OR: tenantId ? [{ organizationId: tenantId }, { organizationId: null }] : undefined }
      });
    }

    if ((roleId || role) && !dbRole) {
      throw { status: 400, code: "INVALID_ROLE", message: "Specified role was not found" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let targetOrgId = tenantId || dbRole?.organizationId;
    if (!targetOrgId) {
      const defaultOrg = await prisma.organization.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" }
      });
      targetOrgId = defaultOrg?.id || "PLATFORM";
    }

    const createdUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          status: UserStatus.ACTIVE,
        }
      });

      if (dbRole) {
        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: targetOrgId!,
            roleId: dbRole.id,
            status: "ACTIVE"
          }
        });
      }

      return newUser;
    });

    await AuditService.logAction({
      organizationId: targetOrgId || "PLATFORM",
      actorId,
      action: "user.created",
      target: createdUser.id,
      metadata: { email, role: dbRole?.name || null }
    });

    const fullUser = await UserRepository.findById(createdUser.id);
    if (!fullUser) {
      const { passwordHash: _, ...safeUser } = createdUser;
      return safeUser;
    }
    return fullUser;
  }

  static async createPrivilegedUser(tenantId: string, data: any, actorId: string) {
    const { firstName, lastName, email, password, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { status: 400, code: "USER_EXISTS", message: "Email is already registered" };
    }

    const dbRole = await prisma.role.findFirst({
      where: { name: role, OR: [{ organizationId: tenantId }, { organizationId: null }] }
    });
    if (!dbRole) {
      throw { status: 400, code: "INVALID_ROLE", message: "Requested role not found" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          status: UserStatus.ACTIVE,
        }
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: tenantId,
          roleId: dbRole.id,
          status: "ACTIVE"
        }
      });

      return user;
    });

    await AuditService.logAction({
      organizationId: tenantId,
      actorId,
      action: "user.privileged_created",
      target: result.id,
      metadata: { role, email }
    });

    const { passwordHash: _, ...safeUser } = result;
    return safeUser;
  }
}
