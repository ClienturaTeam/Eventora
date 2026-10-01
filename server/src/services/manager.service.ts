import { prisma } from "../utils/prisma";

export class ManagerService {
  static async getDashboardStats(organizationId: string) {
    const totalEvents = await prisma.event.count({
      where: { organizationId }
    });

    const activeTeams = await prisma.team.count({
      where: { competition: { event: { organizationId } } }
    });

    const pendingEvaluations = await prisma.evaluation.count({
      where: { 
        submission: { competition: { event: { organizationId } } },
        status: 'PENDING'
      }
    });

    const completedEvaluations = await prisma.evaluation.count({
      where: { 
        submission: { competition: { event: { organizationId } } },
        status: 'COMPLETED'
      }
    });

    const totalSubmissions = await prisma.submission.count({
      where: { competition: { event: { organizationId } } }
    });

    const totalRegistrations = await prisma.registration.count({
      where: { event: { organizationId } }
    });

    const pendingProposals = await prisma.hackathonProposal.count({
      where: {
        organizationId,
        status: 'SUBMITTED_TO_MANAGER'
      }
    });

    const totalJudges = await prisma.judge.count({
      where: { organizationId }
    });
    
    const upcomingEvents = await prisma.event.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            registrations: true,
            competitions: true,
            submissions: true
          }
        },
        competitions: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { teams: true, submissions: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' },
      take: 6
    });
    
    const recentActivity = await prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    return {
      totalEvents,
      activeTeams,
      pendingEvaluations,
      completedEvaluations,
      totalSubmissions,
      totalRegistrations,
      pendingProposals,
      totalJudges,
      upcomingEvents,
      recentActivity
    };
  }
}
