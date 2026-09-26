import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";

export class SubmissionRepository {
  static async findAll(tenantId: string, filters?: { eventId?: string; roundId?: string; roundNumber?: number; problemStatementId?: string; status?: string; judgeId?: string; userId?: string }) {
    const andConditions: any[] = [
      {
        OR: [
          { competition: { event: { organizationId: tenantId } } },
          { event: { organizationId: tenantId } }
        ]
      }
    ];

    if (filters?.eventId) {
      andConditions.push({
        OR: [
          { eventId: filters.eventId },
          { competition: { eventId: filters.eventId } }
        ]
      });
    }

    if (filters?.roundId || filters?.roundNumber) {
      const roundOrConditions: any[] = [];
      if (filters.roundId) {
        roundOrConditions.push({ roundId: filters.roundId });
        roundOrConditions.push({ eventRound: { id: filters.roundId } });
      }
      if (filters.roundNumber) {
        const rNum = Number(filters.roundNumber);
        roundOrConditions.push({ roundNumber: rNum });
        roundOrConditions.push({ eventRound: { roundNumber: rNum } });
      }
      andConditions.push({ OR: roundOrConditions });
    }

    if (filters?.problemStatementId && filters.problemStatementId !== "ALL") {
      andConditions.push({ problemStatementId: filters.problemStatementId });
    }

    if (filters?.status && filters.status !== "ALL") {
      andConditions.push({ status: filters.status });
    }

    if (filters?.judgeId) {
      andConditions.push({
        judgeAssignments: {
          some: { judgeId: filters.judgeId }
        }
      });
    }

    if (filters?.userId) {
      andConditions.push({
        OR: [
          { submittedById: filters.userId },
          { team: { members: { some: { userId: filters.userId } } } }
        ]
      });
    }

    const where = { AND: andConditions };

    return prisma.submission.findMany({
      where,
      include: {
        competition: { select: { name: true, event: { select: { name: true } } } },
        event: { select: { id: true, name: true } },
        eventRound: true,
        problemStatement: { select: { id: true, code: true, title: true, description: true, category: true } },
        team: { select: { name: true, members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } } },
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        files: true,
        judgeAssignments: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        evaluations: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        _count: { select: { evaluations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findById(tenantId: string, id: string) {
    return prisma.submission.findFirst({
      where: {
        id,
        OR: [
          { competition: { event: { organizationId: tenantId } } },
          { event: { organizationId: tenantId } }
        ]
      },
      include: {
        competition: { select: { name: true, event: { select: { name: true } } } },
        event: { select: { id: true, name: true } },
        eventRound: true,
        problemStatement: { select: { id: true, code: true, title: true, description: true, category: true } },
        team: { select: { name: true, members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } } },
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        files: true,
        judgeAssignments: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        evaluations: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });
  }

  static async create(tenantId: string, data: Prisma.SubmissionUncheckedCreateInput) {
    const comp = await prisma.competition.findFirst({ 
      where: { id: data.competitionId, event: { organizationId: tenantId } } 
    });
    if (!comp) throw new Error("Invalid competition ID");

    const team = await prisma.team.findFirst({
      where: { id: data.teamId as string, competitionId: data.competitionId }
    });
    if (!team) throw new Error("Invalid team ID");

    return prisma.submission.create({ data });
  }

  static async update(tenantId: string, id: string, data: Prisma.SubmissionUncheckedUpdateInput) {
    const sub = await this.findById(tenantId, id);
    if (!sub) return null;

    if (data.competitionId) {
      const comp = await prisma.competition.findFirst({ 
        where: { id: data.competitionId as string, event: { organizationId: tenantId } } 
      });
      if (!comp) throw new Error("Invalid competition ID");
    }

    return prisma.submission.update({ where: { id }, data });
  }

  static async delete(tenantId: string, id: string) {
    const sub = await this.findById(tenantId, id);
    if (!sub) return null;
    return prisma.submission.delete({ where: { id } });
  }
}
