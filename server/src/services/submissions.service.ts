import { SubmissionRepository } from "../repositories/submissions.repository";
import { prisma } from "../utils/prisma";

export class SubmissionService {
  static ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "doc", "docx", "mp4", "mov", "avi"];
  static MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

  static async getSubmissions(tenantId: string) {
    return SubmissionRepository.findAll(tenantId);
  }

  static async getSubmission(tenantId: string, id: string) {
    const sub = await SubmissionRepository.findById(tenantId, id);
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }
    return sub;
  }

  static async createSubmission(tenantId: string, data: any) {
    return SubmissionRepository.create(tenantId, data);
  }

  static async updateSubmission(tenantId: string, id: string, data: any) {
    const sub = await prisma.submission.findUnique({ where: { id } });
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }
    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is locked and cannot be modified." };
    }
    return SubmissionRepository.update(tenantId, id, data);
  }

  static async addSubmissionFile(userId: string, submissionId: string, fileData: { fileName: string; fileSize: number; fileType: string; fileUrl?: string }) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { files: true }
    });
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is locked and cannot accept file uploads." };
    }

    if (fileData.fileSize > this.MAX_FILE_SIZE_BYTES) {
      throw {
        status: 400,
        code: "FILE_TOO_LARGE",
        message: `File size exceeds the 20 MB maximum limit. Received: ${(fileData.fileSize / (1024 * 1024)).toFixed(2)} MB`
      };
    }

    const ext = fileData.fileName.split(".").pop()?.toLowerCase() || "";
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw {
        status: 400,
        code: "INVALID_FILE_TYPE",
        message: `File extension '.${ext}' is not supported. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(", ")}`
      };
    }

    const file = await prisma.submissionFile.create({
      data: {
        submissionId,
        fileName: fileData.fileName,
        fileSize: Number(fileData.fileSize),
        fileType: fileData.fileType || ext,
        fileUrl: fileData.fileUrl || `/uploads/${fileData.fileName}`
      }
    });

    return file;
  }

  static async finalSubmit(userId: string, submissionId: string) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };

    if (sub.isLocked) {
      throw { status: 400, code: "SUBMISSION_LOCKED", message: "Submission is already locked." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: "SUBMITTED",
          isLocked: true,
          lockedAt: new Date()
        },
        include: { files: true }
      });

      const org = await tx.organization.findFirst();
      if (org) {
        await tx.notification.create({
          data: {
            organizationId: org.id,
            recipientUserId: userId,
            title: "Submission Finalized",
            message: `Your project submission '${s.title}' has been successfully finalized and locked.`,
            type: "SYSTEM"
          }
        });
      }

      return s;
    });

    return updated;
  }

  static async deleteSubmission(tenantId: string, id: string) {
    const sub = await SubmissionRepository.delete(tenantId, id);
    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }
    return true;
  }
}
