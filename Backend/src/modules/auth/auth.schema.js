import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(6, "Password too short"),
    role: z.enum(["TRAINER", "INSTITUTION", "STUDENT"]),
    phone: z.string().optional().or(z.literal("")),
    organization: z.string().optional().or(z.literal("")),
    agreeTerms: z.boolean().optional().or(z.literal("")),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(6),
  }),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const verifyOTPSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
