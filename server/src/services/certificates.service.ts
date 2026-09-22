import { CertificateRepository } from "../repositories/certificates.repository";
import { AuditService } from "./audit.service";
import { NotificationService } from "./notifications.service";
import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import JSZip from "jszip";

export class CertificateService {
  static async findAll(tenantId: string) {
    return CertificateRepository.findAll(tenantId);
  }

  static async findById(tenantId: string, id: string) {
    return CertificateRepository.findById(tenantId, id);
  }

  static async findByVerificationCode(code: string) {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationCode: code },
          { certificateNumber: code },
          { id: code }
        ]
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        event: { select: { id: true, name: true } },
        competition: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } }
      }
    });

    if (!cert) return null;

    const recipientName = cert.recipientName || (cert.user ? `${cert.user.firstName || ''} ${cert.user.lastName || ''}`.trim() : 'Participant');
    const teamName = cert.teamName || 'N/A';
    const award = cert.awardTitle || cert.title || cert.type;

    return {
      valid: true,
      certificateId: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      recipientName,
      teamName,
      eventName: cert.event?.name || 'Hackathon Event',
      awardTitle: award,
      issuedAt: cert.issuedAt,
      status: cert.status
    };
  }

  static async generatePdfBuffer(cert: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        const recipient = cert.recipientName || (cert.user ? `${cert.user.firstName || ''} ${cert.user.lastName || ''}`.trim() : 'PARTICIPANT');
        const team = cert.teamName || 'PARTICIPATING TEAM';
        const eventName = cert.event?.name || 'GLOBAL AI HACKATHON 2026';
        const award = cert.awardTitle || cert.title || cert.type.replace('_', ' ');

        // Outer Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#0f172a');
        doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).stroke('#64748b');

        // Header Title
        doc.font('Helvetica-Bold').fontSize(26).fillColor('#0f172a').text('CERTIFICATE OF ACHIEVEMENT', 40, 70, { align: 'center' });
        
        doc.font('Helvetica').fontSize(13).fillColor('#475569').text('This certificate is proudly presented to', 40, 120, { align: 'center' });

        // Recipient Name
        doc.font('Helvetica-Bold').fontSize(26).fillColor('#1d4ed8').text(recipient.toUpperCase(), 40, 155, { align: 'center' });

        // Team context
        doc.font('Helvetica').fontSize(13).fillColor('#475569').text(`as a member of team `, 40, 205, { align: 'center', continued: true });
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(team.toUpperCase());

        // Award
        doc.font('Helvetica').fontSize(13).fillColor('#475569').text(`for securing `, 40, 235, { align: 'center', continued: true });
        doc.font('Helvetica-Bold').fillColor('#047857').text(award.toUpperCase());

        doc.font('Helvetica').fontSize(13).fillColor('#475569').text(`in `, 40, 265, { align: 'center' });

        // Event Name
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text(eventName.toUpperCase(), 40, 290, { align: 'center' });

        // Footer details
        const formattedDate = new Date(cert.issuedAt || Date.now()).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        doc.font('Helvetica').fontSize(10).fillColor('#64748b');
        doc.text(`Certificate ID: ${cert.certificateNumber || cert.id}`, 50, doc.page.height - 75);
        doc.text(`Issued: ${formattedDate}`, doc.page.width - 250, doc.page.height - 75, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static async downloadMyCertificate(tenantId: string, userId: string, certId: string) {
    const cert = await prisma.certificate.findFirst({
      where: {
        id: certId,
        organizationId: tenantId,
      },
      include: {
        user: true,
        event: true,
        competition: true,
      }
    });

    if (!cert) {
      throw { status: 404, message: "Certificate not found" };
    }

    // Security check: Must be own certificate (or admin/manager)
    if (cert.userId !== userId) {
      throw { status: 403, message: "You are not authorized to download another user's certificate" };
    }

    const pdfBuffer = await this.generatePdfBuffer(cert);
    const recipientName = (cert.recipientName || cert.user?.firstName || 'User').replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${recipientName}-Certificate.pdf`;

    return { pdfBuffer, filename };
  }

  static async downloadTeamCertificates(tenantId: string, userId: string) {
    // 1. Find user's team where isLead = true
    const memberRecord = await prisma.teamMember.findFirst({
      where: {
        userId,
        isLead: true
      },
      include: {
        team: {
          include: {
            members: {
              include: { user: true }
            },
            competition: {
              include: { event: true }
            }
          }
        }
      }
    });

    if (!memberRecord || !memberRecord.team) {
      throw { status: 403, message: "Only Team Leads can download all team certificates." };
    }

    const team = memberRecord.team;

    // 2. Fetch all certificates for all members of this team
    const memberUserIds = team.members.map(m => m.userId).filter(Boolean) as string[];

    const certificates = await prisma.certificate.findMany({
      where: {
        organizationId: tenantId,
        eventId: team.competition.eventId,
        userId: { in: memberUserIds }
      },
      include: {
        user: true,
        event: true,
        competition: true
      }
    });

    if (!certificates || certificates.length === 0) {
      throw { status: 404, message: "No certificates found for this team." };
    }

    // 3. Create ZIP package
    const zip = new JSZip();

    for (const cert of certificates) {
      const pdfBuffer = await this.generatePdfBuffer(cert);
      const recipientName = (cert.recipientName || cert.user?.firstName || 'Member').replace(/[^a-zA-Z0-9]/g, '-');
      zip.file(`${recipientName}-Certificate.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const teamCleanName = team.name.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${teamCleanName}-Certificates.zip`;

    return { zipBuffer, filename };
  }

  static async create(tenantId: string, actorId: string, data: Omit<Prisma.CertificateUncheckedCreateInput, 'certificateNumber' | 'verificationCode' | 'organizationId'>) {
    // SECURITY VALIDATION: Verify the user is registered for the event in the tenant
    const registration = await prisma.registration.findFirst({
      where: {
        userId: data.userId,
        eventId: data.eventId,
        event: { organizationId: tenantId }
      }
    });

    if (!registration) {
      throw { status: 403, code: "UNAUTHORIZED", message: "User is not registered for this event or event does not belong to the organization." };
    }

    // SECURITY VALIDATION: Prevent duplicate certificates of the same type for the same user and event
    const existingCert = await prisma.certificate.findFirst({
      where: {
        userId: data.userId,
        eventId: data.eventId,
        type: data.type
      }
    });

    if (existingCert) {
      return existingCert; // Idempotent return
    }

    const certificateNumber = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    const cert = await CertificateRepository.create(tenantId, {
      ...data,
      certificateNumber,
      verificationCode,
    });

    await AuditService.logAction({
      organizationId: tenantId,
      actorId,
      action: "certificate.create",
      target: cert.id,
      metadata: { type: cert.type, certificateNumber }
    });

    await NotificationService.createBulk(tenantId, [data.userId], {
      title: "Certificate Issued",
      message: `Your ${data.type.toLowerCase()} certificate has been issued.`,
      type: "CERTIFICATE",
      link: "/participant/certificates",
    });

    return cert;
  }

  static async update(tenantId: string, actorId: string, id: string, data: Prisma.CertificateUncheckedUpdateInput) {
    const cert = await CertificateRepository.update(tenantId, id, data);
    if (cert) {
      await AuditService.logAction({
        organizationId: tenantId,
        actorId,
        action: "certificate.update",
        target: cert.id,
        metadata: { updates: Object.keys(data) }
      });
    }
    return cert;
  }

  static async bulkIssue(tenantId: string, actorId: string, eventId: string, userIds: string[], type: any, title: string, description?: string) {
    const certificatesToCreate = userIds.map(userId => ({
      userId,
      eventId,
      organizationId: tenantId,
      certificateNumber: `CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      verificationCode: crypto.randomBytes(8).toString('hex').toUpperCase(),
      type,
      title,
      description,
      status: 'ISSUED' as const,
    }));

    const result = await CertificateRepository.createMany(certificatesToCreate);

    if (result.count > 0 && userIds.length > 0) {
      await NotificationService.createBulk(tenantId, userIds, {
        title: "Certificate Issued",
        message: `Your ${type.toLowerCase()} certificate for the event has been issued.`,
        type: "CERTIFICATE",
        link: "/participant/certificates",
      });
    }

    return result;
  }

  static async revoke(tenantId: string, actorId: string, id: string) {
    const cert = await CertificateRepository.update(tenantId, id, { status: 'REVOKED' });
    return cert;
  }

  static async delete(tenantId: string, actorId: string, id: string) {
    const cert = await CertificateRepository.delete(tenantId, id);
    return cert;
  }
}

