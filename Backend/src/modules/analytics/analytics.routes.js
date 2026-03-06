import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getUserAnalytics } from "./analytics.controller.js";

const router = express.Router();

// Get analytics for current user
router.get("/", authMiddleware(), getUserAnalytics);

// Get analytics for specific user (public)
router.get("/:userId", authMiddleware(), getUserAnalytics);

export default router;
