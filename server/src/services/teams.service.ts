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
    const team = await TeamRepository.delete(tenantId, id);
    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }
    return true;
  }
}
