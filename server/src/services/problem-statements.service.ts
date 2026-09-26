import { prisma } from "../utils/prisma";

export class ProblemStatementService {
  static async getAll(organizationId?: string, isStudent: boolean = false, eventId?: string) {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (isStudent) {
      where.isReleased = true;
    }
    if (eventId) {
      where.OR = [
        { eventId: eventId },
        { eventId: null }
      ];
    }

    return prisma.problemStatement.findMany({
      where,
      include: {
        event: { select: { id: true, name: true } },
        applicableRounds: { orderBy: { roundNumber: "asc" } },
        teams: { select: { id: true, name: true, problemStatementLocked: true } }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  static async getById(id: string) {
    const statement = await prisma.problemStatement.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, name: true } },
        applicableRounds: { orderBy: { roundNumber: "asc" } },
        teams: true
      }
    });
    if (!statement) {
      throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    }
    return statement;
  }

  static async create(data: {
    organizationId: string;
    eventId?: string;
    code: string;
    title: string;
    description: string;
    category?: string;
    isReleased?: boolean;
    applicableRoundIds?: string[];
  }) {
    if (data.eventId) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) {
        throw { status: 400, code: "INVALID_EVENT", message: "Specified Event does not exist." };
      }
      if (data.organizationId && event.organizationId !== data.organizationId) {
        throw { status: 403, code: "FORBIDDEN", message: "Event belongs to a different organization." };
      }
    }

    if (data.applicableRoundIds && data.applicableRoundIds.length > 0) {
      if (!data.eventId) {
        throw { status: 400, code: "EVENT_REQUIRED", message: "An Event must be selected to assign applicable rounds." };
      }
      const rounds = await prisma.eventRound.findMany({
        where: { id: { in: data.applicableRoundIds } }
      });

      for (const r of rounds) {
        if (r.eventId !== data.eventId) {
          throw {
            status: 400,
            code: "INVALID_ROUND_ASSIGNMENT",
            message: `Round '${r.name}' (${r.id}) does not belong to Event '${data.eventId}'. Cross-event round assignment is rejected.`
          };
        }
      }
    }

    return prisma.problemStatement.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId || null,
        code: data.code,
        title: data.title,
        description: data.description,
        category: data.category,
        isReleased: data.isReleased ?? false,
        applicableRounds: data.applicableRoundIds && data.applicableRoundIds.length > 0
          ? { connect: data.applicableRoundIds.map((id) => ({ id })) }
          : undefined
      },
      include: {
        event: { select: { id: true, name: true } },
        applicableRounds: { orderBy: { roundNumber: "asc" } }
      }
    });
  }

  static async update(
    id: string,
    data: {
      eventId?: string;
      title?: string;
      description?: string;
      category?: string;
      isReleased?: boolean;
      applicableRoundIds?: string[];
    }
  ) {
    const existing = await this.getById(id);
    const targetEventId = data.eventId !== undefined ? data.eventId : existing.eventId;

    if (data.eventId) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) {
        throw { status: 400, code: "INVALID_EVENT", message: "Specified Event does not exist." };
      }
      if (event.organizationId !== existing.organizationId) {
        throw { status: 403, code: "FORBIDDEN", message: "Event belongs to a different organization." };
      }
    }

    if (data.applicableRoundIds && data.applicableRoundIds.length > 0) {
      if (!targetEventId) {
        throw { status: 400, code: "EVENT_REQUIRED", message: "An Event must be selected to assign applicable rounds." };
      }

      const rounds = await prisma.eventRound.findMany({
        where: { id: { in: data.applicableRoundIds } }
      });

      for (const r of rounds) {
        if (r.eventId !== targetEventId) {
          throw {
            status: 400,
            code: "INVALID_ROUND_ASSIGNMENT",
            message: `Round '${r.name}' (${r.id}) does not belong to Event '${targetEventId}'. Cross-event round assignment is rejected.`
          };
        }
      }
    }

    return prisma.problemStatement.update({
      where: { id },
      data: {
        ...(data.eventId !== undefined ? { eventId: data.eventId || null } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.isReleased !== undefined ? { isReleased: data.isReleased } : {}),
        ...(data.applicableRoundIds ? {
          applicableRounds: {
            set: data.applicableRoundIds.map((rId) => ({ id: rId }))
          }
        } : {})
      },
      include: {
        event: { select: { id: true, name: true } },
        applicableRounds: { orderBy: { roundNumber: "asc" } }
      }
    });
  }

  static async release(id: string) {
    await this.getById(id);
    return prisma.problemStatement.update({
      where: { id },
      data: { isReleased: true },
      include: {
        event: { select: { id: true, name: true } },
        applicableRounds: { orderBy: { roundNumber: "asc" } }
      }
    });
  }

  static async selectProblemStatement(userId: string, problemStatementId: string) {
    // Find authenticated user's team
    const member = await prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            competition: { include: { event: true } },
            problemStatement: true
          }
        }
      }
    });

    if (!member || !member.team) {
      throw { status: 404, code: "NOT_FOUND", message: "No team associated with this user." };
    }

    const team = member.team;

    // Strict immutability lock check
    if (team.problemStatementLocked || team.problemStatementId) {
      throw {
        status: 400,
        code: "SELECTION_LOCKED",
        message: "Problem statement selection is permanently locked and cannot be modified."
      };
    }

    // Verify problem statement exists and is released
    const ps = await prisma.problemStatement.findUnique({
      where: { id: problemStatementId },
      include: { applicableRounds: true }
    });

    if (!ps) {
      throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    }

    if (!ps.isReleased) {
      throw { status: 400, code: "BAD_REQUEST", message: "This problem statement is not yet released for selection." };
    }

    const teamEventId = team.competition?.eventId;
    if (ps.eventId && teamEventId && ps.eventId !== teamEventId) {
      throw {
        status: 400,
        code: "INVALID_EVENT",
        message: "This problem statement belongs to a different event."
      };
    }

    return prisma.$transaction(async (tx) => {
      // Re-fetch with lock inside transaction
      const currentTeam = await tx.team.findUnique({
        where: { id: team.id }
      });

      if (currentTeam?.problemStatementLocked || currentTeam?.problemStatementId) {
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
          problemStatement: {
            include: { applicableRounds: true }
          },
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
