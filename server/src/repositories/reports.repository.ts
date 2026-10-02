import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ReportsRepository {
  static async getDashboardStats(organizationId: string) {
    const [
      events,
      registrations,
      certificates,
      winners
    ] = await Promise.all([
      prisma.event.count({ where: { organizationId } }),
      prisma.registration.count({ where: { event: { organizationId } } }),
      prisma.certificate.count({ where: { organizationId } }),
      prisma.winner.count({ where: { organizationId } }),
    ]);

    const competitions = await prisma.competition.count({
      where: { event: { organizationId } },
    });

    const teams = await prisma.team.count({
      where: { competition: { event: { organizationId } } },
    });

    const submissions = await prisma.submission.count({
      where: { competition: { event: { organizationId } } },
    });

    const evaluations = await prisma.evaluation.count({
      where: { submission: { competition: { event: { organizationId } } } },
    });

    return {
      totalEvents: events,
      totalCompetitions: competitions,
      totalParticipants: registrations,
      totalTeams: teams,
      totalSubmissions: submissions,
      totalEvaluations: evaluations,
      certificatesIssued: certificates,
      winnersFinalized: winners,
    };
  }

  static async getEventReports(organizationId: string, filters: any) {
    const where: any = { organizationId };
    if (filters.status) where.status = filters.status;
    if (filters.from && filters.to) {
      where.startTime = { gte: new Date(filters.from), lte: new Date(filters.to) };
    }

    return prisma.event.findMany({
      where,
      include: {
        _count: {
          select: {
            registrations: true,
            competitions: true,
            attendanceSessions: true,
          }
        },
        competitions: {
          include: {
            _count: {
              select: { teams: true, submissions: true }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  }

  static async getCompetitionReports(organizationId: string, filters: any) {
    const where: any = { event: { organizationId } };
    if (filters.eventId) where.eventId = filters.eventId;
    
    return prisma.competition.findMany({
      where,
      include: {
        event: { select: { name: true } },
        _count: {
          select: {
            teams: true,
            submissions: true,
            judgeAssignments: true,
            winners: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getParticipantReports(organizationId: string, filters: any) {
    // Participants are users with registrations in org events
    const where: any = { event: { organizationId } };
    if (filters.eventId) where.eventId = filters.eventId;

    return prisma.registration.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        event: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getEvaluationReports(organizationId: string, filters: any) {
    const where: any = { submission: { competition: { event: { organizationId } } } };
    if (filters.competitionId) where.submission = { competitionId: filters.competitionId };

    return prisma.evaluation.findMany({
      where,
      include: {
        judge: { select: { firstName: true, lastName: true, email: true } },
        submission: { 
          select: { 
            title: true, 
            competition: { select: { name: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAttendanceReports(organizationId: string, filters: any) {
    const where: any = { session: { event: { organizationId } } };
    if (filters.eventId) where.session = { eventId: filters.eventId };

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        session: { select: { name: true, event: { select: { name: true } } } },
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { checkInTime: 'desc' }
    });
  }

  static async getCertificateReports(organizationId: string, filters: any) {
    const where: any = { organizationId };
    if (filters.eventId) where.eventId = filters.eventId;
    if (filters.type) where.type = filters.type;

    return prisma.certificate.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        event: { select: { name: true } },
        competition: { select: { name: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }

  static async getWinnerReports(organizationId: string, filters: any) {
    const where: any = { organizationId };
    if (filters.competitionId) where.competitionId = filters.competitionId;

    return prisma.winner.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        team: { select: { name: true } },
        competition: { select: { name: true, event: { select: { name: true } } } },
        prize: { select: { name: true, value: true } }
      },
      orderBy: { position: 'asc' }
    });
  }

  static async getCommunicationReports(organizationId: string, filters: any) {
    const where: any = { organizationId };
    if (filters.status) where.status = filters.status;

    return prisma.communication.findMany({
      where,
      include: {
        creator: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
