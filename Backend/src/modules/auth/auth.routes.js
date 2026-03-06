import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, signupSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema } from "./auth.schema.js";
import { login, signup } from "./auth.controller.simple.js";
import { forgotPassword, verifyResetOTP, resetPassword } from "./passwordReset.controller.js";
import { sendVerificationOTPController, verifyEmailController, resendVerificationOTPController } from "./emailVerification.controller.js";

const router = express.Router();

// Rate limiter for login (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for signup (prevent spam)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.SIGNUP_RATE_LIMIT || Math.min(50, parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20),
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for forgot password (prevent abuse)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.FORGOT_PASSWORD_RATE_LIMIT || (process.env.NODE_ENV === 'development' ? 20 : 10), // More reasonable limits
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});

// Rate limiter for OTP requests (prevent abuse)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.OTP_RATE_LIMIT || (process.env.NODE_ENV === 'development' ? 20 : 10), // More reasonable limits
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

// Auth routes with rate limiting
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);

// Email verification routes
router.post("/send-verification-otp", otpLimiter, sendVerificationOTPController);
router.post("/verify-email", verifyEmailController);
router.post("/resend-verification-otp", otpLimiter, resendVerificationOTPController);

// Password reset routes
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-otp", validate(verifyOTPSchema), verifyResetOTP);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
