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

    return prisma.evaluation.findMany({
      where: { AND: andConditions },
      include: {
        eventRound: true,
        submission: {
          include: {
            competition: { select: { id: true, name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
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
        judge: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** List evaluations assigned to the current judge within a tenant */
  static async findByJudge(tenantId: string, judgeUserId: string) {
    // Return evaluations where user is directly assigned in Evaluation or in SubmissionJudgeAssignment
    return prisma.evaluation.findMany({
      where: {
        judgeId: judgeUserId,
        OR: [
          { submission: { competition: { event: { organizationId: tenantId } } } },
          { submission: { event: { organizationId: tenantId } } }
        ]
      },
      include: {
        eventRound: true,
        submission: {
          include: {
            competition: { select: { name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
            team: { select: { name: true } },
            submittedBy: { select: { firstName: true, lastName: true, email: true } },
            files: true
          },
        },
        judge: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Find one evaluation - enforces tenant scope */
  static async findById(tenantId: string, id: string) {
    return prisma.evaluation.findFirst({
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
            competition: { select: { name: true, rubric: true, event: { select: { id: true, name: true } } } },
            event: { select: { id: true, name: true } },
            eventRound: true,
            team: { select: { name: true } },
            submittedBy: { select: { firstName: true, lastName: true, email: true } },
            files: true
          },
        },
        judge: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
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
