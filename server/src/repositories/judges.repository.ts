import { prisma } from "../utils/prisma";

export class JudgeRepository {
  static async findAll(tenantId: string) {
    const judges = await prisma.judge.findMany({
      where: { organizationId: tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        competitions: {
          include: {
            competition: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return judges.map(j => ({
      ...j,
      user: { firstName: j.name, lastName: "", email: j.email } // Compatibility for frontend
    }));
  }

  static async findById(tenantId: string, id: string) {
    return prisma.judge.findFirst({
      where: { id, organizationId: tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        competitions: {
          include: {
            competition: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async findByUserId(tenantId: string, userId: string) {
    return prisma.judge.findFirst({
      where: { userId, organizationId: tenantId },
    });
  }

  static async create(tenantId: string, data: { name: string; email: string; expertise?: string; bio?: string }) {
    return prisma.judge.create({
      data: { 
        name: data.name,
        email: data.email,
        organizationId: tenantId, 
        expertise: data.expertise, 
        bio: data.bio 
      },
    });
  }

  static async update(tenantId: string, id: string, data: { expertise?: string; bio?: string }) {
    const judge = await this.findById(tenantId, id);
    if (!judge) return null;
    return prisma.judge.update({ where: { id }, data });
  }

  static async delete(tenantId: string, id: string) {
    const judge = await this.findById(tenantId, id);
    if (!judge) return null;
    return prisma.judge.delete({ where: { id } });
  }

  static async assignCompetition(tenantId: string, judgeId: string, competitionId: string) {
    // Verify competition belongs to tenant
    const comp = await prisma.competition.findFirst({
      where: { id: competitionId, event: { organizationId: tenantId } },
    });
    if (!comp) throw new Error("Competition not found in this organization.");

    const judge = await this.findById(tenantId, judgeId);
    if (!judge) throw new Error("Judge not found.");

    return prisma.judgeCompetition.create({
      data: { judgeId, competitionId },
    });
  }

  static async removeCompetition(tenantId: string, judgeId: string, competitionId: string) {
    const judge = await this.findById(tenantId, judgeId);
    if (!judge) throw new Error("Judge not found.");

    return prisma.judgeCompetition.deleteMany({
      where: { judgeId, competitionId },
    });
  }

  /** Get evaluation stats for all judges in the tenant */
  static async getEvaluationStats(tenantId: string) {
    const judges = await this.findAll(tenantId);
    const stats = await Promise.all(
      judges.map(async (j) => {
        const evals = await prisma.evaluation.findMany({
          where: {
            judgeId: j.id,
            submission: { competition: { event: { organizationId: tenantId } } },
          },
          select: { score: true, status: true },
        });
        const completed = evals.filter((e) => e.status === "COMPLETED");
        const scores = completed.map((e) => e.score).filter((s) => s !== null) as number[];
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          ...j,
          _evalStats: {
            assigned: evals.length,
            completed: completed.length,
            avgScore: Math.round(avgScore * 10) / 10,
          },
        };
      })
    );
    return stats;
  }
}
