import { z } from "zod";
import { EvaluationStatus } from "@prisma/client";

export const createEvaluationSchema = z.object({
  submissionId: z.string().uuid(),
  judgeId: z.string().uuid().optional(),
  score: z.number().min(0).optional(),
  feedback: z.string().optional(),
  status: z.nativeEnum(EvaluationStatus).optional(),
});

export const updateEvaluationSchema = z.object({
  submissionId: z.string().uuid().optional(),
  score: z.number().min(0).optional(),
  scores: z.record(z.string(), z.number()).optional(),
  feedback: z.string().optional(),
  status: z.nativeEnum(EvaluationStatus).optional(),
  recommendation: z.string().optional(),
});
