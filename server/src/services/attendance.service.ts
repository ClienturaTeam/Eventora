import { AttendanceRepository } from "../repositories/attendance.repository";
import { AttendanceMethod, AttendanceStatus, SessionStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

export class AttendanceService {
  // Sessions
  static async getSessions(tenantId: string) {
    return AttendanceRepository.findAllSessions(tenantId);
  }

  static async getSession(tenantId: string, sessionId: string) {
    const session = await AttendanceRepository.findSessionById(tenantId, sessionId);
    if (!session) throw { status: 404, code: "NOT_FOUND", message: "Session not found." };
    return session;
  }

  static async createSession(
    tenantId: string,
    data: {
      eventId: string;
      name: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      status?: SessionStatus;
    }
  ) {
    return AttendanceRepository.createSession(tenantId, data);
  }

  static async updateSession(
    tenantId: string,
    sessionId: string,
    data: { status?: SessionStatus; name?: string }
  ) {
    const session = await AttendanceRepository.updateSession(tenantId, sessionId, data);
    if (!session) throw { status: 404, code: "NOT_FOUND", message: "Session not found." };
    return session;
  }

  // Records
  static async getRecords(tenantId: string) {
    return AttendanceRepository.findAllRecords(tenantId);
  }

  static async checkIn(
    tenantId: string,
    sessionId: string,
    userId: string,
    method?: AttendanceMethod,
    status?: AttendanceStatus
  ) {
    return AttendanceRepository.checkIn(tenantId, sessionId, userId, method, status);
  }

  static async checkOut(tenantId: string, sessionId: string, userId: string) {
    return AttendanceRepository.checkOut(tenantId, sessionId, userId);
  }

  // QR Scanning
  static async generateQr(tenantId: string, sessionId: string) {
    const session = await AttendanceRepository.findSessionById(tenantId, sessionId);
    if (!session) throw { status: 404, code: "NOT_FOUND", message: "Session not found." };
    if (session.status !== "LIVE") throw { status: 400, code: "BAD_REQUEST", message: "Session is not active." };

    const secret = process.env.JWT_SECRET || "replace-with-secure-secret";
    // 15 minute token
    const token = jwt.sign({ sessionId, tenantId, type: "SESSION_QR" }, secret, { expiresIn: "15m" });
    return { token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
  }

  static async scanQr(tenantId: string, token: string, userId: string) {
    const secret = process.env.JWT_SECRET || "replace-with-secure-secret";
    try {
      const decoded = jwt.verify(token, secret) as { sessionId: string; tenantId: string; type: string };
      
      if (decoded.type !== "SESSION_QR") {
        throw { status: 400, code: "INVALID_TOKEN", message: "Invalid QR code." };
      }
      
      if (decoded.tenantId !== tenantId) {
        throw { status: 403, code: "FORBIDDEN", message: "QR code belongs to a different organization." };
      }

      // Check if session is still live
      const session = await AttendanceRepository.findSessionById(tenantId, decoded.sessionId);
      if (!session) {
        throw { status: 404, code: "NOT_FOUND", message: "Session not found." };
      }
      if (session.status !== "LIVE") {
        throw { status: 400, code: "BAD_REQUEST", message: "Session is not active." };
      }

      // Prevent duplicate check-ins
      const existing = session.records.find((r: any) => r.user.id === userId);
      if (existing) {
        throw { status: 400, code: "DUPLICATE", message: "Already checked in." };
      }

      return await AttendanceRepository.checkIn(tenantId, decoded.sessionId, userId, AttendanceMethod.QR, AttendanceStatus.PRESENT);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw { status: 400, code: "EXPIRED", message: "QR code has expired." };
      }
      if (err.status) throw err;
      throw { status: 400, code: "INVALID_TOKEN", message: "Invalid QR code." };
    }
  }

  // Dashboard
  static async getDashboardSummary(tenantId: string) {
    return AttendanceRepository.getDashboardSummary(tenantId);
  }
}
