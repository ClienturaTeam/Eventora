import { Router } from "express";
import { MentorController } from "../controllers/mentors.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createMentorSchema, updateMentorSchema, assignTeamSchema } from "../validators/mentors.validator";

const router = Router();
router.use(requireAuth);
router.use(requireTenant);

router.get("/", requirePermission("events.read"), MentorController.findAll);
router.get("/:id", requirePermission("events.read"), MentorController.findById);
router.post("/", requirePermission("events.create"), validateRequest(createMentorSchema), MentorController.create);
router.patch("/:id", requirePermission("events.update"), validateRequest(updateMentorSchema), MentorController.update);
router.delete("/:id", requirePermission("events.delete"), MentorController.delete);

// Team assignment
router.post("/:id/teams", requirePermission("events.update"), validateRequest(assignTeamSchema), MentorController.assignTeam);
router.delete("/:id/teams/:teamId", requirePermission("events.update"), MentorController.removeTeam);

// Mentor Q&A Routes
router.get("/questions/all", MentorController.getQuestions);
router.post("/questions", MentorController.askQuestion);
router.get("/questions/:id", MentorController.getQuestionById);
router.post("/questions/:id/replies", MentorController.addReply);
router.patch("/questions/:id/status", MentorController.updateQuestionStatus);

export { router as mentorRoutes };
