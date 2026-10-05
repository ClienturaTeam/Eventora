import { z } from "zod";
import { EventStatus } from "@prisma/client";

export const roundSchema = z.object({
  id: z.string().optional(),
  roundNumber: z.number().int().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  maxMarks: z.number().min(0).default(100),
  submissionStart: z.string().optional().nullable(),
  submissionDeadline: z.string().optional().nullable(),
  status: z.string().optional().default("ACTIVE"),
  instructions: z.string().optional().nullable(),
  submissionType: z.string().optional().default("FILE"),
});

const baseEventSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  rules: z.string().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.nativeEnum(EventStatus).optional(),
  registrationType: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
  minTeamSize: z.number().int().min(1, "Minimum team size must be at least 1").optional().nullable(),
  maxTeamSize: z.number().int().min(1, "Maximum team size must be at least 1").optional().nullable(),
  registrationStart: z.string().optional().nullable(),
  registrationEnd: z.string().optional().nullable(),
  registrationConfig: z.record(z.any()).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  revenue: z.number().min(0, "Revenue must be a non-negative number").optional().nullable(),
  facultyCoordinatorId: z.string().uuid().optional().nullable(),
  studentCoordinatorId: z.string().uuid().optional().nullable(),
  rounds: z.array(roundSchema).optional(),
});

const validateTeamLimits = (data: any) => {
  if (data.minTeamSize != null && data.minTeamSize < 1) return false;
  if (data.maxTeamSize != null && data.maxTeamSize < 1) return false;
  if (data.minTeamSize != null && data.maxTeamSize != null && data.maxTeamSize < data.minTeamSize) return false;
  return true;
};

export const createEventSchema = baseEventSchema.refine(validateTeamLimits, {
  message: "Maximum team participants must be greater than or equal to minimum team participants, and both must be at least 1",
  path: ["maxTeamSize"]
});

export const updateEventSchema = baseEventSchema.partial().refine(validateTeamLimits, {
  message: "Maximum team participants must be greater than or equal to minimum team participants, and both must be at least 1",
  path: ["maxTeamSize"]
});

export const addEventTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  responsibility: z.string().min(1).max(100),
});

export const updateEventTeamMemberSchema = z.object({
  responsibility: z.string().min(1).max(100),
});
