import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/users.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class UserController {
  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getMe(req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateMe(req.user!.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAll();
      res.json({ success: true, data: users });
    } catch (error) { next(error); }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const targetUser = await UserService.getById(req.params.id);
      const targetRoleName = targetUser.memberships?.[0]?.role?.name;
      
      const permissions = req.permissions || [];
      const hasFullManage = permissions.includes("users.manage");
      
      if (!hasFullManage) {
        if (targetRoleName === "Participant" && !permissions.includes("users.update_participant")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to update Participant status" };
        }
        if (targetRoleName === "Student Coordinator" && !permissions.includes("users.update_student_coordinator")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to update Student Coordinator status" };
        }
        if (targetRoleName !== "Participant" && targetRoleName !== "Student Coordinator") {
          throw { status: 403, code: "FORBIDDEN", message: "Cannot update status of higher privileged roles" };
        }
      }

      const user = await UserService.updateStatus(req.params.id, req.body.status, req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.delete(req.params.id, req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.headers["x-organization-id"] as string) || req.tenantId;
      const user = await UserService.create(req.body, req.user!.id, tenantId);
      res.status(201).json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  static async createPrivilegedUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw { status: 401, code: "UNAUTHORIZED", message: "Missing user context" };
      if (!req.tenantId) throw { status: 400, code: "BAD_REQUEST", message: "Tenant context required" };

      const { role } = req.body;
      const permissions = req.permissions || [];

      if (role === "Manager") {
        if (!permissions.includes("users.create_manager")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to create Manager" };
        }
      } else if (role === "Faculty Coordinator") {
        if (!permissions.includes("users.create_faculty_coordinator")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to create Faculty Coordinator" };
        }
      } else if (role === "Principal") {
        if (!permissions.includes("users.create_principal")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to create Principal" };
        }
      } else if (role === "Student Coordinator") {
        if (!permissions.includes("users.create_student_coordinator")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to create Student Coordinator" };
        }
      } else if (role === "Participant") {
        if (!permissions.includes("users.create_participant")) {
          throw { status: 403, code: "FORBIDDEN", message: "Insufficient permissions to create Participant" };
        }
      } else {
        throw { status: 403, code: "FORBIDDEN", message: "Unsupported role for this endpoint" };
      }

      const user = await UserService.createPrivilegedUser(req.tenantId, req.body, req.user.id);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
