import { EventRepository } from "../repositories/events.repository";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { validateEventAndRoundsSchedule } from "../utils/schedule-validator";

export class EventService {
  static async getEvents(tenantId: string, onlyAssignedUserId?: string) {
    return EventRepository.findAll(tenantId, onlyAssignedUserId);
  }

  static async getEvent(tenantId: string, id: string, onlyAssignedUserId?: string) {
    const event = await EventRepository.findById(tenantId, id, onlyAssignedUserId);
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found or access denied." };
    }
    return event;
  }

  static async createEvent(tenantId: string, data: any) {
    const { facultyCoordinatorId, studentCoordinatorId, rounds, ...eventData } = data;
    if (typeof eventData.revenue === "number" && (eventData.price === undefined || eventData.price === 0)) {
      eventData.price = eventData.revenue;
    } else if (typeof eventData.price === "number" && (eventData.revenue === undefined || eventData.revenue === 0)) {
      eventData.revenue = eventData.price;
    }

    // Validate Event Start/End and Rounds Schedule
    validateEventAndRoundsSchedule({
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      rounds: rounds || [],
    });

    const event = await EventRepository.create(tenantId, eventData);
    let fcId = facultyCoordinatorId;
    if (!fcId) {
      const defaultFc = await prisma.organizationMember.findFirst({
        where: { organizationId: tenantId, role: { name: "Faculty Coordinator" }, status: "ACTIVE" }
      });
      if (defaultFc) fcId = defaultFc.userId;
    }
    if (fcId) {
      await prisma.eventTeamMember.create({
        data: {
          eventId: event.id,
          userId: fcId,
          responsibility: "Faculty Coordinator"
        }
      });
    }
    if (studentCoordinatorId) {
      await prisma.eventTeamMember.create({
        data: {
          eventId: event.id,
          userId: studentCoordinatorId,
          responsibility: "Primary Student Coordinator"
        }
      });
    }

    if (rounds && Array.isArray(rounds) && rounds.length > 0) {
      for (const r of rounds) {
        await prisma.eventRound.create({
          data: {
            eventId: event.id,
            roundNumber: Number(r.roundNumber),
            name: r.name,
            description: r.description || null,
            maxMarks: Number(r.maxMarks || 100),
            submissionStart: r.submissionStart ? new Date(r.submissionStart) : null,
            submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline) : null,
            status: r.status || "ACTIVE",
            instructions: r.instructions || null,
            submissionType: r.submissionType || "FILE"
          }
        });
      }
    }

    return this.getEvent(tenantId, event.id);
  }

  static async updateEvent(tenantId: string, id: string, data: any) {
    const { facultyCoordinatorId, rounds, ...eventData } = data;
    if (typeof eventData.revenue === "number" && (eventData.price === undefined || eventData.price === 0)) {
      eventData.price = eventData.revenue;
    } else if (typeof eventData.price === "number" && (eventData.revenue === undefined || eventData.revenue === 0)) {
      eventData.revenue = eventData.price;
    }

    const existingEvent = await EventRepository.findById(tenantId, id);
    if (!existingEvent) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }

    const mergedStartTime = eventData.startTime || existingEvent.startTime;
    const mergedEndTime = eventData.endTime || existingEvent.endTime;

    // Get merged rounds list for validation
    let mergedRounds = existingEvent.rounds || [];
    if (rounds && Array.isArray(rounds)) {
      const roundsMap = new Map<string | number, any>();
      mergedRounds.forEach(r => roundsMap.set(r.id || r.roundNumber, r));
      rounds.forEach(r => roundsMap.set(r.id || r.roundNumber, { ...roundsMap.get(r.id || r.roundNumber), ...r }));
      mergedRounds = Array.from(roundsMap.values());
    }

    // Validate schedule
    validateEventAndRoundsSchedule({
      startTime: mergedStartTime,
      endTime: mergedEndTime,
      rounds: mergedRounds,
    });

    if (eventData.maxTeamSize !== undefined && eventData.maxTeamSize !== null) {
      const newMax = Number(eventData.maxTeamSize);
      const existingTeams = await prisma.team.findMany({
        where: { competition: { eventId: id } },
        include: { members: true }
      });
      let maxExistingSize = 0;
      for (const t of existingTeams) {
        if (t.members.length > maxExistingSize) {
          maxExistingSize = t.members.length;
        }
      }
      if (maxExistingSize > newMax) {
        throw {
          status: 400,
          code: "TEAM_SIZE_REDUCTION_INVALID",
          message: `Cannot reduce the team size to ${newMax} because existing registered teams contain up to ${maxExistingSize} participants.`
        };
      }
    }

    const event = await EventRepository.update(tenantId, id, eventData);

    if (facultyCoordinatorId) {
      const existingFc = await prisma.eventTeamMember.findFirst({
        where: { eventId: id, responsibility: "Faculty Coordinator" }
      });
      if (existingFc) {
        if (existingFc.userId !== facultyCoordinatorId) {
          await prisma.eventTeamMember.update({
            where: { id: existingFc.id },
            data: { userId: facultyCoordinatorId }
          });
        }
      } else {
        await prisma.eventTeamMember.create({
          data: {
            eventId: id,
            userId: facultyCoordinatorId,
            responsibility: "Faculty Coordinator"
          }
        });
      }
    }

    if (rounds && Array.isArray(rounds)) {
      for (const r of rounds) {
        if (r.id) {
          await prisma.eventRound.update({
            where: { id: r.id },
            data: {
              roundNumber: Number(r.roundNumber),
              name: r.name,
              description: r.description,
              maxMarks: Number(r.maxMarks || 100),
              submissionStart: r.submissionStart ? new Date(r.submissionStart) : null,
              submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline) : null,
              status: r.status || "ACTIVE",
              instructions: r.instructions,
              submissionType: r.submissionType || "FILE"
            }
          });
        } else {
          await prisma.eventRound.create({
            data: {
              eventId: id,
              roundNumber: Number(r.roundNumber),
              name: r.name,
              description: r.description || null,
              maxMarks: Number(r.maxMarks || 100),
              submissionStart: r.submissionStart ? new Date(r.submissionStart) : null,
              submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline) : null,
              status: r.status || "ACTIVE",
              instructions: r.instructions || null,
              submissionType: r.submissionType || "FILE"
            }
          });
        }
      }
    }
    
    return this.getEvent(tenantId, id);
  }

  static async getRounds(tenantId: string, eventId: string) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    return prisma.eventRound.findMany({
      where: { eventId },
      orderBy: { roundNumber: 'asc' }
    });
  }

  static async createRound(tenantId: string, eventId: string, data: any) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    const existingRounds = await prisma.eventRound.findMany({ where: { eventId } });
    const allRounds = [...existingRounds, data];

    validateEventAndRoundsSchedule({
      startTime: event.startTime,
      endTime: event.endTime,
      rounds: allRounds,
    });

    return prisma.eventRound.create({
      data: {
        eventId,
        roundNumber: Number(data.roundNumber),
        name: data.name,
        description: data.description || null,
        maxMarks: Number(data.maxMarks || 100),
        submissionStart: data.submissionStart ? new Date(data.submissionStart) : null,
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : null,
        status: data.status || "ACTIVE",
        instructions: data.instructions || null,
        submissionType: data.submissionType || "FILE"
      }
    });
  }

  static async updateRound(tenantId: string, eventId: string, roundId: string, data: any) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    const existingRounds = await prisma.eventRound.findMany({ where: { eventId } });
    const updatedRounds = existingRounds.map(r => r.id === roundId ? { ...r, ...data } : r);

    validateEventAndRoundsSchedule({
      startTime: event.startTime,
      endTime: event.endTime,
      rounds: updatedRounds,
    });

    return prisma.eventRound.update({
      where: { id: roundId },
      data: {
        roundNumber: data.roundNumber ? Number(data.roundNumber) : undefined,
        name: data.name,
        description: data.description,
        maxMarks: data.maxMarks ? Number(data.maxMarks) : undefined,
        submissionStart: data.submissionStart ? new Date(data.submissionStart) : undefined,
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
        status: data.status,
        instructions: data.instructions,
        submissionType: data.submissionType
      }
    });
  }

  static async deleteRound(tenantId: string, eventId: string, roundId: string) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw { status: 404, code: "NOT_FOUND", message: "Event not found." };

    await prisma.eventRound.delete({ where: { id: roundId } });
    return true;
  }

  static async deleteEvent(tenantId: string, id: string) {
    const event = await EventRepository.delete(tenantId, id);
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }
    return true;
  }

  static async getEventDashboard(tenantId: string, id: string, onlyAssignedUserId?: string) {
    const whereClause: any = { id, organizationId: tenantId };
    if (onlyAssignedUserId) {
      whereClause.OR = [
        { teamMembers: { some: { userId: onlyAssignedUserId } } }
      ];
    }

    const event = await prisma.event.findFirst({
      where: whereClause,
      include: {
        registrations: true,
        competitions: {
          include: {
            teams: true,
            submissions: true,
          }
        }
      }
    });

    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found." };
    }

    const registrations = event.registrations.length;
    let teams = 0;
    let submissions = 0;

    event.competitions.forEach(c => {
      teams += c.teams.length;
      submissions += c.submissions.length;
    });

    // Group registrations by month for the trend
    const monthMap: Record<string, number> = {};
    event.registrations.forEach(r => {
      const month = r.createdAt.toLocaleString('default', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const registrationTrend = Object.keys(monthMap).map(month => ({
      month,
      registrations: monthMap[month],
      participants: 0 // Mock removed; pending real attendance calculation
    }));

    if (registrationTrend.length === 0) {
      registrationTrend.push({ month: "Current", registrations: 0, participants: 0 });
    }

    return {
      registrationTrend,
      metrics: {
        registrations,
        teams,
        submissions,
        revenue: 0, // Mock removed; revenue not tracked in schema currently
      }
    };
  }

  static async getEventSessions(tenantId: string, id: string, onlyAssignedUserId?: string) {
    const whereClause: any = { id, organizationId: tenantId };
    if (onlyAssignedUserId) {
      whereClause.OR = [
        { teamMembers: { some: { userId: onlyAssignedUserId } } }
      ];
    }

    const event = await prisma.event.findFirst({
      where: whereClause
    });
    if (!event) {
      throw { status: 404, code: "NOT_FOUND", message: "Event not found or access denied." };
    }
    const sessions = await prisma.attendanceSession.findMany({
      where: { eventId: id },
      orderBy: { startTime: 'asc' }
    });
    return sessions;
  }
}
