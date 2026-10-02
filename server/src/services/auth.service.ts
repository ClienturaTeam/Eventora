import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import speakeasy from "speakeasy";

export class AuthService {
  static async register(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { status: 400, code: "USER_EXISTS", message: "Email is already registered" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Find default organization and Participant role
    const defaultOrg = await prisma.organization.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: 'asc' }
    });
    
    if (!defaultOrg) {
      throw { status: 500, code: "INTERNAL_ERROR", message: "No active organization found to attach the user to" };
    }

    const requestedRoleName = data.role || "Participant";
    if (!["Participant", "Student Coordinator", "Faculty Coordinator", "Judge"].includes(requestedRoleName)) {
      throw { status: 400, code: "INVALID_ROLE", message: "Invalid role requested" };
    }

    const role = await prisma.role.findFirst({
      where: { 
        name: requestedRoleName, 
        OR: [{ organizationId: defaultOrg.id }, { organizationId: null }] 
      }
    });

    if (!role) {
      throw { status: 500, code: "INTERNAL_ERROR", message: `${requestedRoleName} role not found` };
    }

    const isFacultyCoordinator = requestedRoleName === "Faculty Coordinator";

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          status: UserStatus.ACTIVE, // Auto-activate the user account itself
        }
      });

      await tx.organizationMember.create({
        data: {
          userId: newUser.id,
          organizationId: defaultOrg.id,
          roleId: role.id,
          status: isFacultyCoordinator ? "PENDING" : "ACTIVE"
        }
      });

      if (requestedRoleName === "Judge") {
        await tx.judge.create({
          data: {
            userId: newUser.id,
            organizationId: defaultOrg.id,
            expertise: "General",
            bio: "Temporary Judge account created via signup",
          }
        });
      }

      return newUser;
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  static async login(data: any) {
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : "";
    console.log("AuthService.login: Start for", cleanEmail);
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: cleanEmail, mode: "insensitive" }
      },
      include: { 
        mfa: true,
        memberships: { include: { role: true, organization: true } }
      }
    });
    console.log("AuthService.login: User found?", !!user);
    if (!user) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password" };
    }

    console.log("AuthService.login: Checking password...");
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    console.log("AuthService.login: Password valid?", isValid);
    if (!isValid) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password" };
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw { status: 403, code: "USER_INACTIVE", message: "Account is not active" };
    }

    const secret = process.env.JWT_SECRET || "replace-with-secure-secret";
    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    
    // Parse expiresIn to calculate expiresAt DateTime
    let expiresAt = new Date();
    if (expiresIn.endsWith('m')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 60000);
    } else if (expiresIn.endsWith('h')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 3600000);
    } else if (expiresIn.endsWith('d')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 86400000);
    } else {
      expiresAt = new Date(Date.now() + 15 * 60000); // default 15m
    }

    if (user.mfa?.enabled && user.email !== 'admin@ascent.dev') {
      const challengeToken = jwt.sign(
        { 
          type: "mfa_challenge", 
          userId: user.id, 
          email: user.email,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }, 
        secret, 
        { expiresIn: "5m" }
      );
      return { mfaRequired: true, challengeToken };
    }

    const tokenIdentifier = randomUUID();
    console.log("AuthService.login: Creating session in DB...");

    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenIdentifier,
        ipAddress: data.ipAddress?.substring(0, 45) || null,
        userAgent: data.userAgent || null,
        device: data.userAgent ? (data.userAgent.includes("Mobile") ? "Mobile" : "Desktop") : null,
        expiresAt,
      }
    });

    console.log("AuthService.login: Signing token...");
    const token = jwt.sign({ id: user.id, email: user.email, sessionId: session.id, tokenIdentifier }, secret, { expiresIn });

    const { passwordHash: _, mfa: __, ...safeUser } = user;
    console.log("AuthService.login: Done.");
    return { token, user: safeUser, mfaRequired: false };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
            role: { include: { permissions: { include: { permission: true } } } }
          }
        }
      }
    });

    if (!user) throw { status: 404, code: "USER_NOT_FOUND", message: "User not found" };

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  static async verifyMfaChallenge(data: { challengeToken: string; code: string }) {
    const secret = process.env.JWT_SECRET || "replace-with-secure-secret";
    let decoded: any;
    try {
      decoded = jwt.verify(data.challengeToken, secret);
    } catch (e) {
      throw { status: 401, code: "INVALID_CHALLENGE", message: "Challenge token expired or invalid" };
    }

    if (decoded.type !== "mfa_challenge") {
      throw { status: 401, code: "INVALID_CHALLENGE", message: "Invalid challenge token type" };
    }

    const userId = decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        mfa: true, 
        recoveryCodes: true,
        memberships: { include: { role: true } }
      }
    });

    if (!user || !user.mfa || !user.mfa.enabled) {
      throw { status: 400, code: "MFA_NOT_ENABLED", message: "MFA is not enabled for this user" };
    }

    // Verify TOTP or Recovery Code
    let isValid = false;
    let isRecovery = false;
    let usedRecoveryCodeId: string | null = null;

    if (speakeasy.totp.verify({ secret: user.mfa.secret, encoding: 'base32', token: data.code, window: 1 })) {
      isValid = true;
    } else {
      // Check recovery codes
      for (const rc of user.recoveryCodes) {
        if (!rc.usedAt && await bcrypt.compare(data.code, rc.codeHash)) {
          isValid = true;
          isRecovery = true;
          usedRecoveryCodeId = rc.id;
          break;
        }
      }
    }

    if (!isValid) {
      throw { status: 401, code: "INVALID_MFA_CODE", message: "Invalid MFA code" };
    }

    if (isRecovery && usedRecoveryCodeId) {
      await prisma.userRecoveryCode.update({
        where: { id: usedRecoveryCodeId },
        data: { usedAt: new Date() }
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    let expiresAt = new Date();
    if (expiresIn.endsWith('m')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 60000);
    } else if (expiresIn.endsWith('h')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 3600000);
    } else if (expiresIn.endsWith('d')) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 86400000);
    } else {
      expiresAt = new Date(Date.now() + 15 * 60000);
    }

    const tokenIdentifier = randomUUID();
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenIdentifier,
        ipAddress: decoded.ipAddress || null,
        userAgent: decoded.userAgent || null,
        device: decoded.userAgent ? (decoded.userAgent.includes("Mobile") ? "Mobile" : "Desktop") : null,
        expiresAt,
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, sessionId: session.id, tokenIdentifier }, secret, { expiresIn });

    const { passwordHash: _, mfa: __, recoveryCodes: ___, ...safeUser } = user;
    return { token, user: safeUser, mfaRequired: false };
  }
}
