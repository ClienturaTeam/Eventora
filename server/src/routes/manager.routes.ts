import { Router } from "express";
import { ManagerController } from "../controllers/manager.controller";
import { ManagerRequestsController } from "../controllers/manager-requests.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get("/dashboard/stats", ManagerController.getDashboardStats); // implicit permission by role

// Requests
router.get("/requests/faculty-coordinator", requirePermission("users.create_faculty_coordinator"), ManagerRequestsController.getRequests);
router.patch("/requests/faculty-coordinator/:memberId/status", requirePermission("users.create_faculty_coordinator"), ManagerRequestsController.updateRequestStatus);

router.get("/events", requirePermission("events.read"), ManagerController.getEvents);
router.get("/registrations", requirePermission("registrations.read"), ManagerController.getRegistrations);
router.get("/teams", requirePermission("teams.read"), ManagerController.getTeams);
router.get("/submissions", requirePermission("submissions.read"), ManagerController.getSubmissions);
router.get("/evaluations", requirePermission("evaluations.read"), ManagerController.getEvaluations);
router.get("/judges", requirePermission("events.read"), ManagerController.getJudges);
router.get("/volunteers", requirePermission("events.read"), ManagerController.getVolunteers);
router.get("/certificates", requirePermission("certificates.read"), ManagerController.getCertificates);

// Events
router.post("/events", requirePermission("events.create"), ManagerController.createEvent);
router.patch("/events/:id", requirePermission("events.update"), ManagerController.updateEvent);
router.delete("/events/:id", requirePermission("events.delete"), ManagerController.deleteEvent);

// Registrations
router.patch("/registrations/:id/status", requirePermission("registrations.manage"), ManagerController.updateRegistrationStatus);

// Teams
router.post("/teams", requirePermission("teams.manage"), ManagerController.createTeam);
router.patch("/teams/:id", requirePermission("teams.manage"), ManagerController.updateTeam);
router.delete("/teams/:id", requirePermission("teams.manage"), ManagerController.deleteTeam);

// Submissions
router.patch("/submissions/:id", requirePermission("submissions.manage"), ManagerController.updateSubmission);

// Evaluations
router.post("/evaluations", requirePermission("evaluations.manage"), ManagerController.createEvaluation);
router.patch("/evaluations/:id", requirePermission("evaluations.manage"), ManagerController.updateEvaluation);

// Judges
router.post("/judges", requirePermission("events.update"), ManagerController.assignJudge);
router.delete("/judges/:id", requirePermission("events.update"), ManagerController.removeJudge);

// Volunteers
router.post("/volunteers", requirePermission("events.update"), ManagerController.assignVolunteer);
router.delete("/volunteers/:id", requirePermission("events.update"), ManagerController.removeVolunteer);

// Attendance
router.get("/attendance", requirePermission("events.read"), ManagerController.getAttendance);

// Certificates
router.post("/certificates", requirePermission("certificates.create"), ManagerController.issueCertificate);
router.patch("/certificates/:id", requirePermission("certificates.update"), ManagerController.updateCertificate);

// Reports
router.get("/reports", requirePermission("reports.read"), ManagerController.getReports);

// Results & Prizes
router.post("/results/publish", requirePermission("evaluations.manage"), ManagerController.publishResult);
router.patch("/prizes/:id/status", requirePermission("evaluations.manage"), ManagerController.updatePrizeStatus);

export default router;
