import { Router } from "express";
import { UserController } from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { updateUserSchema, updateUserStatusSchema, createPrivilegedUserSchema, createUserSchema } from "../validators/users.validator";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../utils/prisma";
import { requireGlobalPermission, requireAnyPermission, requireAnyGlobalPermission } from "../middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.post(
  "/privileged",
  requireAnyPermission(["users.create_manager", "users.create_faculty_coordinator"]),
  validateRequest(createPrivilegedUserSchema),
  UserController.createPrivilegedUser
);

// Profile
router.get("/me", UserController.getMe);
router.patch("/me", validateRequest(updateUserSchema), UserController.updateMe);

// Global user management (Platform Admin)

router.get("/", requireAnyGlobalPermission(["users.read", "users.manage", "platform.manage", "organization.manage"]), UserController.findAll);
router.post("/", requireAnyGlobalPermission(["users.manage", "users.create", "platform.manage", "organization.manage"]), validateRequest(createUserSchema), UserController.create);
router.get("/:id", requireAnyGlobalPermission(["users.read", "users.manage", "platform.manage", "organization.manage"]), UserController.findById);
router.patch("/:id", requireAnyGlobalPermission(["users.manage", "platform.manage", "organization.manage"]), validateRequest(updateUserSchema), UserController.update);
router.patch("/:id/status", requireAnyGlobalPermission(["users.manage", "platform.manage", "organization.manage", "users.update_student_coordinator", "users.update_participant"]), validateRequest(updateUserStatusSchema), UserController.updateStatus);
router.delete("/:id", requireAnyGlobalPermission(["users.manage", "platform.manage", "organization.manage"]), UserController.delete);

export { router as userRoutes };
