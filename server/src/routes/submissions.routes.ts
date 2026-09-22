import { Router } from "express";
import { SubmissionController } from "../controllers/submissions.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", SubmissionController.findAll);
router.get("/:id", SubmissionController.findById);
router.post("/", SubmissionController.create);
router.patch("/:id", SubmissionController.update);
router.post("/:id/upload", SubmissionController.uploadFile);
router.post("/:id/final-submit", SubmissionController.finalSubmit);
router.delete("/:id", SubmissionController.delete);

export { router as submissionRoutes };
