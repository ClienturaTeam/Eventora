import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { EvaluationService } from "../services/evaluations.service";
import { prisma } from "../utils/prisma";

/** Check if the actor has a permission that signals admin-level access */
async function isOrgAdmin(userId: string, tenantId: string): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: tenantId } },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  if (!membership) return false;
  return membership.role.permissions.some(
    (rp) =>
      rp.permission.action === "evaluations.manage" ||
      rp.permission.action === "platform.manage"
  );
}

export class EvaluationController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const filters = {
        eventId: req.query.eventId as string,
        roundId: req.query.roundId as string,
        roundNumber: req.query.roundNumber ? Number(req.query.roundNumber) : undefined,
        status: req.query.status as string,
        judgeId: req.query.judgeId as string,
      };
      const data = await EvaluationService.getEvaluations(tenantId, filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async findMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const judgeUserId = req.user!.id;
      const data = await EvaluationService.getMyEvaluations(tenantId, judgeUserId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const data = await EvaluationService.getEvaluation(tenantId, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const data = await EvaluationService.createEvaluation(tenantId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const actorUserId = req.user!.id;
      const admin = await isOrgAdmin(actorUserId, tenantId);
      const data = await EvaluationService.updateEvaluation(
        tenantId,
        req.params.id,
        actorUserId,
        admin,
        req.body
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async requestCorrection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const adminUserId = req.user!.id;
      const { reason } = req.body;
      const data = await EvaluationService.requestCorrection(
        tenantId,
        req.params.id,
        adminUserId,
        reason
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await EvaluationService.deleteEvaluation(tenantId, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }
}
