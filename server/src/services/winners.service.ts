import { WinnersRepository } from "../repositories/winners.repository";
import { prisma } from "../utils/prisma";
import { AuditService } from "./audit.service";
import { NotificationService } from "./notifications.service";
import { CertificateService } from "./certificates.service";
import { Prisma } from "@prisma/client";

export class WinnersService {
  static async getWinners(organizationId: string, competitionId?: string) {
    return WinnersRepository.findMany(organizationId, { competitionId });
  }

  static async getWinnerById(id: string, organizationId: string) {
    const winner = await WinnersRepository.findFirst(id, organizationId);
    if (!winner) throw new Error("Winner not found");
    return winner;
  }

  static async selectWinner(
    organizationId: string,
    data: {
      competitionId: string;
      submissionId: string;
      position: string;
      prizeId?: string;
    },
    selectorId: string
  ) {
    // Validate submission exists in this competition and org
    const submission = await prisma.submission.findFirst({
      where: {
        id: data.submissionId,
        competitionId: data.competitionId,
        competition: { event: { organizationId } }
      },
      include: { team: true, evaluations: true }
    });

    if (!submission) {
      throw new Error("Invalid submission for this competition");
    }

    // Check if winner position is already taken in this competition
    const existingPosition = await prisma.winner.findFirst({
      where: {
        competitionId: data.competitionId,
        position: data.position
      }
    });

    if (existingPosition) {
      throw new Error(`Position ${data.position} is already assigned in this competition`);
    }

    // Create winner
    const winner = await WinnersRepository.create({
      organizationId,
      competitionId: data.competitionId,
      submissionId: data.submissionId,
      teamId: submission.teamId,
      position: data.position,
      prizeId: data.prizeId,
      selectedBy: selectorId,
      status: "PENDING"
    });

    await AuditService.log({
      organizationId,
      actorId: selectorId,
      action: "winner.selected",
      target: winner.id,
      metadata: { competitionId: data.competitionId, submissionId: data.submissionId, position: data.position }
    });

    return winner;
  }

  static async finalizeWinner(id: string, organizationId: string, actorId: string) {
    const winner = await this.getWinnerById(id, organizationId);
    if (winner.status === "FINALIZED") {
      throw new Error("Winner is already finalized");
    }

    const updated = await WinnersRepository.update(id, organizationId, { status: "FINALIZED" });

    await AuditService.log({
      organizationId,
      actorId,
      action: "winner.finalized",
      target: winner.id,
      metadata: { competitionId: winner.competitionId }
    });

    // Award Certificate and Notify (if team, notify all members)
    if (winner.teamId) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: winner.teamId },
        include: { user: true }
      });

      for (const member of teamMembers) {
        // Issue Certificate
        await CertificateService.issueSingle(organizationId, {
          userId: member.userId,
          eventId: updated.competition.eventId,
          competitionId: winner.competitionId,
          type: "WINNER",
          title: `${winner.position} - ${updated.competition.name}`,
          description: `Awarded for winning ${winner.position} in ${updated.competition.name}`
        }, actorId);

        // Notify
        await NotificationService.create({
          organizationId,
          recipientUserId: member.userId,
          title: "Competition Result",
          message: `Congratulations! Your team has been selected as ${winner.position} in ${updated.competition.name}.`,
          type: "SYSTEM"
        });
      }
    } else if (winner.userId) {
      await CertificateService.issueSingle(organizationId, {
        userId: winner.userId,
        eventId: updated.competition.eventId,
        competitionId: winner.competitionId,
        type: "WINNER",
        title: `${winner.position} - ${updated.competition.name}`,
        description: `Awarded for winning ${winner.position} in ${updated.competition.name}`
      }, actorId);

      await NotificationService.create({
        organizationId,
        recipientUserId: winner.userId,
        title: "Competition Result",
        message: `Congratulations! You have been selected as ${winner.position} in ${updated.competition.name}.`,
        type: "SYSTEM"
      });
    }

    return updated;
  }

  static async getPrizes(organizationId: string, competitionId?: string) {
    return WinnersRepository.getPrizes(organizationId, competitionId);
  }

  static async getDashboard(organizationId: string) {
    return WinnersRepository.getDashboardMetrics(organizationId);
  }

  static async getFinalists(organizationId: string, competitionId: string) {
    const submissions = await prisma.submission.findMany({
      where: {
        competitionId,
        competition: { event: { organizationId } }
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        },
        evaluations: {
          include: {
            judge: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        winners: {
          include: {
            prize: true
          }
        }
      }
    });

    const finalists = submissions.map((sub) => {
      const completedEvals = sub.evaluations.filter((e) => e.status === 'COMPLETED' && e.score !== null);
      const avgScore =
        completedEvals.length > 0
          ? Number((completedEvals.reduce((sum, e) => sum + (e.score || 0), 0) / completedEvals.length).toFixed(1))
          : 0;

      return {
        submissionId: sub.id,
        title: sub.title,
        status: sub.status,
        teamId: sub.team?.id,
        teamName: sub.team?.name || 'Individual Participant',
        members: sub.team?.members || [],
        evaluationsCount: completedEvals.length,
        averageScore: avgScore,
        feedbacks: completedEvals.map((e) => ({
          judgeName: `${e.judge?.firstName || 'Judge'} ${e.judge?.lastName || ''}`.trim(),
          score: e.score,
          feedback: e.feedback
        })),
        existingWinner: sub.winners[0] || null
      };
    });

    finalists.sort((a, b) => b.averageScore - a.averageScore);
    return finalists;
  }

  static async updatePrizeStatus(organizationId: string, prizeId: string, status: "PENDING" | "PROCESSING" | "PAID") {
    const prize = await prisma.prize.findFirst({
      where: { id: prizeId, organizationId }
    });

    if (!prize) {
      throw new Error("Prize not found");
    }

    return prisma.prize.update({
      where: { id: prizeId },
      data: { status }
    });
  }
}
