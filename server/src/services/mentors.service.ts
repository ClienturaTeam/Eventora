import { MentorRepository } from "../repositories/mentors.repository";
import { prisma } from "../utils/prisma";

export class MentorService {
  static async getMentors(tenantId: string) {
    return MentorRepository.findAll(tenantId);
  }

  static async getMentor(tenantId: string, id: string) {
    const mentor = await MentorRepository.findById(tenantId, id);
    if (!mentor) throw { status: 404, code: "NOT_FOUND", message: "Mentor not found." };
    return mentor;
  }

  static async createMentor(tenantId: string, data: { userId: string; expertise?: string; bio?: string }) {
    try {
      return await MentorRepository.create(tenantId, data);
    } catch (err: any) {
      if (err.code === "P2002") {
        throw { status: 409, code: "CONFLICT", message: "This user already has a mentor profile in this organization." };
      }
      throw err;
    }
  }

  static async updateMentor(tenantId: string, id: string, data: { expertise?: string; bio?: string }) {
    const mentor = await MentorRepository.update(tenantId, id, data);
    if (!mentor) throw { status: 404, code: "NOT_FOUND", message: "Mentor not found." };
    return mentor;
  }

  static async deleteMentor(tenantId: string, id: string) {
    const mentor = await MentorRepository.delete(tenantId, id);
    if (!mentor) throw { status: 404, code: "NOT_FOUND", message: "Mentor not found." };
    return true;
  }

  static async assignTeam(tenantId: string, mentorId: string, teamId: string) {
    try {
      return await MentorRepository.assignTeam(tenantId, mentorId, teamId);
    } catch (err: any) {
      if (err.code === "P2002") {
        throw { status: 409, code: "CONFLICT", message: "Mentor is already assigned to this team." };
      }
      throw err;
    }
  }

  static async removeTeam(tenantId: string, mentorId: string, teamId: string) {
    return MentorRepository.removeTeam(tenantId, mentorId, teamId);
  }

  // Mentor Q&A / Doubt System Methods
  static async askQuestion(
    tenantId: string | undefined,
    participantUserId: string,
    data: { eventId: string; roundId?: string; subject?: string; question: string; mentorId?: string }
  ) {
    if (!data.eventId) {
      throw { status: 400, code: "BAD_REQUEST", message: "eventId is required to ask a question." };
    }
    if (!data.question || !data.question.trim()) {
      throw { status: 400, code: "BAD_REQUEST", message: "Question text is required." };
    }

    const event = await prisma.event.findUnique({
      where: { id: data.eventId }
    });
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }

    const resolvedOrgId = tenantId || event.organizationId;

