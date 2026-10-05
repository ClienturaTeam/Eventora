import { prisma } from "../utils/prisma";

export class ProblemStatementService {
  static async getAll(organizationId?: string, isStudent: boolean = false, eventId?: string, userId?: string) {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (isStudent) {
      where.isReleased = true;
    }
    if (eventId && eventId !== "ALL" && eventId !== "ALL_EVENTS") {
      where.OR = [
        { eventId: eventId },
        { eventId: null }
      ];
    }

    // Security check: if student mode with specific eventId & userId, verify participant registration eligibility
    if (isStudent && eventId && eventId !== "ALL" && eventId !== "ALL_EVENTS" && userId) {
      const isRegistered = await prisma.registration.findFirst({
        where: {
          userId,
          eventId,
          status: { in: ['APPROVED', 'REGISTERED', 'PAID', 'CONFIRMED'] }
        }
      });
      if (!isRegistered) {
        return [];
      }
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
    eventId?: string | null;
    eventScope?: string;
    code: string;
    title: string;
    description: string;
    category?: string;
    isReleased?: boolean;
    applicableRoundIds?: string[];
  }) {
    let finalEventId: string | null = null;
    if (data.eventId && data.eventId !== "ALL" && data.eventId !== "ALL_EVENTS") {
      finalEventId = data.eventId;
    }

    if (finalEventId) {
      const event = await prisma.event.findUnique({ where: { id: finalEventId } });
      if (!event) {
        throw { status: 400, code: "INVALID_EVENT", message: "Specified Event does not exist." };
      }
      if (data.organizationId && event.organizationId !== data.organizationId) {
        throw { status: 403, code: "FORBIDDEN", message: "Event belongs to a different organization." };
      }
    }

    if (data.applicableRoundIds && data.applicableRoundIds.length > 0) {
      if (!finalEventId) {
        throw { status: 400, code: "EVENT_REQUIRED", message: "Applicable rounds can only be configured when a specific event is selected." };
      }
      const rounds = await prisma.eventRound.findMany({
        where: { id: { in: data.applicableRoundIds } }
      });

      for (const r of rounds) {
        if (r.eventId !== finalEventId) {
          throw {
            status: 400,
            code: "INVALID_ROUND_ASSIGNMENT",
            message: `Round '${r.name}' (${r.id}) does not belong to Event '${finalEventId}'. Cross-event round assignment is rejected.`
          };
        }
      }
    }

    return prisma.problemStatement.create({
      data: {
        organizationId: data.organizationId,
        eventId: finalEventId,
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
      eventId?: string | null;
      title?: string;
      description?: string;
      category?: string;
      isReleased?: boolean;
      applicableRoundIds?: string[];
    }
  ) {
    const existing = await this.getById(id);
    let targetEventId = existing.eventId;

    if (data.eventId !== undefined) {
      targetEventId = (data.eventId && data.eventId !== "ALL" && data.eventId !== "ALL_EVENTS") ? data.eventId : null;

      if (targetEventId !== existing.eventId) {
        const lockedTeamsCount = await prisma.team.count({
          where: {
            problemStatementId: id,
            problemStatementLocked: true
          }
        });
        const submissionsCount = await prisma.submission.count({
          where: {
            problemStatementId: id
          }
        });

        if (lockedTeamsCount > 0 || submissionsCount > 0) {
          throw {
            status: 400,
            code: "CANNOT_CHANGE_EVENT",
            message: `Cannot change event assignment for problem statement '${existing.code}' because ${lockedTeamsCount > 0 ? `${lockedTeamsCount} team(s) have already locked` : `${submissionsCount} submission(s) exist for`} this problem statement.`
          };
        }
      }
    }

    if (targetEventId) {
      const event = await prisma.event.findUnique({ where: { id: targetEventId } });
      if (!event) {
        throw { status: 400, code: "INVALID_EVENT", message: "Specified Event does not exist." };
      }
      if (event.organizationId !== existing.organizationId) {
        throw { status: 403, code: "FORBIDDEN", message: "Event belongs to a different organization." };
      }
    }

    if (data.applicableRoundIds && data.applicableRoundIds.length > 0) {
      if (!targetEventId) {
        throw { status: 400, code: "EVENT_REQUIRED", message: "Applicable rounds can only be configured when a specific event is selected." };
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
        ...(data.eventId !== undefined ? { eventId: targetEventId } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.isReleased !== undefined ? { isReleased: data.isReleased } : {}),
        ...(data.applicableRoundIds !== undefined ? {
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

  static async selectProblemStatement(userId: string, problemStatementId: string, teamId?: string) {
    // 1. Verify problem statement exists and is released
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

    // 2. Find authenticated user's relevant team
    let member = null;

    if (teamId) {
      member = await prisma.teamMember.findFirst({
        where: { userId, teamId },
        include: {
          team: {
            include: {
              competition: { include: { event: true } },
              problemStatement: true
            }
          }
        }
      });
    }

    if (!member && ps.eventId) {
      member = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: {
            competition: {
              eventId: ps.eventId
            }
          }
        },
        include: {
          team: {
            include: {
              competition: { include: { event: true } },
              problemStatement: true
            }
          }
        }
      });
    }

    if (!member || !member.team) {
      if (ps.eventId) {
        const registration = await prisma.registration.findFirst({
          where: {
            userId,
            eventId: ps.eventId,
            status: { in: ['APPROVED', 'PAID'] }
          }
        });
        if (registration) {
          let comp = await prisma.competition.findFirst({ where: { eventId: ps.eventId } });
          if (!comp) {
            comp = await prisma.competition.create({
              data: { eventId: ps.eventId, name: "Main Track", description: "Default competition track" }
            });
          }
          const userObj = await prisma.user.findUnique({ where: { id: userId } });
          const newTeam = await prisma.team.create({
            data: {
              competitionId: comp.id,
              name: `${userObj?.firstName || 'Participant'}'s Team`,
              size: 1,
              members: {
                create: [
                  {
                    userId,
                    name: `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.trim() || 'Lead',
                    email: userObj?.email || '',
                    isLead: true
                  }
                ]
              }
            },
            include: {
              competition: { include: { event: true } },
              problemStatement: true
            }
          });
          member = { team: newTeam } as any;
        }
      }
    }

    if (!member || !member.team) {
      throw { status: 404, code: "NOT_FOUND", message: "No team or approved registration associated with this user for this event." };
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
