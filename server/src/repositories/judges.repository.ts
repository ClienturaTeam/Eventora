import { prisma } from "../utils/prisma";

export class JudgeRepository {
  /** Ensure all OrganizationMembers with JUDGE role have a Judge record */
  private static async syncOrgJudgeUsers(tenantId: string) {
    try {
      const judgeMembers = await prisma.organizationMember.findMany({
        where: {
          organizationId: tenantId,
          role: {
            name: {
              contains: "Judge",
              mode: "insensitive",
            },
          },
        },
        include: {
          user: true,
        },
      });

      for (const member of judgeMembers) {
        if (!member.user) continue;

        // Check if Judge profile exists by userId or email
        const existingJudge = await prisma.judge.findFirst({
          where: {
            organizationId: tenantId,
            OR: [
              { userId: member.userId },
              { email: member.user.email },
            ],
          },
        });

        if (!existingJudge) {
          const fullName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || member.user.email;
          await prisma.judge.create({
            data: {
              organizationId: tenantId,
              userId: member.userId,
              name: fullName,
              email: member.user.email,
              expertise: "General",
            },
          });
        } else if (!existingJudge.userId) {
          // Link missing userId
          await prisma.judge.update({
            where: { id: existingJudge.id },
            data: { userId: member.userId },
          });
        }
      }
    } catch (err) {
      console.error("Error auto-syncing judge users:", err);
    }
  }

  static async findAll(tenantId: string) {
    await this.syncOrgJudgeUsers(tenantId);

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

    return judges.map(j => {
      const firstName = j.user?.firstName || j.name.split(" ")[0] || j.name;
      const lastName = j.user?.lastName || j.name.split(" ").slice(1).join(" ") || "";
      const email = j.user?.email || j.email;

      return {
        ...j,
        user: {
          id: j.user?.id || j.userId || j.id,
          firstName,
          lastName,
          email,
        },
      };
    });
  }

  static async findById(tenantId: string, id: string) {
    const judge = await prisma.judge.findFirst({
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

    if (!judge) return null;

    const firstName = judge.user?.firstName || judge.name.split(" ")[0] || judge.name;
    const lastName = judge.user?.lastName || judge.name.split(" ").slice(1).join(" ") || "";
    const email = judge.user?.email || judge.email;

    return {
      ...judge,
      user: {
        id: judge.user?.id || judge.userId || judge.id,
        firstName,
        lastName,
        email,
      },
    };
  }

  static async findByUserId(tenantId: string, userId: string) {
    return prisma.judge.findFirst({
      where: { userId, organizationId: tenantId },
    });
  }

  static async create(tenantId: string, data: { name: string; email: string; expertise?: string; bio?: string }) {
    // Check if a User with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Check if a Judge profile already exists in this tenant
    const existingJudge = await prisma.judge.findFirst({
      where: {
        organizationId: tenantId,
        OR: [
          { email: data.email },
          ...(existingUser ? [{ userId: existingUser.id }] : []),
        ],
      },
    });

    if (existingJudge) {
      // Update and return existing judge profile instead of throwing conflict or creating duplicate
      return prisma.judge.update({
        where: { id: existingJudge.id },
        data: {
          name: data.name || existingJudge.name,
          expertise: data.expertise || existingJudge.expertise,
          bio: data.bio || existingJudge.bio,
          userId: existingUser?.id || existingJudge.userId,
        },
      });
    }

    return prisma.judge.create({
      data: { 
        name: data.name,
        email: data.email,
        organizationId: tenantId, 
        userId: existingUser?.id || null,
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

