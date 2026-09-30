import { Router } from "express";
import { ProblemStatementController } from "../controllers/problem-statements.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", ProblemStatementController.getAll);
router.get("/:id", ProblemStatementController.getById);
router.post("/", ProblemStatementController.create);
router.patch("/:id", ProblemStatementController.update);
router.post("/:id/release", ProblemStatementController.release);
router.post("/select", ProblemStatementController.selectForTeam);
router.post("/admin-override", ProblemStatementController.adminOverride);

export default router;
