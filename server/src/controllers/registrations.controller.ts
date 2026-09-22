import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { RegistrationService } from "../services/registrations.service";

export class RegistrationController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const eventId = req.query.eventId as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      const regs = await RegistrationService.getRegistrations(tenantId, { eventId, search, limit });
      res.json({ success: true, data: regs });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const reg = await RegistrationService.getRegistration(tenantId, req.params.id);
      res.json({ success: true, data: reg });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const reg = await RegistrationService.createRegistration(tenantId, req.body);
      res.status(201).json({ success: true, data: reg });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const reg = await RegistrationService.updateRegistration(tenantId, req.params.id, req.body);
      res.json({ success: true, data: reg });
    } catch (error) { next(error); }
  }

  static async registerTeam(req: any, res: Response, next: NextFunction) {
    try {
      const result = await RegistrationService.registerTeam(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await RegistrationService.deleteRegistration(tenantId, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }
}
