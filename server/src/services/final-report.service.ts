import { prisma } from "../utils/prisma";
import { EventStatus, ReportStatus } from "@prisma/client";
import { EventExecutionService } from "./event-execution.service";
import { LLMService } from "./ai/llm.service";
import { NotificationService } from "./notifications.service";

const generationLocks = new Set<string>();

export class FinalReportService {
  private static async verifyCoordinator(tenantId: string, eventId: string, userId: string) {
    const userRole = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: tenantId },
      include: { role: true },
    });
    const isManager =
      userRole &&
      ["Admin", "Organization Admin", "Sudo Admin", "Platform Admin", "Manager"].includes(
        userRole.role.name
      );

    if (!isManager) {
      const member = await prisma.eventTeamMember.findFirst({
        where: { eventId, userId, responsibility: "Primary Student Coordinator" },
      });
      if (!member) {
        throw {
          status: 403,
          code: "FORBIDDEN",
          message: "Only the assigned Primary Student Coordinator or Manager can manage the final report.",
        };
      }
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }
  }

  private static async verifyFaculty(tenantId: string, eventId: string, userId: string) {
    const member = await prisma.eventTeamMember.findFirst({
      where: { eventId, userId, responsibility: 'Faculty Coordinator' }
    });
    if (!member) {
      throw { status: 403, code: "FORBIDDEN", message: "Only the assigned Faculty Coordinator can perform this action." };
    }
  }

  private static async verifyManager(tenantId: string, userId: string) {
    const userRole = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: tenantId },
      include: { role: true }
    });
    if (!userRole || !['Admin', 'Organization Admin', 'Sudo Admin', 'Platform Admin', 'Manager'].includes(userRole.role.name)) {
      throw { status: 403, code: "FORBIDDEN", message: "Only a Manager can perform this action." };
    }
  }

  static async getFinalReport(tenantId: string, eventId: string, onlyAssignedUserId?: string) {
    const whereClause: any = { eventId, organizationId: tenantId };
    
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }

    const report = await prisma.eventFinalReport.findUnique({
      where: { eventId }
    });

    // Authorization check
    if (onlyAssignedUserId) {
      const isSC = await prisma.eventTeamMember.findFirst({
        where: { eventId, userId: onlyAssignedUserId, responsibility: 'Primary Student Coordinator' }
      });
      const isFC = await prisma.eventTeamMember.findFirst({
        where: { eventId, userId: onlyAssignedUserId, responsibility: 'Faculty Coordinator' }
      });

      if (!isSC && !isFC) {
        throw { status: 403, code: "FORBIDDEN", message: "Unauthorized to view this report." };
      }

      if (isFC && !isSC) {
        if (!report || report.status === 'DRAFT' || report.status === 'AI_GENERATED') {
          throw { status: 403, code: "FORBIDDEN", message: "Final report is not yet submitted for Faculty review." };
        }
      }
    }

    return report;
  }

  static async saveDraft(tenantId: string, eventId: string, userId: string, data: any) {
    await this.verifyCoordinator(tenantId, eventId, userId);

    return prisma.eventFinalReport.upsert({
      where: { eventId },
      update: {
        executiveSummary: data.executiveSummary,
        eventOutcome: data.eventOutcome,
        keyHighlights: data.keyHighlights,
        challenges: data.challenges,
        recommendations: data.recommendations,
        additionalRemarks: data.additionalRemarks,
        supportingDocuments: data.supportingDocuments,
      },
      create: {
        eventId,
        organizationId: tenantId,
        coordinatorId: userId,
        executiveSummary: data.executiveSummary,
        eventOutcome: data.eventOutcome,
        keyHighlights: data.keyHighlights,
        challenges: data.challenges,
        recommendations: data.recommendations,
        additionalRemarks: data.additionalRemarks,
        supportingDocuments: data.supportingDocuments,
        status: ReportStatus.DRAFT,
      }
    });
  }

  static async generateAIDraft(tenantId: string, eventId: string, userId: string) {
    await this.verifyCoordinator(tenantId, eventId, userId);

    if (generationLocks.has(eventId)) {
      throw { status: 409, message: "Generation is already in progress." };
    }
    generationLocks.add(eventId);

    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizationId: tenantId },
        include: {
          proposal: true,
          competitions: { include: { winners: { include: { team: true, user: true, prize: true, submission: true } } } },
          teamMembers: { include: { user: true } },
        },
      });

      if (!event) throw { status: 404, message: "Event not found." };

      let report = await prisma.eventFinalReport.findUnique({ where: { eventId } });
      if (!report) {
        report = await prisma.eventFinalReport.create({
          data: {
            event: { connect: { id: eventId } },
            organization: { connect: { id: tenantId } },
            coordinator: { connect: { id: userId } },
            executiveSummary: `Executive summary and operational review for ${event.name}`,
            eventOutcome: "Successfully executed innovation hackathon with verified participant teams and completed scorecard rubrics.",
            keyHighlights: "Strong participant engagement, active mentoring, and transparent scoring.",
            challenges: "Pacing schedule and final submission verification.",
            recommendations: "Maintain early judge assignments and expanded problem tracks.",
            status: ReportStatus.DRAFT,
          },
        });
      }

      const executionSummary = await EventExecutionService.getExecutionSummary(tenantId, eventId);

      const prompt = `
You are an analytical report generator. 
Generate a professional final event report in markdown format.

CRITICAL INSTRUCTIONS - NO HALLUCINATION:
- Use ONLY the exact event data, metrics, and coordinator inputs provided below.
- DO NOT invent, guess, or extrapolate ANY metrics, participant counts, winners, sponsors, dates, financial amounts, achievements, or activities.
- DO NOT include placeholder text. If a specific piece of information (e.g. winners, sponsors, achievements) is not present in the data below, you MUST state "Not provided" or "Information was not provided."
- STICK STRICTLY to the facts provided.

REQUIRED REPORT STRUCTURE:
# FINAL EVENT REPORT
1. Executive Summary
2. Event Overview
3. Objectives
4. Event Execution
5. Participation & Statistics
6. Key Highlights
7. Outcomes
8. Challenges & Resolutions
9. Recommendations
10. Supporting Documents
11. Conclusion

Context Data:
- Event Name: ${event.name}
- Event Dates: ${event.startTime} to ${event.endTime}
- Venue: Not provided
- Event Type: Not provided
- Department/Organizer: Not provided

Coordinator Inputs:
- Executive Summary: ${report.executiveSummary || 'Not provided'}
- Objectives: Not explicitly provided.
- Outcomes: ${report.eventOutcome || 'Not provided'}
- Key Highlights: ${report.keyHighlights || 'Not provided'}
- Challenges & Resolutions: ${report.challenges || 'Not provided'}
- Recommendations: ${report.recommendations || 'Not provided'}

Execution Summary (DB Metrics):
${JSON.stringify(executionSummary, null, 2)}

Please write the comprehensive final report using the exact requested structure, blending the coordinator's inputs with the hard data.
      `;

      const aiResponse = await LLMService.generateResponse(prompt);

      return prisma.eventFinalReport.update({
        where: { eventId },
        data: {
          aiGeneratedContent: aiResponse.text,
          finalizedContent: aiResponse.text, // initial state is the AI's version
          status: ReportStatus.AI_GENERATED
        }
      });
    } finally {
      generationLocks.delete(eventId);
    }
  }

  static async submitToFaculty(tenantId: string, eventId: string, userId: string, finalizedContent: string) {
    await this.verifyCoordinator(tenantId, eventId, userId);

    const report = await prisma.eventFinalReport.findUnique({ where: { eventId } });
    if (!report || report.status === ReportStatus.DRAFT) {
      throw { status: 400, message: "Report must be AI generated before submitting." };
    }

    const updated = await prisma.eventFinalReport.update({
      where: { eventId },
      data: {
        finalizedContent,
        status: ReportStatus.SUBMITTED_TO_FACULTY
      },
      include: { event: true }
    });

    const fc = await prisma.eventTeamMember.findFirst({
      where: { eventId, responsibility: 'Faculty Coordinator' }
    });

    if (fc) {
      await NotificationService.create({
        organizationId: tenantId,
        recipientUserId: fc.userId,
        title: "Final Report Submitted",
        message: `The final report for ${updated.event.name} has been submitted for your review.`,
        type: "SYSTEM",
        link: `/events/${eventId}/final-report`
      });
    }

    return updated;
  }

  static async facultyReview(tenantId: string, eventId: string, userId: string, action: 'APPROVE' | 'REQUEST_CHANGES', comment: string) {
    await this.verifyFaculty(tenantId, eventId, userId);
    
    const report = await prisma.eventFinalReport.findUnique({ where: { eventId } });
    if (!report || report.status !== ReportStatus.SUBMITTED_TO_FACULTY) {
      throw { status: 400, message: "Report is not pending faculty review." };
    }

    const updated = await prisma.eventFinalReport.update({
      where: { eventId },
      data: {
        facultyId: userId,
        facultyComment: comment,
        facultyReviewedAt: new Date(),
        status: action === 'APPROVE' ? ReportStatus.SUBMITTED_TO_MANAGER : ReportStatus.CHANGES_REQUESTED_BY_FACULTY
      },
      include: { event: true }
    });

    if (action === 'APPROVE') {
      const managers = await prisma.organizationMember.findMany({
        where: { 
          organizationId: tenantId, 
          role: { name: { in: ['Admin', 'Organization Admin', 'Sudo Admin', 'Platform Admin', 'Manager'] } } 
        }
      });
      const managerIds = managers.map(m => m.userId);
      if (managerIds.length > 0) {
        await NotificationService.createBulk(tenantId, managerIds, {
          title: "Final Report Needs Approval",
          message: `The final report for ${updated.event.name} has been approved by the Faculty Coordinator and is ready for your review.`,
          type: "SYSTEM",
          link: `/events/${eventId}/final-report`
        });
      }

      if (report.coordinatorId) {
        await NotificationService.create({
          organizationId: tenantId,
          recipientUserId: report.coordinatorId,
          title: "Final Report Forwarded",
          message: `Your final report for ${updated.event.name} was approved by the Faculty Coordinator and sent to the manager.`,
          type: "SYSTEM",
          link: `/events/${eventId}/final-report`
        });
      }
    } else {
      if (report.coordinatorId) {
        await NotificationService.create({
          organizationId: tenantId,
          recipientUserId: report.coordinatorId,
          title: "Final Report Changes Requested",
          message: `The Faculty Coordinator has requested changes to the final report for ${updated.event.name}.`,
          type: "SYSTEM",
          link: `/events/${eventId}/final-report`
        });
      }
    }

    return updated;
  }

  static async managerReview(tenantId: string, eventId: string, userId: string, action: 'APPROVE' | 'REQUEST_CHANGES', comment: string) {
    await this.verifyManager(tenantId, userId);
    
    const report = await prisma.eventFinalReport.findUnique({ where: { eventId } });
    if (!report) {
      throw { status: 404, message: "Report not found." };
    }

    const reviewableStatuses: ReportStatus[] = [
      ReportStatus.SUBMITTED_TO_MANAGER,
      ReportStatus.AI_GENERATED,
      ReportStatus.DRAFT,
      ReportStatus.SUBMITTED_TO_FACULTY,
    ];

    if (action === 'APPROVE' && !reviewableStatuses.includes(report.status)) {
      throw { status: 400, message: `Report cannot be approved in status ${report.status}.` };
    } else if (action === 'REQUEST_CHANGES' && report.status !== ReportStatus.SUBMITTED_TO_MANAGER) {
      throw { status: 400, message: "Report is not pending manager review." };
    }

    const updated = await prisma.eventFinalReport.update({
      where: { eventId },
      data: {
        managerId: userId,
        managerComment: comment,
        managerReviewedAt: new Date(),
        finalizedContent: report.finalizedContent || report.aiGeneratedContent || report.executiveSummary || "",
        status: action === 'APPROVE' ? ReportStatus.APPROVED : ReportStatus.CHANGES_REQUESTED_BY_MANAGER
      },
      include: { event: true }
    });

    const recipients = [];
    if (report.coordinatorId) recipients.push(report.coordinatorId);
    if (report.facultyId) recipients.push(report.facultyId);

    if (recipients.length > 0) {
      if (action === 'APPROVE') {
        await NotificationService.createBulk(tenantId, recipients, {
          title: "Final Report Approved!",
          message: `The final report for ${updated.event.name} has been fully approved by the manager.`,
          type: "SYSTEM",
          link: `/events/${eventId}/final-report`
        });
      } else {
        await NotificationService.createBulk(tenantId, recipients, {
          title: "Final Report Changes Requested",
          message: `The manager has requested changes to the final report for ${updated.event.name}.`,
          type: "SYSTEM",
          link: `/events/${eventId}/final-report`
        });
      }
    }

    return updated;
  }
}
