import { Router } from "express";
import { SubmissionController } from "../controllers/submissions.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";

const router = Router();
router.use(requireAuth);
router.use(requireTenant);

router.get("/", SubmissionController.findAll);
router.get("/:id", SubmissionController.findById);
router.post("/", SubmissionController.create);
router.patch("/:id", SubmissionController.update);
router.post("/:id/upload", SubmissionController.uploadFile);
router.post("/:id/final-submit", SubmissionController.finalSubmit);
router.post("/:id/assign-judge", SubmissionController.assignJudge);
router.delete("/:id/assign-judge/:judgeId", SubmissionController.unassignJudge);
router.delete("/:id", SubmissionController.delete);

export { router as submissionRoutes };
