import { Router } from "express";
import { MentorController } from "../controllers/mentors.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createMentorSchema, updateMentorSchema, assignTeamSchema } from "../validators/mentors.validator";

const router = Router();
router.use(requireAuth);
// Mentor Q&A Routes (Available to participants and mentors; placed first so :id doesn't match /questions)
router.get("/questions", MentorController.getQuestions);
router.get("/questions/all", MentorController.getQuestions);
router.post("/questions", MentorController.askQuestion);
router.get("/questions/:id", MentorController.getQuestionById);
router.post("/questions/:id/replies", MentorController.addReply);
router.patch("/questions/:id/status", MentorController.updateQuestionStatus);

// Directory & Management Routes (Tenant-scoped)
router.get("/", requireTenant, requirePermission("events.read"), MentorController.findAll);
router.get("/:id", requireTenant, requirePermission("events.read"), MentorController.findById);
router.post("/", requireTenant, requirePermission("events.create"), validateRequest(createMentorSchema), MentorController.create);
router.patch("/:id", requireTenant, requirePermission("events.update"), validateRequest(updateMentorSchema), MentorController.update);
router.delete("/:id", requireTenant, requirePermission("events.delete"), MentorController.delete);

// Team assignment
router.post("/:id/teams", requireTenant, requirePermission("events.update"), validateRequest(assignTeamSchema), MentorController.assignTeam);
router.delete("/:id/teams/:teamId", requireTenant, requirePermission("events.update"), MentorController.removeTeam);

export { router as mentorRoutes };
