// src/lib/validation/auth.ts
import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6).max(128),
  role: z.enum(["ADMIN", "USER"]),
});

export const loginSchema = z.object({
  username: z.string().min(3).max(40),
  password: z.string().min(6).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
