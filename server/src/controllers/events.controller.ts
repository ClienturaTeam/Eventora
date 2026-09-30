import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { EventService } from "../services/events.service";
import { EventExecutionService } from "../services/event-execution.service";
import { EventTeamService } from "../services/event-team.service";
import { RegistrationService } from "../services/registrations.service";
import { prisma } from "../utils/prisma";

export class EventController {
  static async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const events = await EventService.getEvents(tenantId, onlyAssignedUserId);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const event = await EventService.getEvent(tenantId, req.params.id, onlyAssignedUserId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const event = await EventService.createEvent(tenantId, req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const event = await EventService.updateEvent(tenantId, req.params.id, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await EventService.deleteEvent(tenantId, req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getRounds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const rounds = await EventService.getRounds(tenantId, req.params.id);
      res.json({ success: true, data: rounds });
    } catch (error) {
      next(error);
    }
  }

  static async createRound(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const round = await EventService.createRound(tenantId, req.params.id, req.body);
      res.status(201).json({ success: true, data: round });
    } catch (error) {
      next(error);
    }
  }

  static async updateRound(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const round = await EventService.updateRound(tenantId, req.params.id, req.params.roundId, req.body);
      res.json({ success: true, data: round });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRound(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await EventService.deleteRound(tenantId, req.params.id, req.params.roundId);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getEventDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const dashboardData = await EventService.getEventDashboard(tenantId, req.params.id, onlyAssignedUserId);
      res.json({ success: true, data: dashboardData });
    } catch (error) {
      next(error);
    }
  }

  static async getEventSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const sessions = await EventService.getEventSessions(tenantId, req.params.id, onlyAssignedUserId);
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  static async getExecutionSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const summary = await EventExecutionService.getExecutionSummary(tenantId, req.params.id, onlyAssignedUserId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const eventId = req.params.id;
      const userId = req.user!.id;
      const permissions = req.permissions || [];
      
      const hasGlobalComplete = permissions.includes("events.complete");

      if (!hasGlobalComplete) {
        const teamMember = await prisma.eventTeamMember.findFirst({
          where: {
            eventId,
            userId,
            responsibility: 'Primary Student Coordinator'
          }
        });
        
        if (!teamMember) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You must be the Primary Student Coordinator to complete this event',
              details: []
            }
          });
        }
      }

      const event = await EventExecutionService.completeEvent(tenantId, eventId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async getTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("events.read");
      const onlyAssignedUserId = hasGlobalRead ? undefined : req.user!.id;

      const team = await EventTeamService.getTeam(tenantId, req.params.id, onlyAssignedUserId);
      res.json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  }

  static async addTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { userId, responsibility } = req.body;
      const member = await EventTeamService.addMember(tenantId, req.params.id, userId, responsibility);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async updateTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { responsibility } = req.body;
      const member = await EventTeamService.updateMember(tenantId, req.params.id, req.params.memberId, responsibility);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async removeTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await EventTeamService.removeMember(tenantId, req.params.id, req.params.memberId);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async assignFacultyCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { userId } = req.body;
      const member = await EventTeamService.assignFacultyCoordinator(tenantId, req.params.id, userId);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async assignStudentCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { userId } = req.body;
      const member = await EventTeamService.assignPrimaryCoordinator(tenantId, req.params.id, userId);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async removeStudentCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      await EventTeamService.removeMember(tenantId, req.params.id, req.params.memberId);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignedEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      
      const events = await EventService.getEvents(tenantId, userId);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async getRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const eventId = req.params.id;
      
      const data = await RegistrationService.getRegistrations(tenantId, { eventId });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateRegistrationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const eventId = req.params.id; // ensures contextual safety though we rely on regId
      const regId = req.params.regId;
      
      const data = await RegistrationService.updateRegistration(tenantId, regId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
