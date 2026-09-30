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
  static async askQuestion(tenantId: string, participantUserId: string, data: { eventId: string; roundId?: string; subject?: string; question: string; mentorId?: string }) {
    const subjectText = data.subject || (data.question ? data.question.substring(0, 50) : "Participant Question");
    const q = await prisma.mentorQuestion.create({
      data: {
        organizationId: tenantId,
        eventId: data.eventId,
        roundId: data.roundId || null,
        participantId: participantUserId,
        mentorId: data.mentorId || null,
        subject: subjectText,
        question: data.question,
        status: "PENDING"
      },
      include: {
        event: { select: { id: true, name: true } },
        round: true,
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // Notify mentor or managers
    if (data.mentorId) {
      await prisma.notification.create({
        data: {
          organizationId: tenantId,
          recipientUserId: data.mentorId,
          title: "New Participant Question",
          message: `Participant asked: "${subjectText}"`,
          type: "SYSTEM",
          link: "/mentors"
        }
      });
    }

    return q;
  }

  static async getQuestions(tenantId: string, userId: string, filters?: { eventId?: string; roundId?: string; status?: string }) {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: tenantId } },
      include: { role: true }
    });
    const roleName = membership?.role?.name?.toLowerCase() || "";
    const isMentorProfile = await prisma.mentor.findFirst({ where: { userId, organizationId: tenantId } });
    const isStaff = !!isMentorProfile || roleName.includes("admin") || roleName.includes("manager") || roleName.includes("mentor");

    const where: any = { organizationId: tenantId };
    if (!isStaff) {
      where.participantId = userId;
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

    return prisma.mentorQuestion.findMany({
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
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getQuestionById(tenantId: string, id: string, requestingUserId?: string) {
    const q = await prisma.mentorQuestion.findFirst({
      where: { id, organizationId: tenantId },
      include: {
        event: { select: { id: true, name: true } },
        round: true,
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!q) throw { status: 404, code: "NOT_FOUND", message: "Question not found." };

    if (requestingUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: requestingUserId, organizationId: tenantId } },
        include: { role: true }
      });
      const roleName = membership?.role?.name?.toLowerCase() || "";
      const isMentorProfile = await prisma.mentor.findFirst({ where: { userId: requestingUserId, organizationId: tenantId } });
      const isStaff = !!isMentorProfile || roleName.includes("admin") || roleName.includes("manager") || roleName.includes("mentor");

      if (!isStaff && q.participantId !== requestingUserId) {
        throw { status: 403, code: "FORBIDDEN", message: "You are not authorized to view this question." };
      }
    }

    return q;
  }

  static async addReply(tenantId: string, questionId: string, senderUserId: string, message: string) {
    const q = await this.getQuestionById(tenantId, questionId, senderUserId);

    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: senderUserId, organizationId: tenantId } },
      include: { role: true }
    });
    const roleName = membership?.role?.name?.toLowerCase() || "";
    const isMentorProfile = await prisma.mentor.findFirst({ where: { userId: senderUserId, organizationId: tenantId } });
    const isStaff = !!isMentorProfile || roleName.includes("admin") || roleName.includes("manager") || roleName.includes("mentor");

    if (!isStaff && senderUserId !== q.participantId) {
      throw { status: 403, code: "FORBIDDEN", message: "You are not authorized to reply to this question." };
    }

    const reply = await prisma.questionReply.create({
      data: {
        questionId,
        senderId: senderUserId,
        message
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    if (isStaff) {
      await prisma.mentorQuestion.update({
        where: { id: questionId },
        data: { status: "ANSWERED", mentorId: senderUserId }
      });

      // Notify participant
      await prisma.notification.create({
        data: {
          organizationId: tenantId,
          recipientUserId: q.participantId,
          title: "Mentor Replied to Your Question",
          message: `Mentor replied to "${q.subject}": ${message.substring(0, 80)}...`,
          type: "SYSTEM",
          link: `/participant`
        }
      });
    }

    return reply;
  }

  static async updateQuestionStatus(tenantId: string, questionId: string, status: string) {
    await this.getQuestionById(tenantId, questionId);
    return prisma.mentorQuestion.update({
      where: { id: questionId },
      data: { status }
    });
  }
}
