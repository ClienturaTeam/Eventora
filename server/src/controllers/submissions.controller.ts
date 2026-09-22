import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { SubmissionService } from "../services/submissions.service";

export class SubmissionController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const subs = await SubmissionService.getSubmissions(tenantId);
      res.json({ success: true, data: subs });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.getSubmission(tenantId, req.params.id);
      res.json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.createSubmission(tenantId, req.body);
      res.status(201).json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const sub = await SubmissionService.updateSubmission(tenantId, req.params.id, req.body);
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
      const sub = await SubmissionService.finalSubmit(req.user!.id, req.params.id);
      res.json({ success: true, data: sub });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await SubmissionService.deleteSubmission(tenantId, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }
}
