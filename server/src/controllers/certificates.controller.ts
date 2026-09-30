import { Request, Response } from "express";
import { CertificateService } from "../services/certificates.service";

export class CertificateController {
  static async getAll(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const certificates = await CertificateService.findAll(tenantId);
    res.json(certificates);
  }

  static async getById(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const certificate = await CertificateService.findById(tenantId, id);
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });
    res.json(certificate);
  }

  static async verify(req: Request, res: Response) {
    const { code } = req.params;
    const result = await CertificateService.findByVerificationCode(code);
    if (!result) return res.status(404).json({ error: "Certificate not found or invalid code" });
    res.json(result);
  }

  static async create(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const certificate = await CertificateService.create(tenantId, userId, req.body);
    res.status(201).json(certificate);
  }

  static async update(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const { id } = req.params;
    const certificate = await CertificateService.update(tenantId, userId, id, req.body);
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });
    res.json(certificate);
  }

  static async bulkIssue(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const adminId = req.user!.userId;
    const { eventId, userIds, type, title, description } = req.body;
    const result = await CertificateService.bulkIssue(tenantId, adminId, eventId, userIds, type, title, description);
    res.status(201).json(result);
  }

  static async revoke(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const { id } = req.params;
    const certificate = await CertificateService.revoke(tenantId, userId, id);
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });
    res.json(certificate);
  }

  static async delete(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const { id } = req.params;
    const certificate = await CertificateService.delete(tenantId, userId, id);
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });
    res.status(204).send();
  }

  static async download(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;

      const { pdfBuffer, filename } = await CertificateService.downloadMyCertificate(tenantId, userId, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || "Failed to download certificate" });
    }
  }

  static async downloadTeam(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.userId;

      const { zipBuffer, filename } = await CertificateService.downloadTeamCertificates(tenantId, userId);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || "Failed to download team certificates" });
    }
  }
}

