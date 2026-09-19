import { SecurityRepository } from "../repositories/security.repository";
import { AuditService } from "./audit.service";
import speakeasy from "speakeasy";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export class SecurityService {
  static async getSecurityDashboard(tenantId: string) {
    return SecurityRepository.getSecurityDashboardMetrics(tenantId);
  }

  static async getSecurityPolicy(tenantId: string) {
    return SecurityRepository.getSecurityPolicy(tenantId);
  }

  static async updateSecurityPolicy(tenantId: string, actorId: string, data: any) {
    const updatedPolicy = await SecurityRepository.updateSecurityPolicy(tenantId, data);
    
    await AuditService.logAction({
      organizationId: tenantId,
      actorId,
      action: "UPDATE_SECURITY_POLICY",
      target: "OrganizationSecurityPolicy",
      metadata: data
    });

    await SecurityRepository.logSecurityEvent(
      tenantId,
      actorId,
      "Security Policy Updated",
      "Medium"
    );

    return updatedPolicy;
  }

  static async getActiveSessions(tenantId: string) {
    return SecurityRepository.getActiveSessions(tenantId);
  }

  static async revokeSession(tenantId: string, actorId: string, sessionId: string) {
    await SecurityRepository.revokeSession(tenantId, sessionId);

    await AuditService.logAction({
      organizationId: tenantId,
      actorId,
      action: "REVOKE_SESSION",
      target: sessionId
    });

    await SecurityRepository.logSecurityEvent(
      tenantId,
      actorId,
      "Session Revoked",
      "Medium"
    );

    return { success: true };
  }

  static async revokeAllOtherSessions(tenantId: string, userId: string, keepSessionId: string) {
    await SecurityRepository.revokeAllOtherSessions(tenantId, userId, keepSessionId);

    await AuditService.logAction({
      organizationId: tenantId,
      actorId: userId,
      action: "REVOKE_ALL_OTHER_SESSIONS",
      target: userId
    });

    await SecurityRepository.logSecurityEvent(
      tenantId,
      userId,
      "All Other Sessions Revoked",
      "High"
    );

    return { success: true };
  }

  static async getSecurityEvents(tenantId: string) {
    return SecurityRepository.getSecurityEvents(tenantId);
  }
  static async setupMfa(tenantId: string, userId: string) {

    
    // Check if user already has MFA enabled
    const existing = await prisma.userMfa.findUnique({ where: { userId } });
    if (existing && existing.enabled) {
      throw { status: 400, code: "MFA_ALREADY_ENABLED", message: "MFA is already enabled" };
    }

    const secret = speakeasy.generateSecret({ name: 'EventoraPlatform' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { status: 404, code: "USER_NOT_FOUND", message: "User not found" };
    
    // Generate provisioning URI
    const otpauth = secret.otpauth_url || '';
    
    await prisma.userMfa.upsert({
      where: { userId },
      update: { secret: secret.base32, enabled: false },
      create: { userId, secret: secret.base32, enabled: false }
    });

    return { secret: secret.base32, otpauth };
  }

  static async verifySetupMfa(tenantId: string, userId: string, code: string) {
    const mfa = await prisma.userMfa.findUnique({ where: { userId } });
    if (!mfa) {
      throw { status: 400, code: "MFA_NOT_SETUP", message: "MFA setup not initiated" };
    }
    if (mfa.enabled) {
      throw { status: 400, code: "MFA_ALREADY_ENABLED", message: "MFA is already enabled" };
    }

    const isValid = speakeasy.totp.verify({ secret: mfa.secret, encoding: 'base32', token: code, window: 1 });
    if (!isValid) {
      throw { status: 400, code: "INVALID_MFA_CODE", message: "Invalid MFA code" };
    }

    // Generate 10 recovery codes
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    
    // Hash them and store
    await prisma.userRecoveryCode.deleteMany({ where: { userId } });
    const hashedCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));
    
    await prisma.userRecoveryCode.createMany({
      data: hashedCodes.map(hash => ({ userId, codeHash: hash }))
    });

    await prisma.userMfa.update({
      where: { userId },
      data: { enabled: true, verifiedAt: new Date() }
    });

    await SecurityRepository.logSecurityEvent(tenantId, userId, "MFA Enabled", "Medium");

    return { recoveryCodes };
  }

  static async disableMfa(tenantId: string, actorId: string, targetUserId: string) {
    
    // If user is disabling their own MFA, check if any org requires it
    if (actorId === targetUserId) {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: actorId, status: "ACTIVE" },
        include: { organization: { include: { securityPolicy: true } } }
      });
      
      const enforcesMfa = memberships.some((m: any) => m.organization?.securityPolicy?.mfaEnabled);
      if (enforcesMfa) {
        throw { status: 403, code: "MFA_REQUIRED_BY_ORG", message: "Cannot disable MFA as one of your organizations requires it" };
      }
    } else {
      // Ensure actor has permission in the tenant to manage the target user
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: targetUserId, organizationId: tenantId } }
      });
      if (!membership) {
        throw { status: 403, code: "FORBIDDEN", message: "Target user is not in this organization" };
      }
    }

    await prisma.userMfa.update({
      where: { userId: targetUserId },
      data: { enabled: false }
    });
    
    await prisma.userRecoveryCode.deleteMany({ where: { userId: targetUserId } });

    await SecurityRepository.logSecurityEvent(tenantId, actorId, "MFA Disabled", "High");
    
    return { success: true };
  }
} 
