import { Request, Response, NextFunction } from "express";
import { ManagerService } from "../services/manager.service";
import { EventService } from "../services/events.service";
import { RegistrationService } from "../services/registrations.service";
import { TeamService } from "../services/teams.service";
import { SubmissionService } from "../services/submissions.service";
import { EvaluationService } from "../services/evaluations.service";
import { JudgeService } from "../services/judges.service";
import { MentorService } from "../services/mentors.service";
import { VolunteerService } from "../services/volunteers.service";
import { CertificateService } from "../services/certificates.service";
import { AttendanceService } from "../services/attendance.service";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export class ManagerController {
  static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await ManagerService.getDashboardStats(req.tenantId!);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const events = await EventService.getEvents(req.tenantId!);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await EventService.createEvent(req.tenantId!, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await EventService.updateEvent(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await EventService.deleteEvent(req.tenantId!, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await RegistrationService.getRegistrations(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateRegistrationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await RegistrationService.updateRegistration(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await TeamService.getTeams(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await TeamService.createTeam(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await TeamService.updateTeam(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await TeamService.deleteTeam(req.tenantId!, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        eventId: req.query.eventId as string,
        roundId: req.query.roundId as string,
        roundNumber: req.query.roundNumber ? Number(req.query.roundNumber) : undefined,
        problemStatementId: req.query.problemStatementId as string,
        status: req.query.status as string,
        judgeId: req.query.judgeId as string,
        userId: req.query.userId as string,
      };
      const data = await SubmissionService.getSubmissions(req.tenantId!, filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await SubmissionService.updateSubmission(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getEvaluations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        eventId: req.query.eventId as string,
        roundId: req.query.roundId as string,
        roundNumber: req.query.roundNumber ? Number(req.query.roundNumber) : undefined,
        status: req.query.status as string,
        judgeId: req.query.judgeId as string,
      };
      const data = await EvaluationService.getEvaluations(req.tenantId!, filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createEvaluation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await EvaluationService.createEvaluation(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvaluation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await EvaluationService.updateEvaluation(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getJudges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.getJudges(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async assignJudge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.createJudge(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async removeJudge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await JudgeService.deleteJudge(req.tenantId!, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getMentors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.getMentors(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async assignMentor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.createMentor(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async removeMentor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await MentorService.deleteMentor(req.tenantId!, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getVolunteers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await VolunteerService.getVolunteers(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async assignVolunteer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await VolunteerService.createVolunteer(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async removeVolunteer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await VolunteerService.deleteVolunteer(req.tenantId!, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getCertificates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await CertificateService.getCertificates(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async issueCertificate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await CertificateService.createCertificate(req.tenantId!, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateCertificate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await CertificateService.updateCertificate(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Attendance
  static async getAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getRecords(req.tenantId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Reports
  static async getReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reports = await prisma.eventFinalReport.findMany({
        where: { organizationId: req.tenantId! },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              status: true,
            },
          },
          coordinator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const events = await prisma.event.findMany({
        where: { organizationId: req.tenantId! },
        include: {
          EventFinalReport: {
            select: {
              id: true,
              status: true,
              updatedAt: true,
              executiveSummary: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              competitions: true,
              submissions: true,
              Certificate: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      });

      const totalRegistrations = await prisma.registration.count({
        where: { event: { organizationId: req.tenantId! } },
      });

      const totalEvaluations = await prisma.evaluation.count({
        where: { submission: { competition: { event: { organizationId: req.tenantId! } } } },
      });

      const totalCertificates = await prisma.certificate.count({
        where: { organizationId: req.tenantId! },
      });

      res.json({
        success: true,
        data: {
          reports,
          events,
          metrics: {
            totalEvents: events.length,
            totalDossiers: reports.length,
            pendingReview: reports.filter((r) => r.status === "SUBMITTED_TO_MANAGER").length,
            totalRegistrations,
            totalEvaluations,
            totalCertificates,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { FinalReportService } = await import("../services/final-report.service");
      const report = await FinalReportService.generateAIDraft(req.tenantId!, eventId, req.user!.id);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async approveReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { FinalReportService } = await import("../services/final-report.service");
      const report = await prisma.eventFinalReport.findFirst({
        where: { OR: [{ id }, { eventId: id }], organizationId: req.tenantId! },
      });
      if (!report) throw { status: 404, message: "Report not found" };

      const updated = await FinalReportService.managerReview(
        req.tenantId!,
        report.eventId,
        req.user!.id,
        "APPROVE",
        req.body?.comment || "Approved and sealed by organization manager."
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Results & Prizes Workflow
  static async publishResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ResultsService } = await import("../services/results.service");
      const result = await ResultsService.publishResult(req.tenantId!, req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updatePrizeStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ResultsService } = await import("../services/results.service");
      const prize = await ResultsService.updatePrizeStatus(req.tenantId!, req.params.id, req.body.status);
      res.json({ success: true, data: prize });
    } catch (error) {
      next(error);
    }
  }
}
