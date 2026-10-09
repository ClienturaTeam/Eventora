import PDFDocument from 'pdfkit';
import { EventFinalReport, Event, User, Organization } from '@prisma/client';

type PopulatedReport = EventFinalReport & {
  event: Event;
  coordinator?: User | null;
  organization?: Organization | null;
};

export class FinalReportPDFService {
  static async generatePDF(report: PopulatedReport, executionSummary: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // 1. Header & Branding Banner
        doc
          .fillColor('#1e40af')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('EVENTORA ENTERPRISE PLATFORM', { align: 'center' })
          .moveDown(0.2);

        doc
          .fillColor('#475569')
          .fontSize(10)
          .font('Helvetica')
          .text('Official Institutional Completion Dossier & Compliance Audit Report', { align: 'center' })
          .moveDown(1.5);

        // Divider
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .strokeColor('#cbd5e1')
          .lineWidth(1)
          .stroke()
          .moveDown(1);

        // 2. Title & Event Metadata
        doc
          .fillColor('#0f172a')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(report.event.name, { align: 'left' })
          .moveDown(0.5);

        doc.fontSize(10).fillColor('#334155');
        
        const startDate = report.event.startTime ? new Date(report.event.startTime).toLocaleDateString() : 'N/A';
        const endDate = report.event.endTime ? new Date(report.event.endTime).toLocaleDateString() : 'N/A';
        const coordinatorName = report.coordinator ? `${report.coordinator.firstName || ''} ${report.coordinator.lastName || ''}`.trim() || report.coordinator.email : 'Primary Coordinator';

        doc.font('Helvetica-Bold').text('Event Dates: ', { continued: true })
           .font('Helvetica').text(`${startDate} to ${endDate}`);
        
        doc.font('Helvetica-Bold').text('Status: ', { continued: true })
           .font('Helvetica').text(`${report.status.replace(/_/g, ' ')} (${report.event.status})`);
        
        doc.font('Helvetica-Bold').text('Coordinator: ', { continued: true })
           .font('Helvetica').text(coordinatorName);
        
        doc.font('Helvetica-Bold').text('Dossier Finalized: ', { continued: true })
           .font('Helvetica').text(new Date(report.updatedAt || Date.now()).toLocaleDateString());

        doc.moveDown(1.5);

        // 3. Execution Metrics Box (if available)
        if (executionSummary) {
          doc
            .fillColor('#0f172a')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('1. Event Execution Metrics')
            .moveDown(0.5);

          const reg = executionSummary.registrations || {};
          const att = executionSummary.attendance || {};
          const comp = executionSummary.competition || {};
          const vol = executionSummary.volunteers || {};

          doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
          doc.text(`• Total Registrations: ${reg.totalRegistered || 0} (${reg.approvedParticipants || 0} Approved, ${reg.paidParticipants || 0} Paid)`);
          doc.text(`• Event Attendance: ${att.uniqueAttendees || 0} Unique Attendees (${att.attendancePercentage || 0}% Verification Rate)`);
          doc.text(`• Competition Tracks: ${comp.totalCompetitions || 0} Tracks, ${comp.totalTeams || 0} Teams, ${comp.totalSubmissions || 0} Verified Submissions`);
          doc.text(`• Volunteers & Support: ${vol.totalVolunteers || 0} Active Volunteers (${vol.totalVolunteerHours || 0} Service Hours Recorded)`);
          doc.moveDown(1.5);
        }

        // 4. Executive Summary & Main Report Content
        doc
          .fillColor('#0f172a')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('2. Executive Summary & Operational Narrative')
          .moveDown(0.5);

        if (report.executiveSummary) {
          doc.fontSize(10).font('Helvetica').fillColor('#334155').text(report.executiveSummary).moveDown(1);
        }

        const mainContent = report.finalizedContent || report.aiGeneratedContent || report.eventOutcome || "";
        
        if (mainContent) {
          const lines = mainContent.split('\n');
          for (const line of lines) {
            if (line.startsWith('# ')) {
              doc.moveDown(0.8).font('Helvetica-Bold').fontSize(14).fillColor('#1e3a8a').text(line.replace('# ', '')).moveDown(0.4);
            } else if (line.startsWith('## ')) {
              doc.moveDown(0.6).font('Helvetica-Bold').fontSize(12).fillColor('#1e40af').text(line.replace('## ', '')).moveDown(0.3);
            } else if (line.startsWith('### ')) {
              doc.moveDown(0.4).font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(line.replace('### ', '')).moveDown(0.2);
            } else if (line.startsWith('- ')) {
              doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`• ${line.replace('- ', '')}`, { indent: 12 });
            } else if (line.trim() !== '') {
              doc.font('Helvetica').fontSize(10).fillColor('#334155').text(line).moveDown(0.4);
            } else {
              doc.moveDown(0.3);
            }
          }
        }

        doc.moveDown(2);

        // 5. Official Verification & Signatures Block
        doc
          .fillColor('#0f172a')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('3. Institutional Sign-Off & Seal')
          .moveDown(1);

        const sigY = doc.y;
        
        // Left Column: Primary Coordinator
        doc.fontSize(9).font('Helvetica-Bold').text('Primary Coordinator:', 60, sigY);
        doc.font('Helvetica').text(coordinatorName, 60, sigY + 14);
        doc.text('Status: Verified & Submitted', 60, sigY + 26);

        // Right Column: Organization Manager
        doc.font('Helvetica-Bold').text('Organization Manager:', 320, sigY);
        doc.font('Helvetica').text('Approved & Sealed', 320, sigY + 14);
        doc.text(`Verification Date: ${new Date().toLocaleDateString()}`, 320, sigY + 26);

        // Footer Page Numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(9).fillColor('#94a3b8').text(
            `Eventora Compliance Audit Trail • Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 40,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
