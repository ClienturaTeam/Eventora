import PDFDocument from 'pdfkit';
import { EventFinalReport, Event, User, Organization } from '@prisma/client';

type PopulatedReport = EventFinalReport & {
  event: Event;
  coordinator: User;
  organization: Organization;
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

        // Branding / Header
        doc
          .fillColor('#2563eb')
          .fontSize(24)
          .text('Eventora Event Management System', { align: 'center' })
          .moveDown(0.5);

        doc
          .fillColor('#0f172a')
          .fontSize(20)
          .text(report.event.name, { align: 'center' })
          .moveDown(0.2);

        doc
          .fillColor('#64748b')
          .fontSize(14)
          .text('Final Event Report', { align: 'center' })
          .moveDown(2);

        // Metadata block
        doc.fontSize(12).fillColor('#0f172a');
        doc.font('Helvetica-Bold').text('Event Dates: ', { continued: true })
           .font('Helvetica').text(`${new Date(report.event.startTime).toLocaleDateString()} - ${new Date(report.event.endTime).toLocaleDateString()}`);
        
        doc.font('Helvetica-Bold').text('Coordinator: ', { continued: true })
           .font('Helvetica').text(`${report.coordinator.firstName} ${report.coordinator.lastName}`);
        
        doc.font('Helvetica-Bold').text('Finalized On: ', { continued: true })
           .font('Helvetica').text(report.updatedAt.toLocaleDateString());
        
        doc.moveDown(2);

        // Render AI Generated / Finalized Content if available
        if (report.finalizedContent || report.aiGeneratedContent) {
          const content = report.finalizedContent || report.aiGeneratedContent || "";
          
          // Basic Markdown parsing for PDF (Headings and text)
          const lines = content.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('# ')) {
              doc.moveDown(1).font('Helvetica-Bold').fontSize(18).text(line.replace('# ', '')).moveDown(0.5);
            } else if (line.startsWith('## ')) {
              doc.moveDown(1).font('Helvetica-Bold').fontSize(16).text(line.replace('## ', '')).moveDown(0.5);
            } else if (line.startsWith('### ')) {
              doc.moveDown(0.5).font('Helvetica-Bold').fontSize(14).text(line.replace('### ', '')).moveDown(0.5);
            } else if (line.startsWith('- ')) {
              doc.font('Helvetica').fontSize(12).text(`• ${line.replace('- ', '')}`, { indent: 15 });
            } else if (line.trim() !== '') {
              doc.font('Helvetica').fontSize(12).text(line).moveDown(0.5);
            } else {
              doc.moveDown(0.5);
            }
          }
        } else {
           doc.font('Helvetica').fontSize(12).text('No report content available.', { align: 'center' });
        }

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(10).fillColor('#94a3b8').text(
            `Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 50,
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
