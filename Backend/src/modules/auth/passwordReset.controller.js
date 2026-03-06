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
    
    // Add timeout to prevent gateway timeout
    const result = await Promise.race([
      forgotPasswordService(email),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Forgot password service timeout')), 10000) // 10 second timeout
      )
    ]);
    
    res.status(200).json(result);
  } catch (error) {
    // Handle timeout errors specifically
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: "Request is taking longer than expected. Please try again.",
      });
    }
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
