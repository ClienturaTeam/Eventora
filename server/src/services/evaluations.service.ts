import { EvaluationRepository } from "../repositories/evaluations.repository";
import { AuditService } from "./audit.service";
import { NotificationService } from "./notifications.service";
import { prisma } from "../utils/prisma";

export class EvaluationService {
  static async getEvaluations(
    tenantId: string,
    filters?: { eventId?: string; roundId?: string; roundNumber?: number; status?: string; judgeId?: string }
  ) {
    if (filters?.roundId) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(filters.roundId);
      if (!isUuid) {
        const parsed = parseInt(filters.roundId, 10);
        if (!isNaN(parsed)) {
          filters.roundNumber = parsed;
          delete filters.roundId;
        }
      }
    }
    return EvaluationRepository.findAll(tenantId, filters);
  }

  static async getMyEvaluations(
    tenantId: string,
    judgeUserId: string,
    profileId?: string,
    filters?: { eventId?: string; roundId?: string; roundNumber?: number }
  ) {
    return EvaluationRepository.findByJudge(tenantId, judgeUserId, profileId, filters);
  }

  static async getEvaluation(tenantId: string, id: string) {
    const ev = await EvaluationRepository.findById(tenantId, id);
    if (!ev) throw { status: 404, code: "NOT_FOUND", message: "Evaluation not found." };
    return ev;
  }

  static async createEvaluation(tenantId: string, data: { submissionId: string; judgeId: string }) {
    try {
      return await EvaluationRepository.create(tenantId, data);
    } catch (err: any) {
      if (err.code === "P2002") {
        throw { status: 409, code: "CONFLICT", message: "This judge is already assigned to this submission." };
      }
      throw err;
    }
  }

  static async updateEvaluation(
    tenantId: string,
    id: string,
    actorUserId: string,
    isAdmin: boolean,
    data: {
      score?: number;
      scores?: Record<string, number>;
      feedback?: string;
      status?: string;
      recommendation?: "QUALIFY" | "REJECT" | string;
    }
  ) {
    const ev = await EvaluationRepository.findById(tenantId, id);
    if (!ev) throw { status: 404, code: "NOT_FOUND", message: "Evaluation not found." };

    const judgeRecord = await prisma.judge.findFirst({
      where: {
        OR: [{ userId: actorUserId }, { id: actorUserId }],
        organizationId: tenantId
      }
    });

    const isAssignedToUser = Boolean((judgeRecord && ev.judgeId === judgeRecord.id) || ev.judgeId === actorUserId);

    // Verify judge assignment unless admin
    if (!isAdmin) {
      const assignment = await prisma.submissionJudgeAssignment.findFirst({
        where: {
          submissionId: ev.submissionId,
          judgeId: actorUserId,
        }
      });

      if (!assignment && !isAssignedToUser) {
        throw {
          status: 403,
          code: "FORBIDDEN",
          message: "You are not assigned to evaluate this submission.",
        };
      }
    }

    // Strict Role Constraint: Admins CANNOT enter or directly edit judge scores for another judge.
    if (isAdmin && !isAssignedToUser) {
      throw {
        status: 403,
        code: "FORBIDDEN",
        message: "Admins cannot directly edit judge evaluation scores. Please request a score correction from the judge.",
      };
    }

    if (!isAssignedToUser) {
      throw {
        status: 403,
        code: "FORBIDDEN",
        message: "You are not authorized to update another judge's evaluation.",
      };
    }

    let finalScore = data.score;
    let finalFeedback = data.feedback;

    if (data.scores && ev.submission.competition?.rubric) {
      const rubric = ev.submission.competition.rubric as any;
      if (rubric.criteria && Array.isArray(rubric.criteria)) {
        let calculatedScore = 0;
        let isValid = true;

        for (const crit of rubric.criteria) {
          const scoreForCrit = data.scores[crit.crit];
          if (scoreForCrit !== undefined) {
            calculatedScore += scoreForCrit;
          } else {
            isValid = false;
          }
        }

        if (isValid) {
          finalScore = calculatedScore;
          const scoresSummary = Object.entries(data.scores).map(([k, v]) => `${k}: ${v}`).join('\n');
          finalFeedback = `[Rubric Scores]\n${scoresSummary}\n\n${data.feedback || ''}`;
        }
      }
    }

    // Dynamic maxMarks validation against actual EventRound
    const sub = await prisma.submission.findUnique({
      where: { id: ev.submissionId },
      include: { eventRound: true }
    });
    const maxMarks = sub?.eventRound?.maxMarks ?? (ev as any).eventRound?.maxMarks ?? (ev as any).submission?.eventRound?.maxMarks ?? 100;

    if (finalScore !== undefined) {
      if (finalScore < 0) {
        throw { status: 400, code: "BAD_REQUEST", message: "Marks cannot be negative." };
      }
      if (finalScore > maxMarks) {
        throw { status: 400, code: "BAD_REQUEST", message: `Marks cannot exceed maximum marks (${maxMarks}) for this round.` };
      }
    }

    const requestedStatus = data.status || "COMPLETED";
    const updatePayload: any = {
      status: requestedStatus,
      recommendation: data.recommendation || ev.recommendation,
      criteriaScores: data.scores || ev.criteriaScores,
      lockedAt: new Date(),
    };

    if (finalScore !== undefined) updatePayload.score = finalScore;
    if (finalFeedback !== undefined) updatePayload.feedback = finalFeedback;

    const updated = await EvaluationRepository.update(tenantId, id, updatePayload);
    if (!updated) throw { status: 404, code: "NOT_FOUND", message: "Evaluation not found." };

    // Update submission status to EVALUATED
    await prisma.submission.update({
      where: { id: ev.submissionId },
      data: { status: "EVALUATED" }
    }).catch(() => {});

    return updated;
  }

  static async requestCorrection(
    tenantId: string,
    id: string,
    adminUserId: string,
    reason: string
  ) {
    if (!reason || !reason.trim()) {
      throw { status: 400, code: "BAD_REQUEST", message: "A correction reason is required." };
    }

    const ev = await EvaluationRepository.findById(tenantId, id);
    if (!ev) throw { status: 404, code: "NOT_FOUND", message: "Evaluation not found." };

    const updatePayload: any = {
      status: "CORRECTION_REQUESTED",
      isLocked: false,
      correctionReason: reason.trim(),
    };

    const updated = await EvaluationRepository.update(tenantId, id, updatePayload);

    // Audit logging
    await AuditService.logAction({
      organizationId: tenantId,
      actorId: adminUserId,
      action: "EVALUATION_CORRECTION_REQUESTED",
      target: id,
      metadata: {
        reason: reason.trim(),
        judgeId: ev.judgeId,
        submissionId: ev.submissionId,
      },
    });

    // Notify judge
    await NotificationService.create({
      organizationId: tenantId,
      recipientUserId: ev.judgeId,
      title: "Score Correction Requested",
      message: `Admin requested correction for "${ev.submission.title}": ${reason.trim()}`,
      type: "EVALUATION",
      link: `/evaluations/${id}`,
    });

    return updated;
  }

  static async deleteEvaluation(tenantId: string, id: string) {
    const deleted = await EvaluationRepository.delete(tenantId, id);
    if (!deleted) throw { status: 404, code: "NOT_FOUND", message: "Evaluation not found." };
    return true;
  }
}

