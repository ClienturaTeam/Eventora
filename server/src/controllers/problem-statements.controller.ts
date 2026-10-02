import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProblemStatementService } from "../services/problem-statements.service";
import { prisma } from "../utils/prisma";

export class ProblemStatementController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user?.status === "PENDING" || req.query.mode === "student";
      const orgId = (req.headers["x-organization-id"] as string) || undefined;
      const eventId = (req.query.eventId as string) || undefined;
      const statements = await ProblemStatementService.getAll(orgId, isStudent, eventId);
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
      if (req.user?.id) {
        const judgeMembership = await prisma.organizationMember.findFirst({
          where: { userId: req.user.id, role: { name: { equals: "Judge", mode: "insensitive" } } }
        });
        if (judgeMembership) {
          throw { status: 403, code: "FORBIDDEN", message: "Judges cannot create or modify problem statements." };
        }
      }

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
      if (req.user?.id) {
        const judgeMembership = await prisma.organizationMember.findFirst({
          where: { userId: req.user.id, role: { name: { equals: "Judge", mode: "insensitive" } } }
        });
        if (judgeMembership) {
          throw { status: 403, code: "FORBIDDEN", message: "Judges cannot create or modify problem statements." };
        }
      }

      const statement = await ProblemStatementService.update(req.params.id, req.body);
      res.json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async release(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.id) {
        const judgeMembership = await prisma.organizationMember.findFirst({
          where: { userId: req.user.id, role: { name: { equals: "Judge", mode: "insensitive" } } }
        });
        if (judgeMembership) {
          throw { status: 403, code: "FORBIDDEN", message: "Judges cannot create or modify problem statements." };
        }
      }

      const statement = await ProblemStatementService.release(req.params.id);
      res.json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async selectForTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { problemStatementId, teamId } = req.body;
      if (!problemStatementId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "problemStatementId is required" }
        });
      }
      const updatedTeam = await ProblemStatementService.selectProblemStatement(req.user!.id, problemStatementId, teamId);
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