    // Verify participant belongs to this event (via registration or team membership)
    const registration = await prisma.registration.findFirst({
      where: { userId: participantUserId, eventId: data.eventId }
    });
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: participantUserId,
        team: { competition: { eventId: data.eventId } }
      },
      include: {
        team: {
          include: {
            problemStatement: true
          }
        }
      }
    });

    const isOrgMember = await prisma.organizationMember.findFirst({
      where: { userId: participantUserId, organizationId: resolvedOrgId, status: "ACTIVE" }
    });

    if (!registration && !teamMember && !isOrgMember) {
      throw { status: 403, code: "FORBIDDEN", message: "You must be registered or part of a team for this event to ask a question." };
    }

    const subjectText = data.subject || (data.question ? data.question.substring(0, 60) : "Participant Question");
    const q = await prisma.mentorQuestion.create({
      data: {
        organizationId: resolvedOrgId,
        eventId: data.eventId,
        roundId: data.roundId || null,
        participantId: participantUserId,
        mentorId: data.mentorId || null,
        subject: subjectText,
        question: data.question.trim(),
        status: "PENDING"
      },
      include: {
        event: { select: { id: true, name: true } },
        round: true,
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    // Notify mentor or managers
    if (data.mentorId) {
      await prisma.notification.create({
        data: {
          organizationId: resolvedOrgId,
          recipientUserId: data.mentorId,
          title: "New Participant Question",
          message: `Participant asked: "${subjectText}"`,
          type: "SYSTEM",
          link: "/mentors"
        }
      }).catch(() => {});
    }

    return {
      ...q,
      team: teamMember?.team ? { id: teamMember.team.id, name: teamMember.team.name } : null,
      problemStatement: teamMember?.team?.problemStatement || null
    };
  }

  static async getQuestions(
    tenantId: string | undefined,
    userId: string,
    filters?: { eventId?: string; roundId?: string; status?: string }
  ) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: { role: true }
    });
    const mentorProfile = await prisma.mentor.findFirst({
      where: { userId },
      include: { teamAssignments: true }
    });

    const isStaff = !!mentorProfile || memberships.some(m => {
      const roleName = (m.role?.name || "").toLowerCase();
      return roleName.includes("mentor") || roleName.includes("admin") || roleName.includes("manager") || roleName.includes("coordinator");
    });

    const resolvedOrgId = tenantId || memberships[0]?.organizationId || mentorProfile?.organizationId;

    const where: any = {};
    if (resolvedOrgId) {
      where.organizationId = resolvedOrgId;
    }

    if (filters?.eventId) where.eventId = filters.eventId;
    if (filters?.roundId) where.roundId = filters.roundId;
    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "PENDING" || filters.status === "UNANSWERED") {
        where.status = { in: ["PENDING", "OPEN"] };
      } else {
        where.status = filters.status;
      }
    }

    if (!isStaff) {
      // Participant view: strictly only questions from participant or their teammates
      const myTeamMembers = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true }
      });
      const myTeamIds = myTeamMembers.map(m => m.teamId);

      const teammateMembers = await prisma.teamMember.findMany({
        where: { teamId: { in: myTeamIds }, userId: { not: null } },
        select: { userId: true }
      });
      const allowedUserIds = Array.from(new Set([userId, ...teammateMembers.map(m => m.userId).filter((id): id is string => Boolean(id))]));

      where.participantId = { in: allowedUserIds };
    } else {
      // Mentor view: if mentor has specific team assignments, prioritize those
      if (mentorProfile?.teamAssignments && mentorProfile.teamAssignments.length > 0) {
        const assignedTeamIds = mentorProfile.teamAssignments.map(ta => ta.teamId);
        const teamParticipants = await prisma.teamMember.findMany({
          where: { teamId: { in: assignedTeamIds }, userId: { not: null } },
          select: { userId: true }
        });
        const participantIds = teamParticipants.map(tp => tp.userId).filter((id): id is string => Boolean(id));
        where.OR = [
          { mentorId: userId },
          { participantId: { in: participantIds } },
          { mentorId: null }
        ];
      }
    }

    const rawQuestions = await prisma.mentorQuestion.findMany({
      where,
      include: {
        event: { select: { id: true, name: true } },
        round: true,
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Batch enrich with team & problemStatement
    const participantIds = Array.from(new Set(rawQuestions.map(q => q.participantId).filter((id): id is string => Boolean(id))));
    const allTeamMembers = await prisma.teamMember.findMany({
      where: { userId: { in: participantIds } },
      include: {
        team: {
          include: {
            problemStatement: true,
            competition: { select: { eventId: true } }
          }
        }
      }
    });

    return rawQuestions.map(q => {
      const tm = allTeamMembers.find(
        m => m.userId === q.participantId && m.team?.competition?.eventId === q.eventId
      );
      return {
        ...q,
        team: tm?.team ? { id: tm.team.id, name: tm.team.name } : null,
        problemStatement: tm?.team?.problemStatement || null
      };
    });
  }

  static async getQuestionById(tenantId: string | undefined, id: string, requestingUserId?: string) {
    const q = await prisma.mentorQuestion.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, name: true } },
        round: true,
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!q) throw { status: 404, code: "NOT_FOUND", message: "Question not found." };

    if (tenantId && q.organizationId !== tenantId) {
      throw { status: 404, code: "NOT_FOUND", message: "Question not found in this organization." };
    }

    if (requestingUserId) {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: requestingUserId, status: "ACTIVE" },
        include: { role: true }
      });
      const mentorProfile = await prisma.mentor.findFirst({
        where: { userId: requestingUserId, organizationId: q.organizationId }
      });
      const isStaff = !!mentorProfile || memberships.some(m => {
        const roleName = (m.role?.name || "").toLowerCase();
        return roleName.includes("mentor") || roleName.includes("admin") || roleName.includes("manager");
      });

      if (!isStaff) {
        // Must be the participant or a teammate
        const myTeamMembers = await prisma.teamMember.findMany({
          where: { userId: requestingUserId },
          select: { teamId: true }
        });
        const myTeamIds = myTeamMembers.map(m => m.teamId);
        const isTeammate = await prisma.teamMember.findFirst({
          where: {
            userId: q.participantId,
            teamId: { in: myTeamIds }
          }
        });

        if (q.participantId !== requestingUserId && !isTeammate) {
          throw { status: 403, code: "FORBIDDEN", message: "You are not authorized to view this question." };
        }
      }
    }

    const tm = await prisma.teamMember.findFirst({
      where: {
        userId: q.participantId,
        team: { competition: { eventId: q.eventId } }
      },
      include: {
        team: {
          include: { problemStatement: true }
        }
      }
    });

    return {
      ...q,
      team: tm?.team ? { id: tm.team.id, name: tm.team.name } : null,
      problemStatement: tm?.team?.problemStatement || null
    };
  }

  static async addReply(tenantId: string | undefined, questionId: string, senderUserId: string, message: string) {
    if (!message || !message.trim()) {
      throw { status: 400, code: "BAD_REQUEST", message: "Reply message cannot be empty." };
    }

    const q = await this.getQuestionById(tenantId, questionId, senderUserId);

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: senderUserId, status: "ACTIVE" },
      include: { role: true }
    });
    const mentorProfile = await prisma.mentor.findFirst({
      where: { userId: senderUserId, organizationId: q.organizationId }
    });
    const isStaff = !!mentorProfile || memberships.some(m => {
      const roleName = (m.role?.name || "").toLowerCase();
      return roleName.includes("mentor") || roleName.includes("admin") || roleName.includes("manager");
    });

    // Participant must NOT be able to reply as a mentor
    if (!isStaff) {
      throw { status: 403, code: "FORBIDDEN", message: "Only authorized mentors or event staff can reply to doubts." };
    }

    const reply = await prisma.questionReply.create({
      data: {
        questionId,
        senderId: senderUserId,
        message: message.trim()
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // Update question status to ANSWERED and assign mentorId
    await prisma.mentorQuestion.update({
      where: { id: questionId },
      data: { status: "ANSWERED", mentorId: senderUserId }
    });

    // Notify participant
    await prisma.notification.create({
      data: {
        organizationId: q.organizationId,
        recipientUserId: q.participantId,
        title: "Mentor Replied to Your Question",
        message: `Mentor replied to "${q.subject}": ${message.trim().substring(0, 80)}...`,
        type: "SYSTEM",
        link: "/participant/submissions"
      }
    }).catch(() => {});

    return reply;
  }

  static async updateQuestionStatus(tenantId: string | undefined, questionId: string, status: string) {
    await this.getQuestionById(tenantId, questionId);
    return prisma.mentorQuestion.update({
      where: { id: questionId },
      data: { status }
    });
  }
}
