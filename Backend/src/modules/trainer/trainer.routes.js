import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createTrainerProfile,
  getMyProfile,
  updateMyProfile,
  searchTrainers,
  getMyReviews,
} from "./trainer.controller.js";
import {
  createTrainerProfileSchema,
  trainerSearchSchema,
} from "./trainer.schema.js";
import { getPublicTrainerProfile } from "./publicProfileController.js";

const router = express.Router();

// Search limiter
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many search requests. Please try again later.",
  },
});

// Public trainer search
router.get(
  "/search",
  searchLimiter,
  validate(trainerSearchSchema, "query"),
  searchTrainers,
);

// Create trainer profile
router.post(
  "/profile",
  authMiddleware(["TRAINER"]),
  validate(createTrainerProfileSchema),
  createTrainerProfile,
);

// Get own profile
router.get("/profile", authMiddleware(["TRAINER"]), getMyProfile);

// Get own reviews
router.get("/reviews", authMiddleware(["TRAINER"]), getMyReviews);

// Update own profile
router.put(
  "/profile",
  authMiddleware(["TRAINER"]),
  updateMyProfile,
);

// Public trainer profile (keep LAST)
router.get("/:id", getPublicTrainerProfile);

export default router;
