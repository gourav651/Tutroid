import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  applyRequest,
  respondToRequest,
  markComplete,
} from "./request.controller.js";
import { applyRequestSchema, respondRequestSchema } from "./request.schema.js";

const router = express.Router();

// Apply (both roles allowed)
router.post(
  "/",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  validate(applyRequestSchema),
  applyRequest,
);

// Respond (only involved party)
router.patch(
  "/:id/respond",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  validate(respondRequestSchema),
  respondToRequest,
);

// Mark complete
router.patch(
  "/:id/complete",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  markComplete,
);

export default router;
