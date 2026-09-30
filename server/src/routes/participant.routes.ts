import { Router } from "express";
import { ParticipantController } from "../controllers/participant.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/dashboard/stats", ParticipantController.getDashboardStats);
router.get("/events/discover", ParticipantController.getDiscoverEvents);
router.get("/registrations", ParticipantController.getMyRegistrations);
router.get("/access-status", ParticipantController.getAccessStatus);
router.get("/teams", ParticipantController.getMyTeams);
router.get("/submissions", ParticipantController.getMySubmissions);
router.get("/certificates", ParticipantController.getMyCertificates);
router.get("/achievements", ParticipantController.getMyAchievements);
router.get("/notifications", ParticipantController.getMyNotifications);

router.post("/registrations", ParticipantController.registerForEvent);
router.post("/registrations/team", ParticipantController.registerTeamForEvent);
router.delete("/registrations/:id", ParticipantController.withdrawRegistration);

router.post("/teams", ParticipantController.createTeam);
router.post("/teams/:id/members", ParticipantController.inviteTeamMember);
router.patch("/teams/invites/:id/accept", ParticipantController.acceptTeamInvite);

router.post("/submissions", ParticipantController.createSubmission);
router.patch("/submissions/:id", ParticipantController.updateSubmission);

router.patch("/notifications/:id/read", ParticipantController.markNotificationRead);

export default router;
