import { Router } from "express";
import { TeamController } from "../controllers/teams.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/me", TeamController.findMy);
router.get("/", TeamController.findAll);
router.get("/:id", TeamController.findById);
router.patch("/:id/problem-statement", TeamController.selectProblemStatement);
router.post("/", TeamController.create);
router.patch("/:id", TeamController.update);
router.delete("/:id", TeamController.delete);

export { router as teamRoutes };
