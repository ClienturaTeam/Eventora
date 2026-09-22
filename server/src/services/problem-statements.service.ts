import { prisma } from "../utils/prisma";

export class ProblemStatementService {
  static async getAll(organizationId?: string, isStudent: boolean = false) {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (isStudent) {
      where.isReleased = true;
    }

    return prisma.problemStatement.findMany({
      where,
      orderBy: { createdAt: "asc" }
    });
  }

  static async getById(id: string) {
    const statement = await prisma.problemStatement.findUnique({
      where: { id }
    });
    if (!statement) {
      throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    }
    return statement;
  }

  static async create(data: { organizationId: string; code: string; title: string; description: string; category?: string; isReleased?: boolean }) {
    return prisma.problemStatement.create({
      data: {
        organizationId: data.organizationId,
        code: data.code,
        title: data.title,
        description: data.description,
        category: data.category,
        isReleased: data.isReleased ?? false
      }
    });
  }

  static async update(id: string, data: { title?: string; description?: string; category?: string; isReleased?: boolean }) {
    await this.getById(id);
    return prisma.problemStatement.update({
      where: { id },
      data
    });
  }

  static async release(id: string) {
    await this.getById(id);
    return prisma.problemStatement.update({
      where: { id },
      data: { isReleased: true }
    });
  }

  static async selectProblemStatement(userId: string, problemStatementId: string) {
    // Find authenticated user's team
    const member = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true }
    });

    if (!member || !member.team) {
      throw { status: 404, code: "NOT_FOUND", message: "No team associated with this user." };
    }

    const team = member.team;

    // Strict immutability lock check
    if (team.problemStatementLocked) {
      throw {
        status: 400,
        code: "SELECTION_LOCKED",
        message: "Problem statement selection is permanently locked and cannot be modified."
      };
    }

    // Verify problem statement exists and is released
    const ps = await prisma.problemStatement.findUnique({
      where: { id: problemStatementId }
    });

    if (!ps) {
      throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    }

    if (!ps.isReleased) {
      throw { status: 400, code: "BAD_REQUEST", message: "This problem statement is not yet released for selection." };
    }

    return prisma.$transaction(async (tx) => {
      // Re-fetch with lock inside transaction
      const currentTeam = await tx.team.findUnique({
        where: { id: team.id }
      });

      if (currentTeam?.problemStatementLocked) {
        throw {
          status: 400,
          code: "SELECTION_LOCKED",
          message: "Problem statement selection is permanently locked and cannot be modified."
        };
      }

      const updatedTeam = await tx.team.update({
        where: { id: team.id },
        data: {
          problemStatementId: ps.id,
          problemStatementLocked: true,
          problemStatementSelectedAt: new Date()
        },
        include: {
          problemStatement: true,
          members: true
        }
      });

      // Send notification
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        const orgId = ps.organizationId || (await tx.organization.findFirst())?.id || "";
        await tx.notification.create({
          data: {
            organizationId: orgId,
            recipientUserId: userId,
            title: "Problem Statement Locked",
            message: `Your team '${team.name}' selected '${ps.code}: ${ps.title}'. Selection is now permanently locked.`,
            type: "SYSTEM"
          }
        });
      }

      return updatedTeam;
    });
  }

  static async adminOverrideProblemStatement(
    adminUserId: string,
    teamId: string,
    problemStatementId: string,
    reason: string
  ) {
    if (!reason || !reason.trim()) {
      throw { status: 400, code: "BAD_REQUEST", message: "Reason for admin override is required." };
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });
    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }

    const ps = await prisma.problemStatement.findUnique({
      where: { id: problemStatementId }
    });
    if (!ps) {
      throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        problemStatementId: ps.id,
        problemStatementLocked: true,
        problemStatementSelectedAt: new Date()
      },
      include: { problemStatement: true, members: true }
    });

    const orgId = ps.organizationId || (await prisma.organization.findFirst())?.id || "";

    const { AuditService } = await import("./audit.service");
    const { NotificationService } = await import("./notifications.service");

    await AuditService.logAction({
      organizationId: orgId,
      actorId: adminUserId,
      action: "ADMIN_OVERRIDE_PROBLEM_STATEMENT",
      target: teamId,
      metadata: { reason: reason.trim(), newProblemStatementId: ps.id, previousProblemStatementId: team.problemStatementId }
    });

    for (const member of team.members) {
      if (member.userId) {
        await NotificationService.create({
          organizationId: orgId,
          recipientUserId: member.userId,
          title: "Problem Statement Updated by Admin",
          message: `An admin updated your team's problem statement to '${ps.code}: ${ps.title}'. Reason: ${reason.trim()}`,
          type: "SYSTEM"
        });
      }
    }

    return updatedTeam;
  }
}
