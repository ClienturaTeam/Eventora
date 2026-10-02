import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { SubmissionService } from "../services/submissions.service";

export class SubmissionController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const filters = {
        eventId: req.query.eventId as string,
        roundId: req.query.roundId as string,
        roundNumber: req.query.roundNumber ? Number(req.query.roundNumber) : undefined,
        problemStatementId: req.query.problemStatementId as string,
        status: req.query.status as string,
        judgeId: req.query.judgeId as string,
        userId: req.query.userId as string,
      };
      const subs = await SubmissionService.getSubmissions(tenantId, filters, req.user?.id);
      res.json({ success: true, data: subs });
    } catch (error) { next(error); }
  }

  static async assignJudge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { judgeId } = req.body;
      const assignment = await SubmissionService.assignJudge(tenantId, req.params.id, judgeId, req.user?.id);
      res.status(201).json({ success: true, data: assignment });
    } catch (error) { next(error); }
  }

  static async unassignJudge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await SubmissionService.unassignJudge(tenantId, req.params.id, req.params.judgeId, req.user?.id);
      res.json({ success: true, data: { unassigned: true } });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.getSubmission(tenantId, req.params.id, req.user?.id);
      res.json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.createSubmission(tenantId, req.body, req.user?.id);
      res.status(201).json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.updateSubmission(tenantId, req.params.id, req.body, req.user?.id);
      res.json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = await SubmissionService.addSubmissionFile(req.user!.id, req.params.id, req.body);
      res.status(201).json({ success: true, data: file });
    } catch (error) { next(error); }
  }

  static async finalSubmit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const description = req.body?.description || req.body?.content;
      const sub = await SubmissionService.finalSubmit(req.user!.id, req.params.id, description);
      res.json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await SubmissionService.deleteSubmission(tenantId, req.params.id, req.user?.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }
}
