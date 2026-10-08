import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{10}$/.test(val.trim()),
      "Mobile number must contain exactly 10 digits"
    ),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
});

export const verifyMfaSchema = z.object({
  challengeToken: z.string(),
  code: z.string().min(6),
});
