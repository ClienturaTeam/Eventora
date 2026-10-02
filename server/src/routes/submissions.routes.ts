import { Router } from "express";
import { SubmissionController } from "../controllers/submissions.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";

const router = Router();
router.use(requireAuth);

// Participant & Team submission actions (requireAuth only)
router.post("/:id/upload", SubmissionController.uploadFile);
router.post("/:id/final-submit", SubmissionController.finalSubmit);

// View submission (allows participant team members, assigned judges, or tenant staff)
router.get("/:id", SubmissionController.findById);

// Tenant-scoped management actions (requireTenant)
router.get("/", requireTenant, SubmissionController.findAll);
router.post("/", requireTenant, SubmissionController.create);
router.patch("/:id", requireTenant, SubmissionController.update);
router.post("/:id/assign-judge", requireTenant, SubmissionController.assignJudge);
router.delete("/:id/assign-judge/:judgeId", requireTenant, SubmissionController.unassignJudge);
router.delete("/:id", requireTenant, SubmissionController.delete);

export { router as submissionRoutes };
