import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { createReview } from "./review.controllers.js";
import { createReviewSchema } from "./review.schema.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  validate(createReviewSchema),
  createReview,
);

export default router;
