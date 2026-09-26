import { Router } from "express";
import { EvaluationController } from "../controllers/evaluations.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createEvaluationSchema, updateEvaluationSchema } from "../validators/evaluations.validator";

const router = Router();
router.use(requireAuth);
router.use(requireTenant);

// All evaluations in tenant (admin/manager view)
router.get("/", requirePermission("evaluations.read"), EvaluationController.findAll);

// Current judge's own evaluations (no extra permission needed — every authenticated tenant member can see their own)
router.get("/my", EvaluationController.findMine);

router.get("/:id", requirePermission("evaluations.read"), EvaluationController.findById);

// Assign a submission to a judge
router.post(
  "/",
  requirePermission("evaluations.manage"),
  validateRequest(createEvaluationSchema),
  EvaluationController.create
);

// Update score/feedback — judge-ownership & assignment check enforced in controller/service
router.patch(
  "/:id",
  validateRequest(updateEvaluationSchema),
  EvaluationController.update
);

// Admin requests evaluation correction from judge
router.post(
  "/:id/request-correction",
  requirePermission("evaluations.manage"),
  EvaluationController.requestCorrection
);

router.delete("/:id", requirePermission("evaluations.manage"), EvaluationController.delete);

export { router as evaluationRoutes };
