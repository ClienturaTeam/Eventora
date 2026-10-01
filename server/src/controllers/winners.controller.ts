import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { WinnersService } from "../services/winners.service";

export class WinnersController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const data = await WinnersService.getDashboard(req.tenantId!);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message, details: [] } });
    }
  }

  static async getWinners(req: AuthRequest, res: Response) {
    try {
      const { competitionId } = req.query;
      const data = await WinnersService.getWinners(req.tenantId!, competitionId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message, details: [] } });
    }
  }

  static async getWinnerById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await WinnersService.getWinnerById(id, req.tenantId!);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === "Winner not found") {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: error.message, details: [] } });
      }
      res.status(500).json({ success: false, error: { message: error.message, details: [] } });
    }
  }

  static async selectWinner(req: AuthRequest, res: Response) {
    try {
      const { competitionId, submissionId, position, prizeId } = req.body;
      const data = await WinnersService.selectWinner(
        req.tenantId!,
        { competitionId, submissionId, position, prizeId },
        req.user!.id
      );
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: error.message, details: [] } });
    }
  }

  static async finalizeWinner(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await WinnersService.finalizeWinner(id, req.tenantId!, req.user!.id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: error.message, details: [] } });
    }
  }

  static async getPrizes(req: AuthRequest, res: Response) {
    try {
      const { competitionId } = req.query;
      const data = await WinnersService.getPrizes(req.tenantId!, competitionId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message, details: [] } });
    }
  }

  static async getFinalists(req: AuthRequest, res: Response) {
    try {
      const { competitionId } = req.query;
      if (!competitionId) {
        return res.status(400).json({ success: false, error: { message: "competitionId query param is required." } });
      }
      const data = await WinnersService.getFinalists(req.tenantId!, competitionId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message, details: [] } });
    }
  }

  static async updatePrizeStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await WinnersService.updatePrizeStatus(req.tenantId!, id, status);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message, details: [] } });
    }
  }
}
