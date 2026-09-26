import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { TeamService } from "../services/teams.service";

export class TeamController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const teams = await TeamService.getTeams(tenantId);
      res.json({ success: true, data: teams });
    } catch (error) { next(error); }
  }

  static async findMy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const team = await TeamService.getMyTeam(req.user!.id);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const team = await TeamService.getTeam(tenantId, req.params.id);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  static async getDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const details = await TeamService.getTeamDetails(tenantId, req.params.id);
      res.json({ success: true, data: details });
    } catch (error) { next(error); }
  }

  static async selectProblemStatement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id;
      const { problemStatementId } = req.body;
      const team = await TeamService.selectProblemStatement(req.user!.id, teamId, problemStatementId);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const team = await TeamService.createTeam(tenantId, req.body);
      res.status(201).json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const team = await TeamService.updateTeam(tenantId, req.params.id, req.body);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await TeamService.deleteTeam(tenantId, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }
}
