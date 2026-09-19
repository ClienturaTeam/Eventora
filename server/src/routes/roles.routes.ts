import { Router } from "express";
import { RoleController } from "../controllers/roles.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createRoleSchema, updateRoleSchema } from "../validators/roles.validator";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../utils/prisma";

const router = Router();
router.use(requireAuth);

const requireGlobalPermission = (action: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user!.id, role: { permissions: { some: { permission: { action } } } } },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    });
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Global permission required.", details: [] } });
    }
    next();
  } catch (error) { next(error); }
};

const multiTenantRoleGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers["x-organization-id"] as string | undefined;
  if (!tenantId) {
    // Attempting platform-level operation
    return requireGlobalPermission("platform.manage")(req, res, next);
  } else {
    // Attempting tenant-level operation
    req.tenantId = tenantId; // set for requirePermission
    return requirePermission("organization.manage")(req, res, next);
  }
};

const multiTenantRoleReadGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers["x-organization-id"] as string | undefined;
  if (!tenantId) {
    return requireGlobalPermission("platform.read")(req, res, next);
  } else {
    req.tenantId = tenantId;
    return requirePermission("organization.read")(req, res, next);
  }
};

router.get("/", multiTenantRoleReadGuard, RoleController.findAll);
router.get("/permissions", multiTenantRoleReadGuard, RoleController.getPermissions);
router.get("/:id", multiTenantRoleReadGuard, RoleController.findById);
router.post("/", multiTenantRoleGuard, validateRequest(createRoleSchema), RoleController.create);
router.patch("/:id", multiTenantRoleGuard, validateRequest(updateRoleSchema), RoleController.update);
router.delete("/:id", multiTenantRoleGuard, RoleController.delete);

export { router as roleRoutes };
