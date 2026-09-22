import { Router } from "express";
import { NotificationController } from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", NotificationController.findMy);
router.post("/read-all", NotificationController.markAllAsRead);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.delete);

export default router;
