import { Request, Response, NextFunction } from "express";
import { ParticipantService } from "../services/participant.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class ParticipantController {
  static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await ParticipantService.getDashboardStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getDiscoverEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const events = await ParticipantService.getDiscoverEvents();
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.getMyRegistrations(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async registerForEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.registerForEvent(req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async registerTeamForEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.registerTeamForEvent(req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async withdrawRegistration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ParticipantService.withdrawRegistration(req.user!.id, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getMyTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.getMyTeams(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.createTeam(req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async inviteTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.inviteTeamMember(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async acceptTeamInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.acceptTeamInvite(req.user!.id, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAccessStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) {
        return res.status(400).json({ success: false, message: "eventId is required." });
      }
      const data = await ParticipantService.verifyParticipantRegistrationAndPayment(req.user!.id, eventId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMySubmissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eventId = req.query.eventId as string | undefined;
      const data = await ParticipantService.getMySubmissions(req.user!.id, eventId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eventId = req.query.eventId as string | undefined;
      const data = await ParticipantService.getSubmissionById(req.user!.id, req.params.id, eventId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.createSubmission(req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.updateSubmission(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMyCertificates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.getMyCertificates(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAchievements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.getMyAchievements(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.getMyNotifications(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ParticipantService.markNotificationRead(req.user!.id, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
