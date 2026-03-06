import {
  sendVerificationOTP,
  verifyEmailOTP,
  resendVerificationOTP,
} from "./emailVerification.service.js";

/**
 * POST /auth/send-verification-otp
 * Send verification OTP to email
 */
export const sendVerificationOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await sendVerificationOTP(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify-email
 * Verify email with OTP
 */
export const verifyEmailController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyEmailOTP(email, otp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/resend-verification-otp
 * Resend verification OTP
 */
export const resendVerificationOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await resendVerificationOTP(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
