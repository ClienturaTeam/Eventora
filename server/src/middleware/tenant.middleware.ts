

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../utils/prisma";

export const requireTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let organizationId = req.headers["x-organization-id"] as string;

  if (!organizationId && req.user) {
    const activeMember = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" }
    });
    if (activeMember) {
      organizationId = activeMember.organizationId;
    }
  }

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_TENANT", message: "x-organization-id header is required.", details: [] }
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required before tenant resolution.", details: [] }
    });
  }

  try {
    // Verify the user actually belongs to this organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId: organizationId
        }
      }
    });

    if (!membership || membership.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have access to this organization.", details: [] }
      });
    }

    // Check if the organization enforces MFA
    const orgPolicy = await prisma.organizationSecurityPolicy.findUnique({
      where: { organizationId }
    });

    if (orgPolicy?.mfaEnabled) {
      // Check if user has MFA
      const userMfa = await prisma.userMfa.findUnique({
        where: { userId: req.user.id }
      });
      if (!userMfa?.enabled) {
        // Only allow MFA setup routes
        if (!req.originalUrl.includes('/mfa/setup') && !req.originalUrl.includes('/mfa/verify-setup')) {
          return res.status(403).json({
            success: false,
            error: { code: "MFA_REQUIRED_FOR_TENANT", message: "This organization requires Multi-Factor Authentication. Please enroll.", details: [] }
          });
        }
      }
    }

    req.tenantId = organizationId;
    next();
  } catch (error) {
    next(error);
  }
};
