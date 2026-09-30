import { Router } from "express";
import { JudgeController } from "../controllers/judges.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
  createJudgeSchema,
  updateJudgeSchema,
  assignCompetitionSchema,
} from "../validators/judges.validator";

const router = Router();
router.use(requireAuth);
router.use(requireTenant);

router.get("/", requirePermission("evaluations.read"), JudgeController.findAll);
router.get("/me", JudgeController.findMe);
router.get("/:id", requirePermission("evaluations.read"), JudgeController.findById);
router.post(
  "/",
  requirePermission("evaluations.manage"),
  validateRequest(createJudgeSchema),
  JudgeController.create
);
router.patch(
  "/:id",
  requirePermission("evaluations.manage"),
  validateRequest(updateJudgeSchema),
  JudgeController.update
);
router.delete("/:id", requirePermission("evaluations.manage"), JudgeController.delete);

// Competition assignment
router.post(
  "/:id/competitions",
  requirePermission("evaluations.manage"),
  validateRequest(assignCompetitionSchema),
  JudgeController.assignCompetition
);
router.delete(
  "/:id/competitions/:competitionId",
  requirePermission("evaluations.manage"),
  JudgeController.removeCompetition
);

export { router as judgeRoutes };
