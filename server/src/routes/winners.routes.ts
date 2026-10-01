import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { WinnersController } from "../controllers/winners.controller";

const router = Router();

// Apply global middleware
router.use(requireAuth);
router.use(requireTenant);

// Dashboard
router.get("/dashboard", requirePermission("winners.read"), WinnersController.getDashboard);

// Winners list and creation
router.get("/", requirePermission("winners.read"), WinnersController.getWinners);
router.post("/", requirePermission("winners.manage"), WinnersController.selectWinner);

// Prizes list & status update
router.get("/prizes", requirePermission("winners.read"), WinnersController.getPrizes);
router.patch("/prizes/:id/status", requirePermission("winners.manage"), WinnersController.updatePrizeStatus);

// Finalists leaderboard for selection
router.get("/finalists", requirePermission("winners.read"), WinnersController.getFinalists);

// Individual Winner operations
router.get("/:id", requirePermission("winners.read"), WinnersController.getWinnerById);
router.post("/:id/finalize", requirePermission("winners.finalize"), WinnersController.finalizeWinner);

export default router;
