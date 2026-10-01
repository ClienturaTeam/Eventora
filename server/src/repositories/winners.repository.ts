import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";

export class WinnersRepository {
  static async findMany(
    organizationId: string,
    filters?: {
      competitionId?: string;
      status?: string;
    }
  ) {
    const where: Prisma.WinnerWhereInput = { organizationId };
    
    if (filters?.competitionId) where.competitionId = filters.competitionId;
    if (filters?.status) where.status = filters.status;

    return prisma.winner.findMany({
      where,
      include: {
        competition: { select: { id: true, name: true, event: { select: { id: true, name: true } } } },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        prize: true,
        submission: {
          select: {
            id: true,
            title: true,
            evaluations: {
              where: { status: 'COMPLETED' },
              select: { id: true, score: true, feedback: true }
            }
          }
        },
        selector: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findById(id: string, organizationId: string) {
    return prisma.winner.findUnique({
      where: { id_organizationId: { id, organizationId } } as any, // Not compound unique, so we use findFirst
    });
  }
  
  static async findFirst(id: string, organizationId: string) {
    return prisma.winner.findFirst({
      where: { id, organizationId },
      include: {
        competition: { select: { id: true, name: true, event: { select: { id: true, name: true } } } },
        submission: true,
        team: {
          include: {
            members: { include: { user: true } }
          }
        },
        user: true,
        prize: true
      }
    });
  }

  static async create(data: Prisma.WinnerUncheckedCreateInput) {
    return prisma.winner.create({
      data,
      include: {
        competition: true,
        submission: true,
        team: true,
        user: true,
        prize: true
      }
    });
  }

  static async update(id: string, organizationId: string, data: Prisma.WinnerUpdateInput) {
    // Ensure the record belongs to the organization
    const existing = await this.findFirst(id, organizationId);
    if (!existing) throw new Error("Winner not found");

    return prisma.winner.update({
      where: { id },
      data,
      include: {
        competition: true,
        submission: true,
        team: true,
        user: true,
        prize: true
      }
    });
  }

  static async getPrizes(organizationId: string, competitionId?: string) {
    const where: Prisma.PrizeWhereInput = { organizationId };
    if (competitionId) where.competitionId = competitionId;
    
    return prisma.prize.findMany({
      where,
      include: {
        competition: { select: { id: true, name: true, event: { select: { name: true } } } },
        winners: {
          include: {
            team: { select: { id: true, name: true } },
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getDashboardMetrics(organizationId: string) {
    const totalWinners = await prisma.winner.count({ where: { organizationId } });
    const finalizedCompetitions = await prisma.winner.groupBy({
      by: ['competitionId'],
      where: { organizationId, status: 'FINALIZED' }
    });

    const pendingPrizesAgg = await prisma.prize.aggregate({
      where: { organizationId, status: 'PENDING' },
      _sum: { value: true, amount: true }
    });

    const paidPrizesAgg = await prisma.prize.aggregate({
      where: { organizationId, status: 'PAID' },
      _sum: { value: true, amount: true }
    });

    const pendingPrizeValue = (pendingPrizesAgg._sum.value || 0) + (pendingPrizesAgg._sum.amount || 0);
    const paidPrizeValue = (paidPrizesAgg._sum.value || 0) + (paidPrizesAgg._sum.amount || 0);

    const pendingPrizesList = await prisma.prize.findMany({
      where: { organizationId, status: 'PENDING' },
      include: {
        competition: { select: { id: true, name: true, event: { select: { name: true } } } },
        winners: {
          include: {
            team: { select: { name: true } },
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      take: 8
    });

    const pendingPrizes = pendingPrizesList.map((p) => {
      const recipientName =
        p.winners[0]?.team?.name ||
        (p.winners[0]?.user ? `${p.winners[0].user.firstName} ${p.winners[0].user.lastName}` : null) ||
        p.name;
      return {
        id: p.id,
        name: recipientName,
        comp: p.competition?.name || "Competition",
        prize: `${p.currency || 'INR'} ${(p.value || p.amount || 0).toLocaleString()}`,
        status: p.status,
        value: p.value || p.amount || 0,
        currency: p.currency || 'INR'
      };
    });

    // Group winners by competition
    const winnersByComp = await prisma.winner.groupBy({
      by: ['competitionId'],
      where: { organizationId },
      _count: { id: true }
    });

    const compIds = winnersByComp.map((w) => w.competitionId);
    const comps = await prisma.competition.findMany({
      where: { id: { in: compIds } },
      select: { id: true, name: true }
    });
    const compMap = new Map(comps.map((c) => [c.id, c.name]));

    const winnersByOrganization = winnersByComp.map((w) => ({
      org: compMap.get(w.competitionId) || 'Competition Track',
      winners: w._count.id
    }));

    if (winnersByOrganization.length === 0) {
      const allComps = await prisma.competition.findMany({
        where: { event: { organizationId } },
        select: { name: true },
        take: 5
      });
      allComps.forEach((c) => {
        winnersByOrganization.push({ org: c.name, winners: 0 });
      });
    }

    // Competitions summary
    const competitions = await prisma.competition.findMany({
      where: { event: { organizationId } },
      include: {
        event: { select: { name: true } },
        _count: {
          select: {
            submissions: true,
            winners: true
          }
        },
        submissions: {
          include: {
            _count: {
              select: {
                evaluations: true
              }
            }
          }
        }
      }
    });

    const competitionsSummary = competitions.map((c) => {
      const evaluatedCount = c.submissions.filter((s) => s._count.evaluations > 0).length;
      return {
        id: c.id,
        name: c.name,
        eventName: c.event.name,
        totalSubmissions: c._count.submissions,
        evaluatedSubmissions: evaluatedCount,
        totalWinners: c._count.winners,
        isReadyForSelection: c._count.submissions > 0 && evaluatedCount === c._count.submissions
      };
    });

    const totalEvaluatedSubmissions = await prisma.evaluation.count({
      where: {
        submission: {
          competition: {
            event: { organizationId }
          }
        },
        status: 'COMPLETED'
      }
    });

    return {
      totalWinners,
      finalizedCompetitions: finalizedCompetitions.length,
      pendingPrizeValue,
      paidPrizeValue,
      totalEvaluatedSubmissions,
      pendingPrizes,
      winnersByOrganization,
      competitionsSummary
    };
  }
}
