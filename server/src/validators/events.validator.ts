import { z } from "zod";
import { EventStatus } from "@prisma/client";

export const createEventSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.nativeEnum(EventStatus).optional(),
  registrationType: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
  minTeamSize: z.number().int().min(1).optional().nullable(),
  maxTeamSize: z.number().int().min(1).optional().nullable(),
  registrationStart: z.string().datetime().optional().nullable(),
  registrationEnd: z.string().datetime().optional().nullable(),
  registrationConfig: z.record(z.any()).optional().nullable(),
  facultyCoordinatorId: z.string().uuid().optional().nullable(),
  studentCoordinatorId: z.string().uuid().optional().nullable(),
});

export const updateEventSchema = createEventSchema.omit({ status: true }).partial();

export const addEventTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  responsibility: z.string().min(1).max(100),
});

export const updateEventTeamMemberSchema = z.object({
  responsibility: z.string().min(1).max(100),
});
