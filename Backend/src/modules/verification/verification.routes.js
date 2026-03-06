import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requestVerification,
  getVerificationStatus,
  cancelVerificationRequest
} from "./verification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/verification/request
 * @desc    Request verification
 * @access  Private (Trainer/Institution only)
 */
router.post("/request", requestVerification);

/**
 * @route   GET /api/v1/verification/status
 * @desc    Get verification request status
 * @access  Private
 */
router.get("/status", getVerificationStatus);

/**
 * @route   DELETE /api/v1/verification/request
 * @desc    Cancel pending verification request
 * @access  Private
 */
router.delete("/request", cancelVerificationRequest);

export default router;
