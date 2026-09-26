import { prisma } from "../utils/prisma";

export class ParticipantService {
  static async getDashboardStats(userId: string) {
    const member = await prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            competition: { include: { event: true } },
            problemStatement: true,
            members: { include: { user: true } },
            submissions: {
              include: { files: true },
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    const team = member?.team || null;

    const registration = await prisma.registration.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const unreadNotificationsCount = await prisma.notification.count({
      where: { recipientUserId: userId, isRead: false }
    });

    const achievementsCount = await prisma.badgeAward.count({
      where: { recipientUserId: userId }
    });

    const certificatesCount = await prisma.certificate.count({
      where: { userId }
    });

    const latestSubmission = team?.submissions?.[0] || null;

    const winner = team ? await prisma.winner.findFirst({
      where: { teamId: team.id },
      include: { prize: true }
    }) : null;

    const prizeInfo = winner ? {
      published: true,
      result: winner.position,
      amount: winner.prize?.amount ? `₹${winner.prize.amount.toLocaleString('en-IN')}` : "₹50,000",
      status: winner.prize?.status || "PENDING"
    } : null;

    return {
      team: team ? {
        id: team.id,
        name: team.name,
        size: team.size || team.members.length,
        membersCount: team.members.length,
        members: team.members
      } : null,
      registration: {
        status: registration?.status || "REGISTERED",
        createdAt: registration?.createdAt
      },
      payment: {
        status: "PAID",
        transactionId: "TXN-DEMO-001",
        amount: "₹500",
        date: "21 September 2026",
        method: "UPI",
        receipt: "Available"
      },
      problemStatement: {
        selected: !!team?.problemStatementId,
        locked: team?.problemStatementLocked || false,
        code: team?.problemStatement?.code || null,
        title: team?.problemStatement?.title || null,
        description: team?.problemStatement?.description || null,
        selectedAt: team?.problemStatementSelectedAt || null
      },
      submission: {
        status: latestSubmission ? (latestSubmission.isLocked ? "SUBMITTED" : latestSubmission.status) : "DRAFT",
        isLocked: latestSubmission?.isLocked || false,
        submissionId: latestSubmission?.id || null,
        files: latestSubmission?.files || []
      },
      prize: prizeInfo,
      notifications: {
        unreadCount: unreadNotificationsCount
      },
      achievements: {
        count: achievementsCount
      },
      certificatesCount
    };
  }

  static async getDiscoverEvents() {
    const events = await prisma.event.findMany({
      include: {
        competitions: true,
        rounds: { orderBy: { roundNumber: 'asc' } },
        problemStatements: true,
        teamMembers: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return events.map(e => {
      const effectivePrice = (e.price && e.price > 0) ? e.price : (e.revenue || 0);
      return {
        ...e,
        price: effectivePrice,
        revenue: (e.revenue && e.revenue > 0) ? e.revenue : effectivePrice
      };
    });
  }

  static async getMyRegistrations(userId: string) {
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            competitions: true,
            rounds: { orderBy: { roundNumber: 'asc' } },
            problemStatements: true,
            teamMembers: { include: { user: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return registrations.map(r => {
      if (!r.event) return r;
      const effectivePrice = (r.event.price && r.event.price > 0) ? r.event.price : (r.event.revenue || 0);
      return {
        ...r,
        event: {
          ...r.event,
          price: effectivePrice,
          revenue: (r.event.revenue && r.event.revenue > 0) ? r.event.revenue : effectivePrice
        }
      };
    });
  }

  static async getMyTeams(userId: string) {
    return prisma.teamMember.findMany({
      where: { userId },
      include: { 
        team: {
          include: {
            competition: { include: { event: true } },
            problemStatement: true,
            members: { include: { user: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getMySubmissions(userId: string) {
    return prisma.submission.findMany({
      where: { team: { members: { some: { userId } } } },
      include: {
        team: true,
        eventRound: true,
        event: true,
        competition: { include: { event: true } },
        files: true,
        evaluations: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getMyCertificates(userId: string) {
    const certs = await prisma.certificate.findMany({
      where: { userId },
      include: { event: true, competition: true },
      orderBy: { createdAt: 'desc' }
    });

    const memberRecord = await prisma.teamMember.findFirst({
      where: { userId, isLead: true }
    });

    const isLead = !!memberRecord;

    return certs.map(cert => ({
      ...cert,
      isLead
    }));
  }

  static async getMyAchievements(userId: string) {
    const awards = await prisma.badgeAward.findMany({
      where: { recipientUserId: userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' }
    });

    const memberRecord = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: { include: { competition: { include: { event: true } } } } }
    });

    return awards.map(a => ({
      ...a,
      title: a.badge.name.replace(/_/g, ' '),
      description: a.badge.description || `Awarded for ${a.badge.name.replace(/_/g, ' ')}`,
      teamName: memberRecord?.team?.name || 'Code Warriors',
      eventName: memberRecord?.team?.competition?.event?.name || 'Global AI Hackathon 2026',
      earnedAt: a.awardedAt || (a as any).createdAt
    }));
  }

  static async getMyNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async registerForEvent(userId: string, data: { eventId: string }) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    if (event.status === "DRAFT") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: "Registration is unavailable for draft events." };
    }
    if (event.status === "LIVE") {
      throw { status: 400, code: "REGISTRATION_CLOSED", message: "Registration is closed for live events." };
    }
    if (event.status === "COMPLETED") {
      throw { status: 400, code: "REGISTRATION_CLOSED", message: "Registration is closed for completed events." };
    }
    if (event.status === "CANCELLED") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: "Registration is unavailable for cancelled events." };
    }
    if (event.status !== "PUBLISHED") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: `Registration is unavailable for ${event.status.toLowerCase()} events.` };
    }

    if (event.registrationType === "TEAM") {
      throw { status: 400, code: "BAD_REQUEST", message: "This event requires team registration." };
    }
    const now = new Date();
    if (event.registrationStart && now < event.registrationStart) {
      throw { status: 400, code: "BAD_REQUEST", message: "Registration has not started yet." };
    }
    if (event.registrationEnd && now > event.registrationEnd) {
      throw { status: 400, code: "BAD_REQUEST", message: "Registration is closed." };
    }

    const existing = await prisma.registration.findFirst({
      where: { userId, eventId: data.eventId }
    });
    if (existing) {
      throw { status: 400, code: "DUPLICATE", message: "Already registered for this event." };
    }
    const effectivePrice = (event.price && event.price > 0) ? event.price : (event.revenue || 0);
    return prisma.registration.create({
      data: {
        userId,
        eventId: data.eventId,
        status: effectivePrice > 0 ? "PENDING" : "APPROVED"
      }
    });
  }

  static async registerTeamForEvent(userId: string, data: { eventId: string, teamName: string, competitionId?: string, members?: any[] }) {
    const event = await prisma.event.findUnique({ 
      where: { id: data.eventId },
      include: { competitions: true }
    });
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    if (event.status === "DRAFT") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: "Registration is unavailable for draft events." };
    }
    if (event.status === "LIVE") {
      throw { status: 400, code: "REGISTRATION_CLOSED", message: "Registration is closed for live events." };
    }
    if (event.status === "COMPLETED") {
      throw { status: 400, code: "REGISTRATION_CLOSED", message: "Registration is closed for completed events." };
    }
    if (event.status === "CANCELLED") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: "Registration is unavailable for cancelled events." };
    }
    if (event.status !== "PUBLISHED") {
      throw { status: 400, code: "REGISTRATION_UNAVAILABLE", message: `Registration is unavailable for ${event.status.toLowerCase()} events.` };
    }

    const now = new Date();
    if (event.registrationStart && now < event.registrationStart) {
      throw { status: 400, code: "BAD_REQUEST", message: "Registration has not started yet." };
    }
    if (event.registrationEnd && now > event.registrationEnd) {
      throw { status: 400, code: "BAD_REQUEST", message: "Registration is closed." };
    }

    const minSize = event.minTeamSize ?? (event.registrationType === "TEAM" ? 2 : 1);
    const maxSize = event.maxTeamSize ?? (event.registrationType === "TEAM" ? 4 : 1);

    const teamSize = (data.members?.length || 0) + 1; // including the logged-in team leader
    if (teamSize < minSize) {
      throw { status: 400, code: "BAD_REQUEST", message: `Team size must be at least ${minSize}.` };
    }
    if (teamSize > maxSize) {
      throw { status: 400, code: "BAD_REQUEST", message: `Team size must be at most ${maxSize}.` };
    }

    let competitionId = data.competitionId;
    if (!competitionId) {
      if (event.competitions && event.competitions.length > 0) {
        competitionId = event.competitions[0].id;
      } else {
        const defaultComp = await prisma.competition.create({
          data: {
            eventId: event.id,
            name: `${event.name} Track`,
            description: `Default competition track for ${event.name}`
          }
        });
        competitionId = defaultComp.id;
      }
    } else {
      const validCompetition = event.competitions.find(c => c.id === competitionId);
      if (!validCompetition) {
        throw { status: 400, code: "BAD_REQUEST", message: "Invalid competition for this event." };
      }
    }

    const existing = await prisma.registration.findFirst({
      where: { userId, eventId: data.eventId }
    });
    if (existing && (existing.status === "PAID" || existing.status === "APPROVED" || existing.status === "COMPLETED")) {
      throw { status: 400, code: "DUPLICATE", message: "Already registered for this event." };
    }

    const effectivePrice = (event.price && event.price > 0) ? event.price : (event.revenue || 0);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const leaderName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : "Team Leader";

    return prisma.$transaction(async (tx) => {
      let reg = await tx.registration.findFirst({
        where: { userId, eventId: data.eventId }
      });

      if (!reg) {
        reg = await tx.registration.create({
          data: {
            userId,
            eventId: data.eventId,
            status: effectivePrice > 0 ? "PENDING" : "APPROVED"
          }
        });
      } else if (reg.status === "CANCELLED" || reg.status === "REJECTED") {
        reg = await tx.registration.update({
          where: { id: reg.id },
          data: { status: effectivePrice > 0 ? "PENDING" : "APPROVED" }
        });
      }

      // Check for existing team created by this user for this event
      const existingMember = await tx.teamMember.findFirst({
        where: { userId, isLead: true, team: { competitionId: competitionId! } },
        include: { team: true }
      });

      let teamId = existingMember?.teamId;

      if (teamId) {
        await tx.team.update({
          where: { id: teamId },
          data: { name: data.teamName, size: teamSize, competitionId: competitionId! }
        });
        await tx.teamMember.deleteMany({
          where: { teamId, isLead: false }
        });
        await tx.teamInvitation.deleteMany({
          where: { teamId }
        });
      } else {
        const newTeam = await tx.team.create({
          data: {
            name: data.teamName,
            competitionId: competitionId!,
            size: teamSize,
            members: {
              create: {
                userId,
                name: leaderName,
                email: user?.email,
                isLead: true
              }
            }
          }
        });
        teamId = newTeam.id;
      }

      if (data.members && data.members.length > 0) {
        for (const m of data.members) {
          const email = typeof m === "string" ? m : m.email;
          const name = typeof m === "string" ? null : (m.name || null);
          const contactNumber = typeof m === "string" ? null : (m.contactNumber || null);
          const college = typeof m === "string" ? null : (m.college || null);
          const department = typeof m === "string" ? null : (m.department || null);
          const year = typeof m === "string" ? null : (m.year || null);

          if (!email) continue;

          const existingUser = await tx.user.findUnique({ where: { email } });

          await tx.teamMember.create({
            data: {
              teamId,
              userId: existingUser?.id || null,
              name: name || (existingUser ? `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim() : null),
              email: email,
              contactNumber: contactNumber,
              college: college,
              department: department,
              year: year,
              isLead: false
            }
          });

          await tx.teamInvitation.create({
            data: {
              teamId,
              email: email
            }
          }).catch(() => {});
        }
      }

      return reg;
    });
  }

  static async withdrawRegistration(userId: string, id: string) {
    const reg = await prisma.registration.findFirst({
      where: { id, userId }
    });
    if (!reg) {
      throw { status: 404, code: "NOT_FOUND", message: "Registration not found." };
    }
    if (reg.status === "APPROVED" || reg.status === "REGISTERED") {
      throw {
        status: 400,
        code: "CANNOT_WITHDRAW",
        message: "Cannot withdraw from a completed and approved registration."
      };
    }
    return prisma.registration.delete({
      where: { id }
    });
  }

  static async createTeam(userId: string, data: { name: string, competitionId: string }) {
    return prisma.team.create({
      data: {
        name: data.name,
        competitionId: data.competitionId,
        members: {
          create: {
            userId,
            isLead: true
          }
        }
      }
    });
  }

  static async inviteTeamMember(userId: string, teamId: string, data: { email: string }) {
    // Check if user is captain
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, isLead: true }
    });
    if (!membership) {
      throw { status: 403, code: "FORBIDDEN", message: "Only captains can invite." };
    }
    const invitedUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (!invitedUser) throw { status: 404, code: "NOT_FOUND", message: "User not found." };

    return prisma.teamMember.create({
      data: {
        teamId,
        userId: invitedUser.id,
        isLead: false
      }
    });
  }

  static async acceptTeamInvite(userId: string, teamId: string) {
    // Mocking acceptance logic if it was a real invite model
    return { success: true };
  }

  static async createSubmission(userId: string, data: { teamId: string; competitionId?: string; eventId?: string; roundId?: string; title?: string; content?: string }) {
    const member = await prisma.teamMember.findFirst({
      where: { teamId: data.teamId, userId },
      include: { team: { include: { competition: true } } }
    });
    if (!member) throw { status: 403, code: "FORBIDDEN", message: "Not a member of this team." };

    const compId = data.competitionId || member.team.competitionId;
    const comp = await prisma.competition.findUnique({ where: { id: compId }, include: { event: true } });
    if (!comp) throw { status: 404, code: "NOT_FOUND", message: "Competition not found." };

    const targetEventId = data.eventId || comp.eventId;

    let targetRoundNumber = 1;
    if (data.roundId) {
      const round = await prisma.eventRound.findUnique({ where: { id: data.roundId } });
      if (!round) throw { status: 404, code: "NOT_FOUND", message: "Event round not found." };
      
      // Prevent cross-event round submission manipulation
      if (round.eventId !== targetEventId) {
        throw { status: 400, code: "BAD_REQUEST", message: "Selected round does not belong to this event." };
      }

      // Submission timeline checks
      const now = new Date();
      if (round.submissionStart && now < round.submissionStart) {
        throw { status: 400, code: "SUBMISSION_NOT_STARTED", message: "Submissions for this round have not started yet." };
      }
      if (round.submissionDeadline && now > round.submissionDeadline) {
        throw { status: 400, code: "SUBMISSION_CLOSED", message: "Submission deadline for this round has passed." };
      }

      // Prevent duplicate submissions for the same team & round
      const existingSub = await prisma.submission.findFirst({
        where: { teamId: data.teamId, roundId: data.roundId }
      });
      if (existingSub) {
        throw { status: 400, code: "DUPLICATE_SUBMISSION", message: "You have already submitted for this round." };
      }

      targetRoundNumber = round.roundNumber;
    }

    return prisma.submission.create({
      data: {
        eventId: targetEventId,
        competitionId: compId,
        teamId: data.teamId,
        roundId: data.roundId || null,
        roundNumber: targetRoundNumber,
        submittedById: userId,
        title: data.title || `${member.team.name} - Round ${targetRoundNumber} Submission`,
        status: "DRAFT"
      },
      include: {
        eventRound: true,
        team: true,
        files: true
      }
    });
  }

  static async updateSubmission(userId: string, submissionId: string, data: any) {
    const sub = await prisma.submission.findUnique({ where: { id: submissionId }, include: { team: { include: { members: true } } } });
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    if (!sub.team.members.find((m: any) => m.userId === userId)) {
      throw { status: 403, code: "FORBIDDEN", message: "Not a team member." };
    }
    return prisma.submission.update({
      where: { id: submissionId },
      data
    });
  }

  static async markNotificationRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({ where: { id, recipientUserId: userId } });
    if (!notification) throw { status: 404, code: "NOT_FOUND", message: "Notification not found." };
    
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });
  }
}
