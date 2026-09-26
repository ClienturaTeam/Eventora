import { TeamRepository } from "../repositories/teams.repository";
import { prisma } from "../utils/prisma";

export class TeamService {
  static async getTeams(tenantId: string) {
    return TeamRepository.findAll(tenantId);
  }

  static async getTeam(tenantId: string, id: string) {
    const team = await TeamRepository.findById(tenantId, id);
    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }
    return team;
  }

  static async getMyTeam(userId: string) {
    const member = await prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            competition: { include: { event: true } },
            problemStatement: true,
            members: { include: { user: true } },
            submissions: { include: { files: true } }
          }
        }
      }
    });

    if (!member || !member.team) {
      throw { status: 404, code: "NOT_FOUND", message: "No team associated with this user." };
    }

    return member.team;
  }

  static async selectProblemStatement(userId: string, teamId: string, problemStatementId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) throw { status: 404, code: "NOT_FOUND", message: "Team not found." };

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) throw { status: 403, code: "FORBIDDEN", message: "Not authorized for this team." };

    if (team.problemStatementLocked) {
      throw {
        status: 400,
        code: "SELECTION_LOCKED",
        message: "Problem statement selection is permanently locked and cannot be modified."
      };
    }

    const ps = await prisma.problemStatement.findUnique({ where: { id: problemStatementId } });
    if (!ps) throw { status: 404, code: "NOT_FOUND", message: "Problem statement not found." };
    if (!ps.isReleased) throw { status: 400, code: "BAD_REQUEST", message: "Problem statement is not released." };

    return prisma.$transaction(async (tx) => {
      const currentTeam = await tx.team.findUnique({ where: { id: teamId } });
      if (currentTeam?.problemStatementLocked) {
        throw {
          status: 400,
          code: "SELECTION_LOCKED",
          message: "Problem statement selection is permanently locked and cannot be modified."
        };
      }

      return tx.team.update({
        where: { id: teamId },
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
    });
  }

  static async getTeamDetails(tenantId: string, id: string) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        competition: { event: { organizationId: tenantId } }
      },
      include: {
        competition: {
          include: {
            event: {
              include: {
                organization: true,
                rounds: { orderBy: { roundNumber: 'asc' } }
              }
            }
          }
        },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        problemStatement: true
      }
    });

    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found in this organization." };
    }

    const memberUserIds = team.members.map((m) => m.userId).filter(Boolean) as string[];

    // Registration & Payment
    const registration = memberUserIds.length > 0
      ? await prisma.registration.findFirst({
          where: {
            eventId: team.competition.eventId,
            userId: { in: memberUserIds }
          },
          include: { payment: true }
        })
      : null;

    // Submissions
    const submissions = await prisma.submission.findMany({
      where: { teamId: id },
      include: {
        eventRound: true,
        files: true,
        judgeAssignments: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        evaluations: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } },
            eventRound: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mentor Questions
    const mentorQuestions = memberUserIds.length > 0
      ? await prisma.mentorQuestion.findMany({
          where: {
            eventId: team.competition.eventId,
            participantId: { in: memberUserIds }
          },
          include: {
            participant: { select: { id: true, firstName: true, lastName: true, email: true } },
            mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
            replies: {
              include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      : [];

    // Form rounds list
    const eventRounds = team.competition?.event?.rounds || [];
    const roundProgress = eventRounds.map((r) => {
      const sub = submissions.find(
        (s) => s.roundId === r.id || s.eventRound?.id === r.id || s.roundNumber === r.roundNumber
      );
      return {
        round: r,
        submission: sub || null,
        evaluations: sub?.evaluations || [],
        judgeAssignments: sub?.judgeAssignments || []
      };
    });

    return {
      team,
      members: team.members,
      event: team.competition?.event,
      competition: team.competition,
      registration,
      payment: registration?.payment || null,
      problemStatement: team.problemStatement,
      submissions,
      rounds: roundProgress,
      mentorQuestions
    };
  }

  static async createTeam(tenantId: string, data: any) {
    return TeamRepository.create(tenantId, data);
  }

  static async updateTeam(tenantId: string, id: string, data: any) {
    const team = await TeamRepository.update(tenantId, id, data);
    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }
    return team;
  }

  static async deleteTeam(tenantId: string, id: string) {
    const team = await TeamRepository.findById(tenantId, id);
    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }

    const subCount = await prisma.submission.count({ where: { teamId: id } });
    if (subCount > 0) {
      throw {
        status: 400,
        code: "DEPENDENT_RECORDS_EXIST",
        message: `Cannot delete team "${team.name}" because it has ${subCount} existing submission(s).`
      };
    }

    return TeamRepository.delete(tenantId, id);
  }
}
