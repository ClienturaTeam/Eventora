import { z } from "zod";

export const baseProposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  expectedParticipants: z.number().int().nonnegative("Must be a non-negative integer").optional(),
  estimatedBudget: z.number().nonnegative("Must be a non-negative number").optional(),
  requiredManpower: z.number().int().nonnegative("Must be a non-negative integer").optional(),
  estimatedWorkingHours: z.number().nonnegative("Must be a non-negative number").optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  requirements: z.string().optional(),
});

export const createProposalSchema = baseProposalSchema.refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

export const updateProposalSchema = baseProposalSchema.partial().refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

export const managerReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  comment: z.string().optional()
});

export const principalReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().optional()
});

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rules: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  price: z.number().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  registrationType: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
  minTeamSize: z.number().int().min(1).optional().nullable(),
  maxTeamSize: z.number().int().min(1).optional().nullable(),
  registrationStart: z.string().datetime().optional().nullable(),
  registrationEnd: z.string().datetime().optional().nullable(),
  facultyCoordinatorId: z.string().uuid().optional().nullable(),
  studentCoordinatorId: z.string().uuid().optional().nullable(),
}).refine(data => new Date(data.endTime) >= new Date(data.startTime), {
  message: "End time must be after or equal to start time",
  path: ["endTime"]
});
