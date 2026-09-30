import { Router } from "express";
import { EventController } from "../controllers/events.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission, requireAnyPermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createEventSchema, updateEventSchema, addEventTeamMemberSchema, updateEventTeamMemberSchema } from "../validators/events.validator";
import { finalReportRoutes } from "./final-report.routes";

const router = Router();

// Apply auth and tenant resolution to all event routes
router.use(requireAuth);
router.use(requireTenant);

router.get("/", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.findAll);
router.get("/assigned", requirePermission("events.read_assigned"), EventController.getAssignedEvents);
router.get("/:id", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.findById);
router.get("/:id/dashboard", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getEventDashboard);
router.get("/:id/sessions", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getEventSessions);
router.get("/:id/execution-summary", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getExecutionSummary);

router.post("/", requirePermission("events.create"), validateRequest(createEventSchema), EventController.create);

router.patch("/:id", requirePermission("events.update"), validateRequest(updateEventSchema), EventController.update);

router.post("/:id/complete", requireAnyPermission(["events.complete", "reports.create_assigned"]), EventController.complete);

router.delete("/:id", requirePermission("events.delete"), EventController.delete);

// Event Round Routes
router.get("/:id/rounds", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getRounds);
router.post("/:id/rounds", requirePermission("events.update"), EventController.createRound);
router.patch("/:id/rounds/:roundId", requirePermission("events.update"), EventController.updateRound);
router.delete("/:id/rounds/:roundId", requirePermission("events.update"), EventController.deleteRound);

// Event Team Routes
router.post("/:id/assignment/faculty", requirePermission("events.assign_faculty_coordinator"), EventController.assignFacultyCoordinator);
router.post("/:id/assignment/student", requirePermission("events.assign_student_coordinator"), EventController.assignStudentCoordinator);
router.get("/:id/team", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getTeam);
router.post("/:id/team", requirePermission("events.update"), validateRequest(addEventTeamMemberSchema), EventController.addTeamMember);
router.patch("/:id/team/:memberId", requirePermission("events.update"), validateRequest(updateEventTeamMemberSchema), EventController.updateTeamMember);
router.delete("/:id/team/:memberId", requireAnyPermission(["events.update", "events.remove_student_coordinator"]), EventController.removeTeamMember);
router.delete("/:id/assignment/student/:memberId", requirePermission("events.remove_student_coordinator"), EventController.removeStudentCoordinator);

// Event Registrations Routes (for assigned coordinators)
router.get("/:id/registrations", requireAnyPermission(["events.read", "events.read_assigned"]), EventController.getRegistrations);
router.patch("/:id/registrations/:regId/status", requireAnyPermission(["events.update", "events.update_assigned"]), EventController.updateRegistrationStatus);

// Final Report Routes
router.use("/:id/final-report", finalReportRoutes);

export { router as eventRoutes };
