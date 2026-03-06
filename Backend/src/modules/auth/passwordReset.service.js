import crypto from "crypto";
import bcrypt from "bcrypt";
import client from "../../db.js";
import { AppError } from "../../utils/AppError.js";
import { sendOTPEmail, sendPasswordResetConfirmation } from "../../services/email.service.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 4; // Reduced from 10 to 4 for faster hashing
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
 * Request password reset - send OTP
 */
export const forgotPasswordService = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user with timeout (don't reveal if email exists or not)
  const user = await Promise.race([
    client.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true } // Only select needed fields for speed
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database lookup timeout')), 5000)
    )
  ]);

  // Always return generic message (prevent user enumeration)
  if (!user) {
    return {
      success: true,
      message: "If an account exists with this email, you will receive an OTP shortly.",
    };
  }

  // Generate OTP
  const otp = generateOTP();
  
  // Calculate expiry time and hash OTP
  const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const hashedOTP = await hashOTP(otp);

  // Update database first (fast operation)
  await Promise.race([
    client.user.update({
      where: { email: normalizedEmail },
      data: {
        resetPasswordOTP: hashedOTP,
        resetPasswordOTPExpires: expiryTime,
      },
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database update timeout')), 5000)
    )
  ]);

  // Send email in background - don't wait for it
  sendOTPEmail(normalizedEmail, otp).catch(err => {
    console.error('[ForgotPassword] Email send failed:', err.message);
  });

  return {
    success: true,
    message: "If an account exists with this email, you will receive an OTP shortly.",
  };
};

/**
 * Verify OTP
 */
export const verifyResetOTPService = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Fetch only needed fields for speed
  const user = await client.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      resetPasswordOTP: true,
      resetPasswordOTPExpires: true
    }
  });

  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
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
 * Reset password with OTP
 */
export const resetPasswordService = async (email, otp, newPassword) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password strength
  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters long", 400);
  }

  const user = await client.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
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

  return {
    success: true,
    message: "Password reset successful. You can now log in with your new password.",
  };
};
