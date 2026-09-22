import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProblemStatementService } from "../services/problem-statements.service";

export class ProblemStatementController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user?.status === "PENDING" || req.query.mode === "student";
      const orgId = (req.headers["x-organization-id"] as string) || undefined;
      const statements = await ProblemStatementService.getAll(orgId, isStudent);
      res.json({ success: true, data: statements });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const statement = await ProblemStatementService.getById(req.params.id);
      res.json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orgId = (req.headers["x-organization-id"] as string) || req.body.organizationId;
      const statement = await ProblemStatementService.create({
        ...req.body,
        organizationId: orgId
      });
      res.status(201).json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const statement = await ProblemStatementService.update(req.params.id, req.body);
      res.json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async release(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const statement = await ProblemStatementService.release(req.params.id);
      res.json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async selectForTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { problemStatementId } = req.body;
      if (!problemStatementId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "problemStatementId is required" }
        });
      }
      const updatedTeam = await ProblemStatementService.selectProblemStatement(req.user!.id, problemStatementId);
      res.json({ success: true, data: updatedTeam });
    } catch (error) {
      next(error);
    }
  }

  static async adminOverride(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId, problemStatementId, reason } = req.body;
      if (!teamId || !problemStatementId || !reason) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "teamId, problemStatementId, and reason are required" }
        });
      }
      const updatedTeam = await ProblemStatementService.adminOverrideProblemStatement(
        req.user!.id,
        teamId,
        problemStatementId,
        reason
      );
      res.json({ success: true, data: updatedTeam });
    } catch (error) {
      next(error);
    }
  }
}
