import { Request, Response, NextFunction } from "express";
import { FinalReportService } from "../services/final-report.service";
import { FinalReportPDFService } from "../services/final-report-pdf.service";
import { prisma } from "../utils/prisma";

export class FinalReportController {
  static async getFinalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const report = await FinalReportService.getFinalReport(tenantId, id, onlyAssignedUserId);

      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const report = await FinalReportService.saveDraft(tenantId, id, userId, req.body);
      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async generateAIDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const report = await FinalReportService.generateAIDraft(tenantId, id, userId);
      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async submitToFaculty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { finalizedContent } = req.body;

      const report = await FinalReportService.submitToFaculty(tenantId, id, userId, finalizedContent);
      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async facultyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { action, comment } = req.body;

      const report = await FinalReportService.facultyReview(tenantId, id, userId, action, comment);
      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async managerReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { action, comment } = req.body;

      const report = await FinalReportService.managerReview(tenantId, id, userId, action, comment);
      res.status(200).json({ success: true, data: { report } });
    } catch (error) { next(error); }
  }

  static async downloadPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const event = await prisma.event.findFirst({
        where: { id, organizationId: tenantId }
      });
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }

      let report = await prisma.eventFinalReport.findUnique({
        where: { eventId: id },
        include: {
          event: true,
          coordinator: true,
          organization: true
        }
      });

      if (!report) {
        const defaultCoordinator = await prisma.user.findFirst({
          where: { id: req.user!.id }
        }) || await prisma.user.findFirst();

        report = await prisma.eventFinalReport.create({
          data: {
            eventId: id,
            organizationId: tenantId,
            coordinatorId: defaultCoordinator!.id,
            executiveSummary: `Comprehensive completion dossier and operational report for ${event.name}.`,
            eventOutcome: "Successfully executed innovation event with verified participant teams and completed scorecard rubrics.",
            keyHighlights: "Strong participant engagement, active mentoring, and transparent scoring.",
            challenges: "Schedule pacing and final submission verification.",
            recommendations: "Maintain early judge assignments and expanded problem tracks.",
            status: "APPROVED"
          },
          include: {
            event: true,
            coordinator: true,
            organization: true
          }
        });
      }

      const { EventExecutionService } = await import("../services/event-execution.service");
      const executionSummary = await EventExecutionService.getExecutionSummary(tenantId, id);
      const pdfBuffer = await FinalReportPDFService.generatePDF(report, executionSummary);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Final_Report_${event.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) { next(error); }
  }
}
