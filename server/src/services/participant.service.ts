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
            problemStatement: {
              include: {
                applicableRounds: { orderBy: { roundNumber: 'asc' } }
              }
            },
            members: { include: { user: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async verifyParticipantRegistrationAndPayment(userId: string, eventId: string) {
    if (!eventId) {
      return {
        allowed: false,
        reason: "NO_EVENT_SELECTED",
        message: "No event selected.",
        registrationStatus: "NOT_REGISTERED",
        paymentStatus: "PENDING",
        isPaidEvent: false
      };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, price: true, revenue: true, name: true }
    });

    if (!event) {
      return {
        allowed: false,
        reason: "EVENT_NOT_FOUND",
        message: "Event not found.",
        registrationStatus: "NOT_REGISTERED",
        paymentStatus: "PENDING",
        isPaidEvent: false
      };
    }

    const isPaidEvent = event.price !== null && event.price > 0;

    // 1. Direct user registration
    let registration = await prisma.registration.findFirst({
      where: { userId, eventId },
      include: { payment: true }
    });

    // 2. Team registration if user is a member of a team for this event
    if (!registration) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: { competition: { eventId } }
        },
        include: { team: { include: { members: true } } }
      });

      if (teamMember && teamMember.team) {
        const memberUserIds = teamMember.team.members.map(m => m.userId).filter(Boolean) as string[];
        if (memberUserIds.length > 0) {
          registration = await prisma.registration.findFirst({
            where: {
              eventId,
              userId: { in: memberUserIds }
            },
            include: { payment: true }
          });
        }
      }
    }

    if (!registration) {
      return {
        allowed: false,
        reason: "NOT_REGISTERED",
        message: "Complete event registration and payment before submitting.",
        registrationStatus: "NOT_REGISTERED",
        paymentStatus: isPaidEvent ? "PENDING" : "N/A",
        isPaidEvent
      };
    }

    const regStatus = (registration.status || "").toUpperCase();
    const isRegConfirmed = ["APPROVED", "CONFIRMED", "PAID", "REGISTERED"].includes(regStatus);

    if (!isRegConfirmed) {
      return {
        allowed: false,
        reason: "REGISTRATION_PENDING",
        message: "Complete event registration and payment before submitting.",
        registrationStatus: regStatus || "PENDING",
        paymentStatus: registration.payment?.status || "PENDING",
        isPaidEvent
      };
    }

    if (isPaidEvent) {
      let payment = registration.payment;
      if (!payment) {
        payment = await prisma.payment.findFirst({
          where: {
            eventId,
            registrationId: registration.id,
            status: "SUCCEEDED"
          }
        });
      }

      const payStatus = (payment?.status || "").toUpperCase();
      const isPaySuccess = payStatus === "SUCCEEDED" || payStatus === "PAID" || payStatus === "COMPLETED" || regStatus === "PAID";

      if (!isPaySuccess) {
        return {
          allowed: false,
          reason: "PAYMENT_PENDING",
          message: "Complete event registration and payment before submitting.",
          registrationStatus: "PENDING_PAYMENT",
          paymentStatus: payStatus || "PENDING",
          isPaidEvent
        };
      }
    }

    return {
      allowed: true,
      reason: "OK",
      message: "Access granted.",
      registrationStatus: "APPROVED",
      paymentStatus: isPaidEvent ? "PAID" : "FREE",
      isPaidEvent
    };
  }

  static async getMySubmissions(userId: string, eventId?: string) {
    if (eventId) {
      const access = await this.verifyParticipantRegistrationAndPayment(userId, eventId);
      if (!access.allowed) {
        return [];
      }
    }

    const submissions = await prisma.submission.findMany({
      where: {
        team: { members: { some: { userId } } },
        ...(eventId ? { eventId } : {})
      },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            problemStatement: true
          }
        },
        eventRound: true,
        event: true,
        competition: { include: { event: true } },
        problemStatement: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        files: true,
        evaluations: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                email: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatSub = (sub: any) => {
      const payloadObj = (typeof sub.payload === "object" && sub.payload ? sub.payload : {}) as any;
      const description = payloadObj.description || payloadObj.content || "";
      return {
        ...sub,
        description
      };
    };

    if (!eventId) {
      const verifiedMap = new Map<string, boolean>();
      const allowedSubs = [];
      for (const sub of submissions) {
        const targetEventId = sub.eventId || sub.competition?.eventId;
        if (!targetEventId) continue;
        if (!verifiedMap.has(targetEventId)) {
          const acc = await this.verifyParticipantRegistrationAndPayment(userId, targetEventId);
          verifiedMap.set(targetEventId, acc.allowed);
        }
        if (verifiedMap.get(targetEventId)) {
          allowedSubs.push(formatSub(sub));
        }
      }
      return allowedSubs;
    }

    return submissions.map(formatSub);
  }

  static async getSubmissionById(userId: string, submissionId: string, eventId?: string) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            problemStatement: true
          }
        },
        eventRound: true,
        event: true,
        competition: { include: { event: true } },
        problemStatement: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        files: true,
        evaluations: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                email: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (!sub) {
      throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    }

    // Backend security: Participant can view ONLY their team's submission
    const isMember = sub.team?.members?.some((m: any) => m.userId === userId || m.user?.id === userId);
    if (!isMember) {
      throw { status: 403, code: "FORBIDDEN", message: "You are not authorized to view another team's submission." };
    }

    const targetEventId = sub.eventId || sub.competition?.eventId;

    // Backend security: Submission must belong to the selected event
    if (eventId && targetEventId && sub.eventId !== eventId && sub.competition?.eventId !== eventId) {
      throw { status: 403, code: "FORBIDDEN", message: "Submission does not belong to the selected event." };
    }

    // Backend security: Verify registration & payment for this event
    if (targetEventId) {
      const access = await ParticipantService.verifyParticipantRegistrationAndPayment(userId, targetEventId);
      if (!access.allowed) {
        throw { status: 403, code: "FORBIDDEN", message: access.message || "Complete event registration and payment before viewing submissions." };
      }
    }

    // Backend security: Submission must belong to the team's permanently selected Problem Statement
    if (sub.team?.problemStatementId && sub.problemStatementId && sub.problemStatementId !== sub.team.problemStatementId) {
      throw { status: 403, code: "FORBIDDEN", message: "Submission problem statement does not match team's selected problem statement." };
    }

    const payloadObj = (typeof sub.payload === "object" && sub.payload ? sub.payload : {}) as any;
    const description = payloadObj.description || payloadObj.content || "";

    return {
      ...sub,
      description
    };
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
    const judgeMembership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { name: { equals: "Judge", mode: "insensitive" } }
      }
    });
    if (judgeMembership) {
      throw { status: 403, code: "FORBIDDEN", message: "Judges cannot register for events." };
    }

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
    const judgeMembership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { name: { equals: "Judge", mode: "insensitive" } }
      }
    });
    if (judgeMembership) {
      throw { status: 403, code: "FORBIDDEN", message: "Judges cannot register for events." };
    }

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

    const maxSize = event.maxTeamSize ?? 4;
    const teamSize = (data.members?.length || 0) + 1; // including the logged-in team leader

    if (teamSize > maxSize) {
      throw { status: 400, code: "BAD_REQUEST", message: `Team cannot have more than ${maxSize} participants for this event.` };
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

  static async createSubmission(userId: string, data: { teamId: string; competitionId?: string; eventId?: string; roundId?: string; title?: string; content?: string; description?: string; payload?: any }) {
    const member = await prisma.teamMember.findFirst({
      where: { teamId: data.teamId, userId },
      include: {
        team: {
          include: {
            problemStatement: { include: { applicableRounds: true } },
            competition: true
          }
        }
      }
    });
    if (!member) throw { status: 403, code: "FORBIDDEN", message: "Not a member of this team." };

    const compId = data.competitionId || member.team.competitionId;
    const comp = await prisma.competition.findUnique({ where: { id: compId }, include: { event: true } });
    if (!comp) throw { status: 404, code: "NOT_FOUND", message: "Competition not found." };

    const targetEventId = data.eventId || comp.eventId;

    // Strict Backend Access Gate: Verify Registration & Payment
    const access = await ParticipantService.verifyParticipantRegistrationAndPayment(userId, targetEventId);
    if (!access.allowed) {
      throw {
        status: 403,
        code: "FORBIDDEN",
        message: access.message || "Complete event registration and payment before submitting."
      };
    }

    // Check whether the participant's team has permanently selected a Problem Statement for that event
    if (!member.team.problemStatementId || !member.team.problemStatementLocked || !member.team.problemStatement) {
      throw {
        status: 400,
        code: "NO_PROBLEM_STATEMENT_SELECTED",
        message: "Your team must select and permanently lock a Problem Statement before starting a round submission."
      };
    }

    const ps = member.team.problemStatement;
    if (ps.eventId && ps.eventId !== targetEventId) {
      throw {
        status: 400,
        code: "INVALID_PROBLEM_STATEMENT",
        message: "Selected Problem Statement does not belong to this event."
      };
    }

    if (!data.roundId) {
      throw {
        status: 400,
        code: "BAD_REQUEST",
        message: "Round ID is required for round submission."
      };
    }

    let targetRoundNumber = 1;
    if (data.roundId) {
      const round = await prisma.eventRound.findUnique({ where: { id: data.roundId } });
      if (!round) throw { status: 404, code: "NOT_FOUND", message: "Event round not found." };
      
      // Prevent cross-event round submission manipulation
      if (round.eventId !== targetEventId) {
        throw { status: 400, code: "BAD_REQUEST", message: "Selected round does not belong to this event." };
      }

      // Check applicable rounds for team's selected problem statement
      if (ps && ps.applicableRounds && ps.applicableRounds.length > 0) {
        const isApplicable = ps.applicableRounds.some(r => r.id === data.roundId);
        if (!isApplicable) {
          throw {
            status: 400,
            code: "UNAUTHORIZED_ROUND_SUBMISSION",
            message: `Round '${round.name}' is not configured for your team's selected Problem Statement ('${ps.code}: ${ps.title}').`
          };
        }
      }

      // Submission timeline checks
      const now = new Date();
      if (round.submissionStart && now < new Date(round.submissionStart)) {
        throw { status: 400, code: "SUBMISSION_NOT_STARTED", message: `Submissions for '${round.name}' have not started yet.` };
      }
      if (round.submissionDeadline && now > new Date(round.submissionDeadline)) {
        throw { status: 400, code: "SUBMISSION_CLOSED", message: `Submission deadline for '${round.name}' has passed.` };
      }

      // Prevent duplicate submissions for the same team & round
      const existingSub = await prisma.submission.findFirst({
        where: { teamId: data.teamId, roundId: data.roundId },
        include: {
          eventRound: true,
          team: {
            include: {
              members: { include: { user: true } },
              problemStatement: true
            }
          },
          files: true,
          problemStatement: true,
          submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          evaluations: true
        }
      });

      if (existingSub) {
        if (existingSub.isLocked || existingSub.status === "SUBMITTED" || existingSub.status === "EVALUATED") {
          throw {
            status: 400,
            code: "SUBMISSION_ALREADY_LOCKED",
            message: `Round '${round.name}' submission has already been submitted and locked.`
          };
        }
        const rawDesc = (data.description || data.content || "").trim();
        if (rawDesc) {
          const updatedDraft = await prisma.submission.update({
            where: { id: existingSub.id },
            data: {
              payload: {
                ...(typeof existingSub.payload === "object" && existingSub.payload ? (existingSub.payload as any) : {}),
                description: rawDesc
              }
            },
            include: {
              eventRound: true,
              team: {
                include: {
                  members: { include: { user: true } },
                  problemStatement: true
                }
              },
              files: true,
              problemStatement: true,
              submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
              evaluations: true
            }
          });
          return {
            ...updatedDraft,
            description: rawDesc
          };
        }
        const existingPayload = (typeof existingSub.payload === "object" && existingSub.payload ? existingSub.payload : {}) as any;
        return {
          ...existingSub,
          description: existingPayload.description || existingPayload.content || ""
        };
      }

      targetRoundNumber = round.roundNumber;
    }

    const rawDesc = (data.description || data.content || "").trim();
    const payload = rawDesc
      ? { ...(data.payload && typeof data.payload === "object" ? data.payload : {}), description: rawDesc }
      : (data.payload || null);

    const created = await prisma.submission.create({
      data: {
        eventId: targetEventId,
        competitionId: compId,
        teamId: data.teamId,
        roundId: data.roundId || null,
        roundNumber: targetRoundNumber,
        submittedById: userId,
        title: data.title || `${member.team.name} - Round ${targetRoundNumber} Submission`,
        payload,
        status: "DRAFT",
        problemStatementId: member.team.problemStatementId || null
      },
      include: {
        eventRound: true,
        team: {
          include: {
            members: { include: { user: true } },
            problemStatement: true
          }
        },
        files: true,
        problemStatement: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    return {
      ...created,
      description: rawDesc
    };
  }

  static async updateSubmission(userId: string, submissionId: string, data: any) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: { include: { members: true } },
        eventRound: true
      }
    });
    if (!sub) throw { status: 404, code: "NOT_FOUND", message: "Submission not found." };
    if (!sub.team.members.find((m: any) => m.userId === userId)) {
      throw { status: 403, code: "FORBIDDEN", message: "Not a team member." };
    }

    if (sub.isLocked || sub.status === "SUBMITTED" || sub.status === "EVALUATED") {
      throw {
        status: 400,
        code: "SUBMISSION_LOCKED",
        message: "Submission is permanently locked and cannot be modified."
      };
    }

    if (sub.eventRound) {
      const now = new Date();
      if (sub.eventRound.submissionStart && now < new Date(sub.eventRound.submissionStart)) {
        throw {
          status: 400,
          code: "SUBMISSION_WINDOW_NOT_OPEN",
          message: `Submission window for '${sub.eventRound.name}' has not opened yet.`
        };
      }
      if (sub.eventRound.submissionDeadline && now > new Date(sub.eventRound.submissionDeadline)) {
        throw {
          status: 400,
          code: "SUBMISSION_WINDOW_CLOSED",
          message: `Submission deadline for '${sub.eventRound.name}' has passed.`
        };
      }
    }

    if (sub.eventId) {
      const access = await ParticipantService.verifyParticipantRegistrationAndPayment(userId, sub.eventId);
      if (!access.allowed) {
        throw {
          status: 403,
          code: "FORBIDDEN",
          message: access.message || "Complete event registration and payment before submitting."
        };
      }
    }

    const rawDesc = (data.description || data.content || "").trim();
    const updateData = { ...data };
    delete updateData.description;
    delete updateData.content;
    if (rawDesc) {
      updateData.payload = {
        ...(typeof sub.payload === "object" && sub.payload ? (sub.payload as any) : {}),
        description: rawDesc
      };
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        eventRound: true,
        team: {
          include: {
            members: { include: { user: true } },
            problemStatement: true
          }
        },
        files: true,
        problemStatement: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        evaluations: true
      }
    });

    return {
      ...updated,
      description: rawDesc || (updated.payload as any)?.description || ""
    };
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
