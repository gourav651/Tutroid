import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  reviewPost,
  updateReview,
  deleteReview,
  getPostReviews,
  getMyPosts,
} from "./posts.controller.js";

import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createPostSchema,
  updatePostSchema,
  getPostsSchema,
} from "./posts.schema.js";

const router = express.Router();

// Protected routes (must come BEFORE /:postId to avoid route conflict)
router.get(
  "/my-posts",
  authMiddleware(), // Allow all authenticated users
  validate(getPostsSchema, "query"),
  getMyPosts,
);

// Public routes
router.get("/", validate(getPostsSchema, "query"), getPosts);
router.get("/:postId", getPostById);
router.get("/:postId/reviews", getPostReviews);

// Protected routes - trainers and institutions only
router.post(
  "/",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  // Removed validation middleware for faster post creation
  createPost,
);
router.put(
  "/:postId",
  authMiddleware(["TRAINER", "INSTITUTION", "STUDENT", "ADMIN"]),
  validate(updatePostSchema, "body"),
  updatePost,
);
router.delete("/:postId", authMiddleware(["TRAINER", "INSTITUTION", "STUDENT", "ADMIN"]), deletePost);

// Review routes
router.post("/:postId/review", authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]), reviewPost);
router.put("/review/:reviewId", authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]), updateReview);
router.delete("/review/:reviewId", authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]), deleteReview);

export default router;
