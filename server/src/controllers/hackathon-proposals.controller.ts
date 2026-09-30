import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { HackathonProposalService } from "../services/hackathon-proposals.service";

export class HackathonProposalController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      const proposal = await HackathonProposalService.createProposal(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProposals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      const proposals = await HackathonProposalService.getMyProposals(tenantId, userId);
      res.json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const proposals = await HackathonProposalService.getAllProposals(tenantId);
      res.json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingManager(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      const proposals = await HackathonProposalService.getManagerProposals(tenantId, userId);
      res.json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingPrincipal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const proposals = await HackathonProposalService.getPendingPrincipalReviews(tenantId);
      res.json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  }

  static async getApproved(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const proposals = await HackathonProposalService.getApprovedProposals(tenantId);
      res.json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const proposal = await HackathonProposalService.getProposal(tenantId, req.params.id);
      
      const permissions = req.permissions || [];
      const hasGlobalRead = permissions.includes("hackathon_proposals.read");
      const hasReadOwn = permissions.includes("hackathon_proposals.read_own");

      if (!hasGlobalRead) {
        if (hasReadOwn && proposal.submittedById !== req.user!.id) {
          throw { status: 403, code: "FORBIDDEN", message: "You can only view your own proposals." };
        }
      }

      res.json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;

      // Extract only safe fields, prevent direct status/manager manipulations
      const safeData = {
        title: req.body.title,
        description: req.body.description,
        expectedParticipants: req.body.expectedParticipants,
        estimatedBudget: req.body.estimatedBudget,
        requiredManpower: req.body.requiredManpower,
        estimatedWorkingHours: req.body.estimatedWorkingHours,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        requirements: req.body.requirements,
      };

      // Remove undefined keys
      Object.keys(safeData).forEach(key => (safeData as any)[key] === undefined && delete (safeData as any)[key]);

      const permissions = req.permissions || [];
      const hasGlobalUpdate = permissions.includes("hackathon_proposals.update");
      
      const proposal = await HackathonProposalService.updateProposal(tenantId, req.params.id, userId, safeData, hasGlobalUpdate);
      res.json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      const proposal = await HackathonProposalService.submitProposal(tenantId, req.params.id, userId);
      res.json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async managerReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const managerId = req.user!.id;
      const { action, comment } = req.body;
      const proposal = await HackathonProposalService.managerReview(tenantId, req.params.id, managerId, action, comment);
      res.json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async principalReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const principalId = req.user!.id;
      const { action, comment } = req.body;
      const proposal = await HackathonProposalService.principalReview(tenantId, req.params.id, principalId, action, comment);
      res.json({ success: true, data: proposal });
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const userId = req.user!.id;
      
      const safeData = {
        name: req.body.name,
        description: req.body.description,
        rules: req.body.rules,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        status: req.body.status,
        price: req.body.price || 0,
        currency: req.body.currency || 'INR',
        registrationType: req.body.registrationType,
        minTeamSize: req.body.minTeamSize,
        maxTeamSize: req.body.maxTeamSize,
        registrationStart: req.body.registrationStart,
        registrationEnd: req.body.registrationEnd,
        facultyCoordinatorId: req.body.facultyCoordinatorId,
        studentCoordinatorId: req.body.studentCoordinatorId,
      };

      const permissions = req.permissions || [];
      const hasGlobalCreate = permissions.includes("hackathon_proposals.create_event");

      const result = await HackathonProposalService.createEventFromProposal(tenantId, req.params.id, userId, safeData, hasGlobalCreate);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId as string;
      const { id } = req.params;
      const userId = req.user!.id;
      await HackathonProposalService.deleteProposal(tenantId, id, userId);
      res.json({ success: true, message: 'Proposal deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
