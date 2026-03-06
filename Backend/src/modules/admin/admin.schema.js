import { z } from "zod";

// Admin Signup Schema
export const adminSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must not exceed 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must not exceed 50 characters"),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must not exceed 100 characters"),
});

// Admin Signup OTP Verification Schema
export const adminVerifySignupOTPSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be 6 digits"),
});

// Admin Resend Signup OTP Schema
export const adminResendSignupOTPSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const getUsersSchema = z.object({
  role: z.enum(["STUDENT", "TRAINER", "INSTITUTION", "ADMIN"]).optional(),
  isVerified: z.string().optional().transform(val => val === "true"),
  isBanned: z.string().optional().transform(val => val === "true"),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

export const verifyUserSchema = z.object({
  verified: z.union([z.boolean(), z.string()]).transform(val => val === true || val === "true").default(true),
});

export const banUserSchema = z.object({
  banned: z.union([z.boolean(), z.string()]).transform(val => val === true || val === "true").default(true),
  reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
});

export const reportActionSchema = z.object({
  action: z.enum(["RESOLVE", "REJECT", "BAN_USER"], {
    errorMap: () => ({ message: "Action must be RESOLVE, REJECT, or BAN_USER" }),
  }),
  resolutionNote: z.string().max(1000, "Resolution note must not exceed 1000 characters").optional(),
});

export const getReportsSchema = z.object({
  status: z.enum(["PENDING", "RESOLVED", "DISMISSED"]).optional(),
  targetType: z.enum(["TRAINER", "MATERIAL", "REVIEW"]).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export const reportIdParamSchema = z.object({
  id: z.string().uuid("Invalid report ID"),
});

// Admin Password Reset Schemas
export const adminForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const adminVerifyOTPSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
});

export const adminResetPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const transferAdminSchema = z.object({
  newAdminEmail: z.string().email("Invalid email address").trim().toLowerCase(),
  currentPassword: z.string().min(1, "Current password is required"),
});
