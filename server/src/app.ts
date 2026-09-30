import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const app = express();

// Security middlewares
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8081",
  "http://localhost:8080",
  "http://localhost:8082",
  "http://localhost:8083"
];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Webhook for Stripe must use raw body BEFORE express.json()
import { PaymentsController } from "./controllers/payments.controller";
app.post("/api/v1/payments/webhooks/stripe", express.raw({ type: "application/json" }), PaymentsController.handleWebhook);


// Parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { logger } from "./utils/logger";

// Request logging middleware with performance duration tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(req.method, req.originalUrl || req.url, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });
  next();
});

import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/events.routes";
import { organizationRoutes } from "./routes/organizations.routes";
import { userRoutes } from "./routes/users.routes";
import { roleRoutes } from "./routes/roles.routes";
import { permissionRoutes } from "./routes/permissions.routes";
import { competitionRoutes } from "./routes/competitions.routes";
import { registrationRoutes } from "./routes/registrations.routes";
import { teamRoutes } from "./routes/teams.routes";
import { submissionRoutes } from "./routes/submissions.routes";
import { evaluationRoutes } from "./routes/evaluations.routes";
import { judgeRoutes } from "./routes/judges.routes";
import { mentorRoutes } from "./routes/mentors.routes";
import { volunteerRoutes } from "./routes/volunteers.routes";
import { attendanceRoutes } from "./routes/attendance.routes";
import { certificatesRouter } from "./routes/certificates.routes";
import communicationRoutes from "./routes/communications.routes";
import notificationRoutes from "./routes/notifications.routes";
import winnersRoutes from "./routes/winners.routes";
import badgesRoutes from "./routes/badges.routes";

// Phase 4D Routes
import learningRoutes from "./routes/learning.routes";
import communityRoutes from "./routes/community.routes";
import feedbackRoutes from "./routes/feedback.routes";
import recruitmentRoutes from "./routes/recruitment.routes";
import sponsorsRoutes from "./routes/sponsors.routes";

// Phase 4E Routes
import reportsRoutes from "./routes/reports.routes";

// Phase 4F Routes
import workflowsRoutes from "./routes/workflows.routes";
import integrationsRoutes from "./routes/integrations.routes";
import aiValidationRoutes from "./routes/ai-validation.routes";
import aiCopilotRoutes from "./routes/ai-copilot.routes";
import paymentsRoutes from "./routes/payments.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import securityRoutes from "./routes/security.routes";

import managerRoutes from "./routes/manager.routes";
import participantRoutes from "./routes/participant.routes";
import { hackathonProposalRoutes } from "./routes/hackathon-proposals.routes";
import platformAdminRoutes from "./routes/platform-admin.routes";

import problemStatementRoutes from "./routes/problem-statements.routes";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/competitions", competitionRoutes);
app.use("/api/v1/registrations", registrationRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/evaluations", evaluationRoutes);
app.use("/api/v1/judges", judgeRoutes);
app.use("/api/v1/mentors", mentorRoutes);
app.use("/api/v1/volunteers", volunteerRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/certificates", certificatesRouter);
app.use("/api/v1/communications", communicationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/winners", winnersRoutes);
app.use("/api/v1/badges", badgesRoutes);
app.use("/api/v1/problem-statements", problemStatementRoutes);

// Phase 4D
app.use("/api/v1/learning", learningRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/recruitment", recruitmentRoutes);
app.use("/api/v1/sponsors", sponsorsRoutes);

// Phase 4E
app.use("/api/v1/reports", reportsRoutes);

// Phase 4F
app.use("/api/v1/workflows", workflowsRoutes);
app.use("/api/v1/integrations", integrationsRoutes);
app.use("/api/v1/ai-validation", aiValidationRoutes);
app.use("/api/v1/ai-copilot", aiCopilotRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/security", securityRoutes);
app.use("/api/v1/manager", managerRoutes);
app.use("/api/v1/participant", participantRoutes);
app.use("/api/v1/hackathon-proposals", hackathonProposalRoutes);
app.use("/api/v1/platform-admin", platformAdminRoutes);

// Health check endpoint
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({ success: true, message: "Eventora API is healthy" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
      details: [],
    },
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  logger.error(`[API ERROR ${status}] ${req.method} ${req.originalUrl || req.url}`, err, {
    code: err.code || "INTERNAL_SERVER_ERROR",
    path: req.originalUrl || req.url,
    method: req.method,
  });

  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred.",
      details: err.details || [],
    },
  });
});
