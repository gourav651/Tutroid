import {
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
} from "./passwordReset.service.js";

/**
 * POST /auth/forgot-password
 * Request password reset - send OTP
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify-reset-otp
 * Verify OTP
 */
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyResetOTPService(email, otp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/reset-password
 * Reset password with OTP
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await resetPasswordService(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
