import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { JudgeService } from "../services/judges.service";

export class JudgeController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.getJudges(req.tenantId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async findMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Return all judge profiles for the tenant, so the shared login user can select their profile
      const data = await JudgeService.getJudges(req.tenantId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.getJudge(req.tenantId as string, req.params.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.createJudge(req.tenantId as string, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.updateJudge(req.tenantId as string, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await JudgeService.deleteJudge(req.tenantId as string, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }

  static async assignCompetition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await JudgeService.assignCompetition(
        req.tenantId as string,
        req.params.id,
        req.body.competitionId
      );
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async removeCompetition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await JudgeService.removeCompetition(
        req.tenantId as string,
        req.params.id,
        req.params.competitionId
      );
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }
}
