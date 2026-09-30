import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../utils/prisma";

export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenantId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User or tenant missing in request.", details: [] }
      });
    }

    try {
      // 1. Get the user's role in the current tenant
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId: req.tenantId
          }
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!membership || !membership.role) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "No role assigned in this organization.", details: [] }
        });
      }

      // Check if temporary access delegation window has expired
      if ((membership as any).expiresAt && new Date((membership as any).expiresAt) < new Date()) {
        return res.status(403).json({
          success: false,
          error: { code: "DELEGATION_EXPIRED", message: "Your temporary role access window has expired.", details: [] }
        });
      }

      // 2. Check if the role has the required permission
      const userPermissions = membership.role.permissions.map((rp) => rp.permission.action);
      req.permissions = userPermissions;

      const hasPermission = userPermissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: { 
            code: "FORBIDDEN", 
            message: `You lack the required permission: ${requiredPermission}`, 
            details: [] 
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAnyPermission = (requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenantId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User or tenant missing in request.", details: [] }
      });
    }

    try {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId: req.tenantId
          }
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!membership || !membership.role) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "No role assigned in this organization.", details: [] }
        });
      }

      const userPermissions = membership.role.permissions.map((rp) => rp.permission.action);
      req.permissions = userPermissions;

      const hasPermission = requiredPermissions.some((p) => userPermissions.includes(p));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: { 
            code: "FORBIDDEN", 
            message: `You lack the required permissions. Needed any of: ${requiredPermissions.join(', ')}`, 
            details: [] 
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireGlobalPermission = (action: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "User missing in request.", details: [] }
    });
  }

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { 
        userId: req.user.id, 
        role: { permissions: { some: { permission: { action } } } } 
      },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        error: { code: "FORBIDDEN", message: `Global permission required: ${action}`, details: [] } 
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAnyGlobalPermission = (actions: string[]) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "User missing in request.", details: [] }
    });
  }

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { 
        userId: req.user.id, 
        role: { permissions: { some: { permission: { action: { in: actions } } } } } 
      },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        error: { code: "FORBIDDEN", message: `One of global permissions required: ${actions.join(', ')}`, details: [] } 
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
