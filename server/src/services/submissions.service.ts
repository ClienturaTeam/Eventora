import { SubmissionRepository } from "../repositories/submissions.repository";
import { prisma } from "../utils/prisma";
import { ParticipantService } from "./participant.service";

export class SubmissionService {
  static ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "doc", "docx", "mp4", "mov", "avi"];
  static MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

  static async getSubmissions(
    tenantId: string,
    filters?: { eventId?: string; roundId?: string; roundNumber?: number; problemStatementId?: string; status?: string; judgeId?: string; userId?: string },
    requestingUserId?: string
  ) {
    if (requestingUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: requestingUserId, organizationId: tenantId } },
        include: { role: true }
      });

      const roleName = membership?.role?.name?.toLowerCase() || "";
      const isJudgeOnly = roleName.includes("judge") && !roleName.includes("admin") && !roleName.includes("manager");
      
      if (isJudgeOnly) {
        filters = { ...filters, judgeId: requestingUserId };
      }
    }

    if (filters?.roundId) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(filters.roundId);
      if (!isUuid) {
        const parsed = parseInt(filters.roundId, 10);
        if (!isNaN(parsed)) {
          filters.roundNumber = parsed;
          delete filters.roundId;
        }
      } else {
        const round = await prisma.eventRound.findUnique({
          where: { id: filters.roundId },
          include: { event: true }
        });
        if (!round || (filters.eventId && round.eventId !== filters.eventId) || round.event?.organizationId !== tenantId) {
          throw { status: 400, code: "INVALID_ROUND", message: "Round does not exist or does not belong to the selected event." };
        }
      }
    }

    return SubmissionRepository.findAll(tenantId, filters);
  }

  static async getSubmission(tenantId: string, id: string, requestingUserId?: string) {
    const sub = await SubmissionRepository.findById(tenantId, id);
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }

    if (requestingUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: requestingUserId, organizationId: tenantId } },
        include: { role: true }
      });

      const roleName = membership?.role?.name?.toLowerCase() || "";
      const isJudgeOnly = roleName.includes("judge") && !roleName.includes("admin") && !roleName.includes("manager");

      if (isJudgeOnly) {
        const isAssigned = sub.judgeAssignments?.some((a) => a.judge.id === requestingUserId);
        if (!isAssigned) {
          throw { status: 403, code: "FORBIDDEN", message: "You are not assigned to view this submission." };
        }
      }
    }

    return sub;
  }

  static async createSubmission(tenantId: string, data: any) {
    const team = await prisma.team.findFirst({
      where: { id: data.teamId },
      include: {
        problemStatement: { include: { applicableRounds: true } },
        competition: { include: { event: true } }
      }
    });

    if (!team) {
      throw { status: 404, code: "NOT_FOUND", message: "Team not found." };
    }

    if (!team.problemStatementId || !team.problemStatement) {
      throw {
        status: 400,
        code: "NO_PROBLEM_STATEMENT_SELECTED",
        message: "Your team must select and lock a Problem Statement before starting a round submission."
      };
    }

    const ps = team.problemStatement;
    const eventId = data.eventId || team.competition?.eventId;

    if (data.roundId) {
      const round = await prisma.eventRound.findUnique({
        where: { id: data.roundId },
        include: { event: true }
      });

      if (!round) {
        throw { status: 404, code: "NOT_FOUND", message: "Specified EventRound not found." };
      }

      if (eventId && round.eventId !== eventId) {
        throw {
          status: 400,
          code: "INVALID_ROUND",
          message: "EventRound does not belong to the event."
        };
      }

      if (ps.applicableRounds && ps.applicableRounds.length > 0) {
        const isApplicable = ps.applicableRounds.some((r) => r.id === data.roundId);
        if (!isApplicable) {
          throw {
            status: 400,
            code: "UNAUTHORIZED_ROUND_SUBMISSION",
            message: `Round '${round.name}' is not configured for your team's selected Problem Statement ('${ps.code}: ${ps.title}'). Submission rejected.`
          };
        }
      }

      const now = new Date();
      if (round.submissionStart && now < new Date(round.submissionStart)) {
        throw {
          status: 400,
          code: "SUBMISSION_WINDOW_NOT_OPEN",
          message: `Submission window for '${round.name}' has not opened yet.`
        };
      }
      if (round.submissionDeadline && now > new Date(round.submissionDeadline)) {
        throw {
          status: 400,
          code: "SUBMISSION_WINDOW_CLOSED",
          message: `Submission deadline for '${round.name}' has passed.`
        };
      }

      const existingSub = await prisma.submission.findFirst({
        where: {
          teamId: data.teamId,
          roundId: data.roundId
        },
        include: {
          eventRound: true,
          problemStatement: true,
          team: true
        }
      });

      if (existingSub) {
        return existingSub;
      }
    }

    return prisma.submission.create({
      data: {
        eventId: eventId || null,
        teamId: data.teamId,
        competitionId: data.competitionId || team.competitionId,
        roundId: data.roundId || null,
        roundNumber: data.roundNumber ? Number(data.roundNumber) : 1,
        submittedById: data.submittedById || null,
        title: data.title,
        payload: data.payload || null,
        status: data.status || "DRAFT",
        problemStatementId: ps.id
      },
      include: {
        eventRound: true,
        problemStatement: true,
        team: true
      }
    });
  }

  static async assignJudge(tenantId: string, submissionId: string, judgeUserId: string, requestingUserId?: string) {
    if (requestingUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: requestingUserId, organizationId: tenantId } },
        include: { role: true }
      });
      const roleName = membership?.role?.name?.toLowerCase() || "";
      if (roleName.includes("judge") && !roleName.includes("admin") && !roleName.includes("manager")) {
        throw { status: 403, code: "FORBIDDEN", message: "Judges cannot assign themselves or other judges to submissions." };
      }
    }

    const sub = await SubmissionRepository.findById(tenantId, submissionId);
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    // Verify judge user is a member of the organization
    const judgeMember = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: judgeUserId, organizationId: tenantId } }
    });
    if (!judgeMember) {
      throw { status: 400, code: "INVALID_JUDGE", message: "Selected judge does not belong to this organization." };
    }

    const assignment = await prisma.submissionJudgeAssignment.upsert({
      where: {
        submissionId_judgeId: {
          submissionId,
          judgeId: judgeUserId
        }
      },
      update: {},
      create: {
        submissionId,
        judgeId: judgeUserId
      },
      include: {
        judge: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // Also upsert corresponding Evaluation record so evaluation queue shows the submission immediately
    await prisma.evaluation.upsert({
      where: {
        submissionId_judgeId: {
          submissionId,
          judgeId: judgeUserId
        }
      },
      update: {},
      create: {
        submissionId,
        judgeId: judgeUserId,
        roundId: sub.roundId || null,
        roundNumber: sub.roundNumber || 1,
        status: "PENDING"
      }
    });

    // Notify judge
    await prisma.notification.create({
      data: {
        organizationId: tenantId,
        recipientUserId: judgeUserId,
        title: "New Submission Assigned",
        message: `You have been assigned to evaluate submission '${sub.title}'.`,
        type: "EVALUATION",
        link: "/evaluations"
      }
    });

    return assignment;
  }

  static async unassignJudge(tenantId: string, submissionId: string, judgeUserId: string, requestingUserId?: string) {
    if (requestingUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: requestingUserId, organizationId: tenantId } },
        include: { role: true }
      });
      const roleName = membership?.role?.name?.toLowerCase() || "";
      if (roleName.includes("judge") && !roleName.includes("admin") && !roleName.includes("manager")) {
        throw { status: 403, code: "FORBIDDEN", message: "Judges cannot unassign judges from submissions." };
      }
    }

    const sub = await SubmissionRepository.findById(tenantId, submissionId);
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    await prisma.submissionJudgeAssignment.deleteMany({
      where: {
        submissionId,
        judgeId: judgeUserId
      }
    });

    await prisma.evaluation.deleteMany({
      where: {
        submissionId,
        judgeId: judgeUserId
      }
    });

    return true;
  }

  static async updateSubmission(tenantId: string, id: string, data: any) {
    const sub = await prisma.submission.findUnique({ where: { id } });
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }
    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is locked and cannot be modified." };
    }
    return SubmissionRepository.update(tenantId, id, data);
  }

  static async addSubmissionFile(userId: string, submissionId: string, fileData: { fileName: string; fileSize: number; fileType: string; fileUrl?: string }) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { files: true }
    });
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    if (sub.eventId) {
      const access = await ParticipantService.verifyParticipantRegistrationAndPayment(userId, sub.eventId);
      if (!access.allowed) {
        throw { status: 403, code: "FORBIDDEN", message: access.message || "Complete event registration and payment before submitting." };
      }
    }

    if (sub.roundId) {
      const round = await prisma.eventRound.findUnique({ where: { id: sub.roundId } });
      if (round) {
        const now = new Date();
        if (round.submissionStart && now < new Date(round.submissionStart)) {
          throw { status: 400, code: "SUBMISSION_WINDOW_NOT_OPEN", message: `Submission window for '${round.name}' has not opened yet.` };
        }
        if (round.submissionDeadline && now > new Date(round.submissionDeadline)) {
          throw { status: 400, code: "SUBMISSION_WINDOW_CLOSED", message: `Submission deadline for '${round.name}' has passed.` };
        }
      }
    }

    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is locked and cannot accept file uploads." };
    }

    if (fileData.fileSize > this.MAX_FILE_SIZE_BYTES) {
      throw {
        status: 400,
        code: "FILE_TOO_LARGE",
        message: `File size exceeds the 20 MB maximum limit. Received: ${(fileData.fileSize / (1024 * 1024)).toFixed(2)} MB`
      };
    }

    const ext = fileData.fileName.split(".").pop()?.toLowerCase() || "";
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw {
        status: 400,
        code: "INVALID_FILE_TYPE",
        message: `File extension '.${ext}' is not supported. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(", ")}`
      };
    }

    const file = await prisma.submissionFile.create({
      data: {
        submissionId,
        fileName: fileData.fileName,
        fileSize: Number(fileData.fileSize),
        fileType: fileData.fileType || ext,
        fileUrl: fileData.fileUrl || `/uploads/${fileData.fileName}`
      }
    });

    return file;
  }

  static async finalSubmit(userId: string, submissionId: string) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    if (sub.eventId) {
      const access = await ParticipantService.verifyParticipantRegistrationAndPayment(userId, sub.eventId);
      if (!access.allowed) {
        throw { status: 403, code: "FORBIDDEN", message: access.message || "Complete event registration and payment before submitting." };
      }
    }

    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is already locked." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: "SUBMITTED",
          isLocked: true,
          lockedAt: new Date()
        },
        include: { files: true }
      });

      const org = await tx.organization.findFirst();
      if (org) {
        await tx.notification.create({
          data: {
            organizationId: org.id,
            recipientUserId: userId,
            title: "Submission Finalized",
            message: `Your project submission '${s.title}' has been successfully finalized and locked.`,
            type: "SYSTEM"
          }
        });
      }

      return s;
    });

    return updated;
  }

  static async deleteSubmission(tenantId: string, id: string) {
    const sub = await SubmissionRepository.delete(tenantId, id);
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }
    return true;
  }
}
