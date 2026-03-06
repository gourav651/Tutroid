import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createReport,
  updateReport,
  getReports,
  suspendUser,
  unsuspendUser
} from "./report.controller.js";
import {
  createReportSchema,
  updateReportSchema,
  getReportsSchema
} from "./report.schema.js";

const router = express.Router();

// Create report (All authenticated users)
router.post(
  "/",
  authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]),
  validate(createReportSchema),
  createReport
);

// Update report (Admin only)
router.patch(
  "/:reportId",
  authMiddleware(["ADMIN"]),
  validate(updateReportSchema),
  updateReport
);

// Get reports (Admin only)
router.get(
  "/",
  authMiddleware(["ADMIN"]),
  validate(getReportsSchema, "query"),
  getReports
);

// Suspend user (Admin only)
router.post(
  "/suspend/:userId",
  authMiddleware(["ADMIN"]),
  suspendUser
);

// Unsuspend user (Admin only)
router.post(
  "/unsuspend/:userId",
  authMiddleware(["ADMIN"]),
  unsuspendUser
);

export default router;
