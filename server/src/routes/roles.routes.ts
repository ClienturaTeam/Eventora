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
  const permissionsToPass = ["platform.manage", "organization.manage", "users.manage"];
  
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User missing in request.", details: [] } });
  }

  // Check if user has global or tenant permission
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user.id,
      ...(tenantId ? { organizationId: tenantId } : {}),
      role: { permissions: { some: { permission: { action: { in: permissionsToPass } } } } }
    }
  });

  if (!membership) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions to manage roles.", details: [] } });
  }

  req.tenantId = tenantId;
  next();
};

const multiTenantRoleReadGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers["x-organization-id"] as string | undefined;
  const permissionsToPass = ["platform.read", "platform.manage", "organization.read", "organization.manage", "users.read", "users.manage"];

  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User missing in request.", details: [] } });
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user.id,
      ...(tenantId ? { organizationId: tenantId } : {}),
      role: { permissions: { some: { permission: { action: { in: permissionsToPass } } } } }
    }
  });

  if (!membership) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions to read roles.", details: [] } });
  }

  req.tenantId = tenantId;
  next();
};

router.get("/", multiTenantRoleReadGuard, RoleController.findAll);
router.get("/permissions", multiTenantRoleReadGuard, RoleController.getPermissions);
router.get("/:id", multiTenantRoleReadGuard, RoleController.findById);
router.post("/", multiTenantRoleGuard, validateRequest(createRoleSchema), RoleController.create);
router.patch("/:id", multiTenantRoleGuard, validateRequest(updateRoleSchema), RoleController.update);
router.delete("/:id", multiTenantRoleGuard, RoleController.delete);

export { router as roleRoutes };
