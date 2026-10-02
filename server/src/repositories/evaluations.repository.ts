import { prisma } from "../utils/prisma";
import { Prisma, EvaluationStatus } from "@prisma/client";

export class EvaluationRepository {
  /** List all evaluations scoped to tenant (via submission -> event -> org) with filter options */
  static async findAll(
    tenantId: string,
    filters?: { eventId?: string; roundId?: string; roundNumber?: number; status?: string; judgeId?: string }
  ) {
    const andConditions: any[] = [
      {
        OR: [
          { submission: { competition: { event: { organizationId: tenantId } } } },
          { submission: { event: { organizationId: tenantId } } }
        ]
      }
    ];

    if (filters?.eventId && filters.eventId !== "ALL") {
      andConditions.push({
        OR: [
          { submission: { eventId: filters.eventId } },
          { submission: { competition: { eventId: filters.eventId } } }
        ]
      });
    }

    if (filters?.roundId || filters?.roundNumber) {
      const roundOrConditions: any[] = [];
      if (filters.roundId) {
        roundOrConditions.push({ roundId: filters.roundId });
        roundOrConditions.push({ eventRound: { id: filters.roundId } });
        roundOrConditions.push({ submission: { roundId: filters.roundId } });
        roundOrConditions.push({ submission: { eventRound: { id: filters.roundId } } });
      }
      if (filters.roundNumber) {
        const rNum = Number(filters.roundNumber);
        roundOrConditions.push({ roundNumber: rNum });
        roundOrConditions.push({ eventRound: { roundNumber: rNum } });
        roundOrConditions.push({ submission: { roundNumber: rNum } });
        roundOrConditions.push({ submission: { eventRound: { roundNumber: rNum } } });
      }
      andConditions.push({ OR: roundOrConditions });
    }

    if (filters?.status && filters.status !== "ALL") {
      andConditions.push({ status: filters.status });
    }

    if (filters?.judgeId) {
      andConditions.push({ judgeId: filters.judgeId });
    }

    const results = await prisma.evaluation.findMany({
      where: { AND: andConditions },
      include: {
        eventRound: true,
        submission: {
          include: {
            competition: { select: { id: true, name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
            problemStatement: { select: { id: true, code: true, title: true, description: true, category: true } },
            team: {
              select: {
                id: true,
                name: true,
                competitionId: true,
                members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }
              }
            },
            submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            judgeAssignments: {
              include: {
                judge: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            },
            files: true
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return results.map((ev) => {
      if (ev.judge) {
        const fn = ev.judge.user?.firstName || ev.judge.name?.split(" ")[0] || "";
        const ln = ev.judge.user?.lastName || ev.judge.name?.split(" ").slice(1).join(" ") || "";
        (ev.judge as any).firstName = fn;
        (ev.judge as any).lastName = ln;
      }
      return ev;
    });
  }

  /** List evaluations assigned to the current judge within a tenant */
  static async findByJudge(
    tenantId: string,
    judgeUserId: string,
    profileId?: string,
    filters?: { eventId?: string; roundId?: string; roundNumber?: number }
  ) {
    const judgeConditions: any[] = [{ userId: judgeUserId }];
    if (profileId) judgeConditions.push({ id: profileId });

    let judges = await prisma.judge.findMany({
      where: { OR: judgeConditions, organizationId: tenantId },
      select: { id: true }
    });

    if (judges.length === 0) {
      // Find or create judge profile for this user
      const user = await prisma.user.findUnique({ where: { id: judgeUserId } });
      if (user) {
        const createdJudge = await prisma.judge.create({
          data: {
            userId: judgeUserId,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            email: user.email,
            organizationId: tenantId
          }
        });
        judges = [{ id: createdJudge.id }];
      }
    }

    const judgeIds = judges.map((j) => j.id);

    // Auto-sync: Ensure an Evaluation record exists for every submission assigned to this judge
    const assignments = await prisma.submissionJudgeAssignment.findMany({
      where: {
        judgeId: judgeUserId,
        submission: {
          OR: [
            { competition: { event: { organizationId: tenantId } } },
            { event: { organizationId: tenantId } }
          ]
        }
      },
      include: { submission: true }
    });

    if (judges.length > 0 && assignments.length > 0) {
      const primaryJudgeId = judges[0].id;
      for (const assignment of assignments) {
        await prisma.evaluation.upsert({
          where: {
            submissionId_judgeId: {
              submissionId: assignment.submissionId,
              judgeId: primaryJudgeId,
            }
          },
          update: {},
          create: {
            submissionId: assignment.submissionId,
            judgeId: primaryJudgeId,
            roundId: assignment.submission.roundId || null,
            roundNumber: assignment.submission.roundNumber || 1,
            status: "PENDING"
          }
        }).catch(() => {});
      }
    }

    const andConditions: any[] = [
      {
        OR: [
          { judgeId: { in: [...judgeIds, judgeUserId] } },
          { judge: { userId: judgeUserId } }
        ]
      },
      {
        OR: [
          { submission: { competition: { event: { organizationId: tenantId } } } },
          { submission: { event: { organizationId: tenantId } } }
        ]
      }
    ];

    if (filters?.eventId && filters.eventId !== "ALL") {
      andConditions.push({
        OR: [
          { submission: { eventId: filters.eventId } },
          { submission: { competition: { eventId: filters.eventId } } },
          { submission: { eventRound: { eventId: filters.eventId } } }
        ]
      });
    }

    if (filters?.roundId && filters.roundId !== "ALL") {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(filters.roundId);
      if (isUuid) {
        andConditions.push({
          OR: [
            { roundId: filters.roundId },
            { eventRound: { id: filters.roundId } },
            { submission: { roundId: filters.roundId } },
            { submission: { eventRound: { id: filters.roundId } } }
          ]
        });
      } else {
        const rNum = parseInt(filters.roundId, 10);
        if (!isNaN(rNum)) {
          andConditions.push({
            OR: [
              { roundNumber: rNum },
              { eventRound: { roundNumber: rNum } },
              { submission: { roundNumber: rNum } },
              { submission: { eventRound: { roundNumber: rNum } } }
            ]
          });
        }
      }
    }

    const results = await prisma.evaluation.findMany({
      where: { AND: andConditions },
      include: {
        eventRound: true,
        submission: {
          include: {
            competition: { select: { id: true, name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
            problemStatement: { select: { id: true, code: true, title: true, description: true, category: true } },
            team: {
              select: {
                id: true,
                name: true,
                competitionId: true,
                members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }
              }
            },
            submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            files: true
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return results.map((ev) => {
      if (ev.judge) {
        const fn = ev.judge.user?.firstName || ev.judge.name?.split(" ")[0] || "";
        const ln = ev.judge.user?.lastName || ev.judge.name?.split(" ").slice(1).join(" ") || "";
        (ev.judge as any).firstName = fn;
        (ev.judge as any).lastName = ln;
      }
      return ev;
    });
  }

  /** Find one evaluation - enforces tenant scope */
  static async findById(tenantId: string, id: string) {
    const ev = await prisma.evaluation.findFirst({
      where: {
        id,
        OR: [
          { submission: { competition: { event: { organizationId: tenantId } } } },
          { submission: { event: { organizationId: tenantId } } }
        ]
      },
      include: {
        eventRound: true,
        submission: {
          include: {
            competition: { select: { id: true, name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
            problemStatement: { select: { id: true, code: true, title: true, description: true, category: true } },
            team: {
              select: {
                id: true,
                name: true,
                competitionId: true,
                members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }
              }
            },
            submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            files: true
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
      },
    });

    if (ev && ev.judge) {
      const fn = ev.judge.user?.firstName || ev.judge.name?.split(" ")[0] || "";
      const ln = ev.judge.user?.lastName || ev.judge.name?.split(" ").slice(1).join(" ") || "";
      (ev.judge as any).firstName = fn;
      (ev.judge as any).lastName = ln;
    }

    return ev;
  }

  /** Assign a submission to a judge (create evaluation record) */
  static async create(tenantId: string, data: { submissionId: string; judgeId: string }) {
    // Verify submission belongs to tenant
    const sub = await prisma.submission.findFirst({
      where: { id: data.submissionId, competition: { event: { organizationId: tenantId } } },
    });
    if (!sub) throw new Error("Submission not found in this organization.");

    return prisma.evaluation.create({
      data: {
        submissionId: data.submissionId,
        judgeId: data.judgeId,
        status: EvaluationStatus.PENDING,
      },
    });
  }

  /** Update score / feedback / status — only the assigned judge OR an admin can do this */
  static async update(
    tenantId: string,
    id: string,
    data: Prisma.EvaluationUncheckedUpdateInput
  ) {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;
    return prisma.evaluation.update({ where: { id }, data });
  }

  static async delete(tenantId: string, id: string) {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;
    return prisma.evaluation.delete({ where: { id } });
  }
}
