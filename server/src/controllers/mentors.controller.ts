import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { MentorService } from "../services/mentors.service";

export class MentorController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.getMentors(req.tenantId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.getMentor(req.tenantId as string, req.params.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.createMentor(req.tenantId as string, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.updateMentor(req.tenantId as string, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await MentorService.deleteMentor(req.tenantId as string, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }

  static async assignTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await MentorService.assignTeam(
        req.tenantId as string,
        req.params.id,
        req.body.teamId
      );
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async removeTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await MentorService.removeTeam(
        req.tenantId as string,
        req.params.id,
        req.params.teamId
      );
      res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
  }

  // Mentor Q&A Controllers
  static async askQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const data = await MentorService.askQuestion(tenantId, req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const filters = {
        eventId: req.query.eventId as string,
        roundId: req.query.roundId as string,
        status: req.query.status as string,
      };
      const data = await MentorService.getQuestions(tenantId, req.user!.id, filters);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getQuestionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const data = await MentorService.getQuestionById(tenantId, req.params.id, req.user!.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async addReply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const message = req.body.message || req.body.reply;
      const reply = await MentorService.addReply(tenantId, req.params.id, req.user!.id, message);
      res.status(201).json({ success: true, data: reply });
    } catch (error) { next(error); }
  }

  static async updateQuestionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const data = await MentorService.updateQuestionStatus(tenantId, req.params.id, req.body.status);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
