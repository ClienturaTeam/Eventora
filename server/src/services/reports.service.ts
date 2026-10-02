import { ReportsRepository } from "../repositories/reports.repository";
import { AuditService } from "./audit.service";


export class ReportsService {
  static async getDashboardStats(organizationId: string) {
    return ReportsRepository.getDashboardStats(organizationId);
  }

  // Event
  static async getEventReports(organizationId: string, filters: any) {
    return ReportsRepository.getEventReports(organizationId, filters);
  }

  // Competition
  static async getCompetitionReports(organizationId: string, filters: any) {
    return ReportsRepository.getCompetitionReports(organizationId, filters);
  }

  // Participant
  static async getParticipantReports(organizationId: string, filters: any) {
    return ReportsRepository.getParticipantReports(organizationId, filters);
  }

  // Evaluation
  static async getEvaluationReports(organizationId: string, filters: any) {
    return ReportsRepository.getEvaluationReports(organizationId, filters);
  }

  // Attendance
  static async getAttendanceReports(organizationId: string, filters: any) {
    return ReportsRepository.getAttendanceReports(organizationId, filters);
  }

  // Certificate
  static async getCertificateReports(organizationId: string, filters: any) {
    return ReportsRepository.getCertificateReports(organizationId, filters);
  }

  // Winner
  static async getWinnerReports(organizationId: string, filters: any) {
    return ReportsRepository.getWinnerReports(organizationId, filters);
  }

  // Communication
  static async getCommunicationReports(organizationId: string, filters: any) {
    return ReportsRepository.getCommunicationReports(organizationId, filters);
  }

  // Export Logic
  static async exportToCSV(
    organizationId: string,
    actorId: string,
    reportType: string,
    filters: any
  ): Promise<string> {
    let data: any[] = [];
    
    switch (reportType) {
      case "events":
        const events = await this.getEventReports(organizationId, filters);
        data = events.map(e => ({
          ID: e.id,
          Name: e.name,
          Status: e.status,
          StartTime: e.startTime?.toISOString(),
          EndTime: e.endTime?.toISOString(),
          Registrations: e._count.registrations,
          Competitions: e._count.competitions,
          AttendanceSessions: e._count.attendanceSessions,
        }));
        break;

      case "competitions":
        const comps = await this.getCompetitionReports(organizationId, filters);
        data = comps.map(c => ({
          ID: c.id,
          Event: c.event.name,
          Name: c.name,
          Teams: c._count.teams,
          Submissions: c._count.submissions,
          Judges: c._count.judgeAssignments,
          Winners: c._count.winners,
        }));
        break;

      case "participants":
        const parts = await this.getParticipantReports(organizationId, filters);
        data = parts.map(p => ({
          Event: p.event.name,
          ParticipantName: p.user.firstName ? `${p.user.firstName} ${p.user.lastName}` : p.user.email,
          Email: p.user.email,
          Status: p.status,
          RegisteredAt: p.createdAt?.toISOString(),
        }));
        break;
        
      case "evaluations":
        const evals = await this.getEvaluationReports(organizationId, filters);
        data = evals.map(e => ({
          ID: e.id,
          Competition: e.submission.competition.name,
          Submission: e.submission.title,
          JudgeName: e.judge?.firstName ? `${e.judge.firstName} ${e.judge.lastName || ''}`.trim() : (e.judge?.email || "Unknown Judge"),
          Status: e.status,
          Score: e.score || 0,
        }));
        break;

      case "attendance":
        const att = await this.getAttendanceReports(organizationId, filters);
        data = att.map(a => ({
          Event: a.session.event.name,
          Session: a.session.name,
          ParticipantName: a.user.firstName ? `${a.user.firstName} ${a.user.lastName}` : a.user.email,
          Status: a.status,
          CheckInTime: a.checkInTime?.toISOString(),
        }));
        break;

      case "certificates":
        const certs = await this.getCertificateReports(organizationId, filters);
        data = certs.map(c => ({
          ID: c.id,
          Event: c.event?.name || 'N/A',
          Competition: c.competition?.name || 'N/A',
          RecipientName: c.user.firstName ? `${c.user.firstName} ${c.user.lastName}` : c.user.email,
          Type: c.type,
          Status: c.status,
          IssuedAt: c.issuedAt?.toISOString(),
        }));
        break;

      case "winners":
        const wins = await this.getWinnerReports(organizationId, filters);
        data = wins.map(w => ({
          Competition: w.competition.name,
          Event: w.competition.event.name,
          WinnerName: w.user ? `${w.user.firstName} ${w.user.lastName}` : (w.team ? w.team.name : 'Unknown'),
          Position: w.position,
          Prize: w.prize?.name || 'None',
          Value: w.prize?.value || 0,
        }));
        break;

      case "communications":
        const comms = await this.getCommunicationReports(organizationId, filters);
        data = comms.map(c => ({
          ID: c.id,
          Title: c.title,
          Type: c.type,
          Status: c.status,
          Audience: c.audience,
          Creator: c.creator ? (c.creator.firstName ? `${c.creator.firstName} ${c.creator.lastName}` : c.creator.email) : 'System',
          PublishedAt: c.publishedAt ? c.publishedAt.toISOString() : 'N/A',
          CreatedAt: c.createdAt?.toISOString(),
        }));
        break;

      default:
        throw new Error("Invalid report type");
    }

    // Log the export action
    await AuditService.logAction({
      organizationId,
      actorId,
      action: "REPORT_EXPORT",
      target: reportType,
      metadata: { format: "csv", filters }
    });

    return this.convertToCSV(data);
  }

  private static convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? "" : row[header];
        const str = String(val);
        // Escape quotes and wrap in quotes if there's a comma
        if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(","));
    }
    return csvRows.join("\n");
  }
}
