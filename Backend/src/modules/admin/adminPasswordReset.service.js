import crypto from "crypto";
import bcrypt from "bcrypt";
import client from "../../db.js";
import { AppError } from "../../utils/AppError.js";
import { sendOTPEmail, sendPasswordResetConfirmation } from "../../services/email.service.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 4;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP for secure storage
 */
const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, SALT_ROUNDS);
};

/**
 * Verify OTP against hash
 */
const verifyOTP = async (otp, hashedOTP) => {
  if (!hashedOTP) return false;
  return await bcrypt.compare(otp, hashedOTP);
};

/**
 * Request admin password reset - send OTP
 * Only works for ADMIN role users
 */
export const adminForgotPasswordService = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user and verify they are an admin
  const user = await client.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, role: true }
  });

  // Return with exists flag so UI can show appropriate message
  if (!user || user.role !== "ADMIN") {
    return {
      success: true,
      exists: false,
      message: "No admin account found with this email address.",
    };
  }

  // Generate OTP
  const otp = generateOTP();
  
  // Parallel execution: Hash OTP and calculate expiry time simultaneously
  const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const hashedOTP = await hashOTP(otp);

  // Update database and send email in parallel (non-blocking)
  await Promise.all([
    client.user.update({
      where: { email: normalizedEmail },
      data: {
        resetPasswordOTP: hashedOTP,
        resetPasswordOTPExpires: expiryTime,
      },
    }),
    // Send email without waiting (fire and forget)
    sendOTPEmail(normalizedEmail, otp).catch(err => {
      console.error('[AdminForgotPassword] Email send failed:', err.message);
    })
  ]);

  console.log(`[Admin Password Reset] OTP sent to admin: ${normalizedEmail}`);

  return {
    success: true,
    exists: true,
    message: "OTP sent to your email address. Please check your inbox.",
  };
};

/**
 * Verify admin OTP
 */
export const verifyAdminResetOTPService = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Fetch user and verify admin role
  const user = await client.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      role: true,
      resetPasswordOTP: true,
      resetPasswordOTPExpires: true
    }
  });

  if (!user || user.role !== "ADMIN") {
    throw new AppError("Invalid or expired OTP", 400);
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  // Check if OTP expired (fast check before expensive bcrypt)
  if (new Date() > user.resetPasswordOTPExpires) {
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  // Verify OTP
  const isValidOTP = await verifyOTP(otp, user.resetPasswordOTP);
  if (!isValidOTP) {
    throw new AppError("Invalid OTP", 400);
  }

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

/**
 * Reset admin password with OTP
 */
export const adminResetPasswordService = async (email, otp, newPassword) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password strength
  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters long", 400);
  }

  // Fetch user and verify admin role
  const user = await client.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      role: true,
      resetPasswordOTP: true,
      resetPasswordOTPExpires: true
    }
  });

  if (!user || user.role !== "ADMIN") {
    throw new AppError("Invalid or expired OTP", 400);
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  // Check if OTP expired
  if (new Date() > user.resetPasswordOTPExpires) {
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  // Verify OTP again
  const isValidOTP = await verifyOTP(otp, user.resetPasswordOTP);
  if (!isValidOTP) {
    throw new AppError("Invalid OTP", 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear OTP fields
  await client.user.update({
    where: { email: normalizedEmail },
    data: {
      password: hashedPassword,
      resetPasswordOTP: null,
      resetPasswordOTPExpires: null,
    },
  });

  // Send confirmation email (non-blocking)
  sendPasswordResetConfirmation(normalizedEmail).catch(console.error);

  console.log(`[Admin Password Reset] Password reset successful for admin: ${normalizedEmail}`);

  return {
    success: true,
    message: "Password reset successful. You can now log in with your new password.",
  };
};
