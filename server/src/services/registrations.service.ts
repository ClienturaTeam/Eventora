import { RegistrationRepository } from "../repositories/registrations.repository";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

export class RegistrationService {
  static async getRegistrations(tenantId: string, filters?: { eventId?: string, search?: string, limit?: number }) {
    return RegistrationRepository.findAll(tenantId, filters);
  }

  static async getRegistration(tenantId: string, id: string) {
    const reg = await RegistrationRepository.findById(tenantId, id);
    if (!reg) {
      throw { status: 404, code: "NOT_FOUND", message: "Registration not found." };
    }
    return reg;
  }

  static async createRegistration(tenantId: string, data: any) {
    return RegistrationRepository.create(tenantId, data);
  }

  static async updateRegistration(tenantId: string, id: string, data: any) {
    const reg = await RegistrationRepository.update(tenantId, id, data);
    if (!reg) {
      throw { status: 404, code: "NOT_FOUND", message: "Registration not found." };
    }
    return reg;
  }

  static async registerTeam(data: {
    eventId?: string;
    competitionId?: string;
    teamName: string;
    teamSize: number;
    teamLead: {
      name: string;
      email: string;
      contactNumber?: string;
      password: string;
    };
    participants: Array<{
      name: string;
      email?: string;
      contactNumber?: string;
      college?: string;
      department?: string;
      year?: string;
    }>;
  }) {
    const { teamName, teamSize, teamLead, participants = [] } = data;

    if (!teamName || !teamSize || !teamLead || !teamLead.email || !teamLead.password || !teamLead.name) {
      throw { status: 400, code: "VALIDATION_ERROR", message: "Required fields missing for team registration." };
    }

    const totalMembers = 1 + participants.length;
    if (Number(teamSize) !== totalMembers) {
      throw {
        status: 400,
        code: "VALIDATION_ERROR",
        message: `Team size (${teamSize}) must match the total number of members including Team Lead (${totalMembers}).`
      };
    }

    // Check if Team Lead email exists
    const existingUser = await prisma.user.findUnique({ where: { email: teamLead.email.toLowerCase().trim() } });
    if (existingUser) {
      throw { status: 400, code: "USER_EXISTS", message: `Email '${teamLead.email}' is already registered.` };
    }

    const passwordHash = await bcrypt.hash(teamLead.password, 10);

    return prisma.$transaction(async (tx) => {
      // Find active organization, event, competition if not passed
      let eventId = data.eventId;
      let competitionId = data.competitionId;

      let event = eventId ? await tx.event.findUnique({ where: { id: eventId } }) : null;
      if (!event) {
        event = await tx.event.findFirst({ orderBy: { createdAt: "asc" } });
      }
      if (!event) {
        throw { status: 500, code: "INTERNAL_ERROR", message: "No event found for registration." };
      }

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

      const minSize = event.minTeamSize ?? 1;
      const maxSize = event.maxTeamSize ?? 4;
      if (totalMembers < minSize) {
        throw {
          status: 400,
          code: "VALIDATION_ERROR",
          message: `At least ${minSize} participant${minSize > 1 ? 's are' : ' is'} required for this event.`
        };
      }
      if (totalMembers > maxSize) {
        throw {
          status: 400,
          code: "VALIDATION_ERROR",
          message: `This event allows a maximum of ${maxSize} participant${maxSize > 1 ? 's' : ''} per team.`
        };
      }

      eventId = event.id;

      if (!competitionId) {
        const comp = await tx.competition.findFirst({ where: { eventId }, orderBy: { createdAt: "asc" } });
        if (comp) competitionId = comp.id;
        else {
          const anyComp = await tx.competition.findFirst({ orderBy: { createdAt: "asc" } });
          if (anyComp) competitionId = anyComp.id;
        }
      }
      if (!competitionId) {
        throw { status: 500, code: "INTERNAL_ERROR", message: "No competition found for registration." };
      }

      const nameParts = teamLead.name.trim().split(" ");
      const firstName = nameParts[0] || teamLead.name;
      const lastName = nameParts.slice(1).join(" ") || "";

      // Create Team Lead User
      const leadUser = await tx.user.create({
        data: {
          email: teamLead.email.toLowerCase().trim(),
          passwordHash,
          firstName,
          lastName,
          status: "ACTIVE"
        }
      });

      // Attach organization membership
      const role = await tx.role.findFirst({
        where: { name: { in: ["Participant", "STUDENT", "Student"] } }
      });
      if (role && event.organizationId) {
        await tx.organizationMember.create({
          data: {
            userId: leadUser.id,
            organizationId: event.organizationId,
            roleId: role.id,
            status: "ACTIVE"
          }
        });
      }

      // Create Registration
      const isPaidEvent = event.price !== null && event.price > 0;
      const registration = await tx.registration.create({
        data: {
          eventId,
          userId: leadUser.id,
          status: isPaidEvent ? "PENDING" : "APPROVED"
        }
      });

      // Create Team & Members
      const team = await tx.team.create({
        data: {
          name: teamName,
          size: Number(teamSize),
          competitionId,
          members: {
            create: [
              {
                userId: leadUser.id,
                name: teamLead.name,
                email: teamLead.email.toLowerCase().trim(),
                contactNumber: teamLead.contactNumber || null,
                isLead: true
              },
              ...participants.map((p) => ({
                name: p.name,
                email: p.email ? p.email.toLowerCase().trim() : null,
                contactNumber: p.contactNumber || null,
                college: p.college || null,
                department: p.department || null,
                year: p.year || null,
                isLead: false
              }))
            ]
          }
        },
        include: {
          members: true
        }
      });

      // Create Welcome Notification
      await tx.notification.create({
        data: {
          organizationId: event.organizationId,
          recipientUserId: leadUser.id,
          title: "Registration Successful",
          message: `Team '${teamName}' registered successfully for ${event.name}. Welcome aboard!`,
          type: "SYSTEM"
        }
      });

      return {
        registration,
        team,
        teamLead: {
          id: leadUser.id,
          name: teamLead.name,
          email: leadUser.email
        }
      };
    });
  }
}
