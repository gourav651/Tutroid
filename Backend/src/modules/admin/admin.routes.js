import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import {
  getUsers,
  verifyUser,
  banUser,
  getReports,
  takeReportAction,
  getAnalytics,
  transferAdmin,
  getVerificationRequests,
  reviewVerificationRequest,
  adminSignup,
  verifyAdminSignupOTP,
  resendAdminSignupOTP,
} from "./admin.controller.js";
import {
  adminForgotPassword,
  verifyAdminResetOTP,
  adminResetPassword,
} from "./adminPasswordReset.controller.js";
import {
  getUsersSchema,
  userIdParamSchema,
  verifyUserSchema,
  banUserSchema,
  reportActionSchema,
  getReportsSchema,
  reportIdParamSchema,
  adminForgotPasswordSchema,
  adminVerifyOTPSchema,
  adminResetPasswordSchema,
  transferAdminSchema,
  adminSignupSchema,
  adminVerifySignupOTPSchema,
  adminResendSignupOTPSchema,
} from "./admin.schema.js";

const router = express.Router();

/**
 * @route   POST /api/v1/admin/signup
 * @desc    Create new admin account
 * @access  Public
 */
router.post("/signup", validate(adminSignupSchema), adminSignup);

/**
 * @route   POST /api/v1/admin/verify-signup-otp
 * @desc    Verify admin signup OTP
 * @access  Public
 */
router.post("/verify-signup-otp", validate(adminVerifySignupOTPSchema), verifyAdminSignupOTP);

/**
 * @route   POST /api/v1/admin/resend-signup-otp
 * @desc    Resend admin signup OTP
 * @access  Public
 */
router.post("/resend-signup-otp", validate(adminResendSignupOTPSchema), resendAdminSignupOTP);

/**
 * @route   POST /api/v1/admin/forgot-password
 * @desc    Request password reset OTP for admin
 * @access  Public
 */
router.post("/forgot-password", validate(adminForgotPasswordSchema), adminForgotPassword);

/**
 * @route   POST /api/v1/admin/verify-reset-otp
 * @desc    Verify admin reset OTP
 * @access  Public
 */
router.post("/verify-reset-otp", validate(adminVerifyOTPSchema), verifyAdminResetOTP);

/**
 * @route   POST /api/v1/admin/reset-password
 * @desc    Reset admin password with OTP
 * @access  Public
 */
router.post("/reset-password", validate(adminResetPasswordSchema), adminResetPassword);

// All routes below require admin authentication
router.use(adminMiddleware);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin only
 */
router.get("/users", validate(getUsersSchema, "query"), getUsers);

/**
 * @route   PATCH /api/v1/admin/users/:id/verify
 * @desc    Verify or unverify a user
 * @access  Admin only
 */
router.patch(
  "/users/:id/verify",
  validate(userIdParamSchema, "params"),
  validate(verifyUserSchema),
  verifyUser
);

/**
 * @route   PATCH /api/v1/admin/users/:id/ban
 * @desc    Ban or unban a user
 * @access  Admin only
 */
router.patch(
  "/users/:id/ban",
  validate(userIdParamSchema, "params"),
  validate(banUserSchema),
  banUser
);

/**
 * @route   GET /api/v1/admin/reports
 * @desc    Get all reports with filtering and pagination
 * @access  Admin only
 */
router.get("/reports", validate(getReportsSchema, "query"), getReports);

/**
 * @route   PATCH /api/v1/admin/reports/:id/action
 * @desc    Take action on a report (resolve, reject, ban user)
 * @access  Admin only
 */
router.patch(
  "/reports/:id/action",
  validate(reportIdParamSchema, "params"),
  validate(reportActionSchema),
  takeReportAction
);

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get system analytics overview
 * @access  Admin only
 */
router.get("/analytics", getAnalytics);

/**
 * @route   POST /api/v1/admin/transfer-admin
 * @desc    Transfer admin privileges to another user
 * @access  Admin only
 */
router.post("/transfer-admin", validate(transferAdminSchema), transferAdmin);

/**
 * @route   GET /api/v1/admin/verification-requests
 * @desc    Get all verification requests with filtering and pagination
 * @access  Admin only
 */
router.get("/verification-requests", getVerificationRequests);

/**
 * @route   PATCH /api/v1/admin/verification-requests/:id/review
 * @desc    Approve or reject a verification request
 * @access  Admin only
 */
router.patch("/verification-requests/:id/review", reviewVerificationRequest);

export default router;
