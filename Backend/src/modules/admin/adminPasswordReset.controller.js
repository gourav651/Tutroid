import {
  adminForgotPasswordService,
  verifyAdminResetOTPService,
  adminResetPasswordService,
} from "./adminPasswordReset.service.js";

/**
 * POST /admin/forgot-password
 * Request admin password reset OTP
 */
export const adminForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await adminForgotPasswordService(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/verify-reset-otp
 * Verify admin reset OTP
 */
export const verifyAdminResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyAdminResetOTPService(email, otp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/reset-password
 * Reset admin password with OTP
 */
export const adminResetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await adminResetPasswordService(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
