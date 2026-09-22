import { prisma } from "../utils/prisma";
import { NotificationService } from "./notifications.service";
import crypto from "crypto";
import { CertificateType } from "@prisma/client";

export class ResultsService {
  /**
   * Award round-based achievements to all team members
   */
  static async awardRoundAchievement(organizationId: string, teamId: string, achievementType: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true } },
        competition: { include: { event: true } }
      }
    });

    if (!team) return;

    // Ensure Badge exists
    let badge = await prisma.badge.findFirst({
      where: { organizationId, name: achievementType }
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          organizationId,
          name: achievementType,
          description: `Awarded for ${achievementType.replace('_', ' ')} in ${team.competition.event.name}`,
          type: "ACHIEVEMENT",
          criteria: achievementType,
        }
      });
    }

    for (const member of team.members) {
      if (!member.userId) continue;

      // Upsert BadgeAward
      await prisma.badgeAward.upsert({
        where: {
          badgeId_recipientUserId: {
            badgeId: badge.id,
            recipientUserId: member.userId
          }
        },
        create: {
          organizationId,
          badgeId: badge.id,
          recipientUserId: member.userId,
          reason: `Achieved ${achievementType.replace('_', ' ')} with team ${team.name}`
        },
        update: {}
      });
    }
  }

  /**
   * Publish Final Result for a Team
   */
  static async publishResult(
    organizationId: string,
    actorId: string,
    data: {
      competitionId: string;
      teamId: string;
      resultType: string;
      prizeAmount?: number;
      currency?: string;
    }
  ) {
    const { competitionId, teamId, resultType, prizeAmount, currency = "INR" } = data;

    if (!teamId) {
      throw { status: 400, message: "teamId is required to publish results." };
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
      },
      include: {
        members: { include: { user: true } },
        competition: { include: { event: true } },
        submissions: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!team) {
      throw { status: 404, message: `Team not found with ID: ${teamId}` };
    }

    const targetCompetitionId = competitionId || team.competitionId;
    let latestSubmission = team.submissions[0];
    const event = team.competition?.event;

    // 1. Transaction: Upsert Winner record & Prize record
    const result = await prisma.$transaction(async (tx) => {
      if (!latestSubmission) {
        latestSubmission = await tx.submission.create({
          data: {
            teamId: team.id,
            competitionId: targetCompetitionId,
            title: `${team.name} Final Submission`,
            status: "EVALUATED",
            isLocked: true,
            lockedAt: new Date()
          }
        });
      }

      // Upsert Prize if amount > 0
      let prizeRecord = null;
      if (prizeAmount && prizeAmount > 0) {
        prizeRecord = await tx.prize.create({
          data: {
            organizationId,
            competitionId: targetCompetitionId,
            teamId: team.id,
            resultType,
            name: `${resultType.replace('_', ' ')} Prize`,
            position: resultType,
            amount: prizeAmount,
            currency,
            status: "PENDING"
          }
        });
      }

      // Upsert Winner
      const winnerRecord = await tx.winner.upsert({
        where: {
          competitionId_submissionId: {
            competitionId: targetCompetitionId,
            submissionId: latestSubmission.id
          }
        },
        create: {
          organizationId,
          competitionId: targetCompetitionId,
          submissionId: latestSubmission.id,
          teamId: team.id,
          position: resultType,
          status: "PUBLISHED",
          prizeId: prizeRecord?.id,
          selectedBy: actorId || null
        },
        update: {
          position: resultType,
          status: "PUBLISHED",
          prizeId: prizeRecord?.id || undefined
        }
      });

      return { winnerRecord, prizeRecord };
    });

    // 2. Map CertificateType
    let certType: CertificateType = CertificateType.PARTICIPATION;
    const formattedResult = resultType.toUpperCase();
    if (formattedResult === "FIRST_PRIZE") certType = CertificateType.FIRST_PRIZE;
    else if (formattedResult === "SECOND_PRIZE") certType = CertificateType.SECOND_PRIZE;
    else if (formattedResult === "THIRD_PRIZE") certType = CertificateType.THIRD_PRIZE;
    else if (formattedResult === "SPECIAL_AWARD") certType = CertificateType.SPECIAL_AWARD;
    else if (formattedResult === "WINNER") certType = CertificateType.WINNER;
    else if (formattedResult === "FINALIST") certType = CertificateType.FINALIST;

    const awardTitle = resultType.replace(/_/g, ' ');

    // 3. Generate individual certificates for EVERY team member
    for (const member of team.members) {
      if (!member.userId) continue;

      const recipientFullName = member.user
        ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
        : (member.name || 'Team Member');

      const existingCert = await prisma.certificate.findFirst({
        where: {
          userId: member.userId,
          eventId: event.id,
          type: certType
        }
      });

      if (!existingCert) {
        const certificateNumber = `CERT-${event.name.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

        await prisma.certificate.create({
          data: {
            organizationId,
            eventId: event.id,
            competitionId,
            userId: member.userId,
            type: certType,
            title: `${awardTitle} - ${event.name}`,
            description: `Awarded to ${recipientFullName} of team ${team.name} for ${awardTitle} in ${event.name}.`,
            recipientName: recipientFullName,
            teamName: team.name,
            teamId: team.id,
            awardTitle,
            certificateNumber,
            verificationCode,
            status: "ISSUED"
          }
        });
      }
    }

    // 4. Award final achievement to EVERY team member
    let badge = await prisma.badge.findFirst({
      where: { organizationId, name: resultType }
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          organizationId,
          name: resultType,
          description: `Awarded for ${awardTitle} in ${event.name}`,
          type: "ACHIEVEMENT",
          criteria: resultType
        }
      });
    }

    for (const member of team.members) {
      if (!member.userId) continue;

      await prisma.badgeAward.upsert({
        where: {
          badgeId_recipientUserId: {
            badgeId: badge.id,
            recipientUserId: member.userId
          }
        },
        create: {
          organizationId,
          badgeId: badge.id,
          recipientUserId: member.userId,
          reason: `Awarded ${awardTitle} with team ${team.name}`
        },
        update: {}
      });
    }

    // 5. Send Notification to EVERY team member
    const memberUserIds = team.members.map(m => m.userId).filter(Boolean) as string[];

    await NotificationService.createBulk(organizationId, memberUserIds, {
      title: "Hackathon Result Published",
      message: `Congratulations! Team ${team.name} has secured ${awardTitle} in ${event.name}.`,
      type: "SYSTEM",
      link: "/participant/certificates"
    });

    return {
      success: true,
      teamId: team.id,
      resultType,
      prize: result.prizeRecord,
      certificatesCount: memberUserIds.length,
      achievementsCount: memberUserIds.length,
      notificationsCount: memberUserIds.length
    };
  }

  /**
   * Update Prize Status (Manager/Admin action)
   */
  static async updatePrizeStatus(organizationId: string, prizeId: string, status: "PENDING" | "PROCESSING" | "PAID") {
    const prize = await prisma.prize.findFirst({
      where: { id: prizeId, organizationId }
    });

    if (!prize) {
      throw { status: 404, message: "Prize record not found" };
    }

    const updated = await prisma.prize.update({
      where: { id: prizeId },
      data: { status }
    });

    return updated;
  }
}
