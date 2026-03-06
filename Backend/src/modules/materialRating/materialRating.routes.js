import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createMaterialRating,
  updateMaterialRating,
  deleteMaterialRating,
  getMaterialRatings,
  getStudentRatings
} from "./materialRating.controller.js";
import {
  createMaterialRatingSchema,
  updateMaterialRatingSchema,
  getMaterialRatingsSchema
} from "./materialRating.schema.js";

const router = express.Router();

// Create material rating (Student Only)
router.post(
  "/",
  authMiddleware(["STUDENT"]),
  validate(createMaterialRatingSchema),
  createMaterialRating
);

// Update material rating (Student Only)
router.patch(
  "/:ratingId",
  authMiddleware(["STUDENT"]),
  validate(updateMaterialRatingSchema),
  updateMaterialRating
);

// Delete material rating (Student Only)
router.delete(
  "/:ratingId",
  authMiddleware(["STUDENT"]),
  deleteMaterialRating
);

// Get material ratings (Public)
router.get(
  "/material/:materialId",
  validate(getMaterialRatingsSchema, "query"),
  getMaterialRatings
);

// Get student's ratings (Student Only)
router.get(
  "/my-ratings",
  authMiddleware(["STUDENT"]),
  getStudentRatings
);

export default router;
