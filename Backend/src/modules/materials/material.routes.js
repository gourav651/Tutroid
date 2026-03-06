import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { upload } from "../../config/multer.js";
import { uploadMaterialSchema } from "./material.schema.js";
import rateLimit from "express-rate-limit";

import { uploadMaterial, getTrainerMaterials } from "./material.controller.js";

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many uploads. Please try again later.",
  },
});

// Upload (Trainer and Institution Only)
router.post(
  "/upload",
  uploadLimiter,
  authMiddleware(["TRAINER", "INSTITUTION"]),
  upload.single("file"), // ✅ FIRST parse form-data
  (req, res, next) => {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);
    console.log("REQ USER:", req.user);
    const result = uploadMaterialSchema.safeParse(req.body);
    if (!result.success) {
      console.log("VALIDATION ERRORS:", result.error.errors);
      return res.status(400).json({
        success: false,
        errors: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  },
  uploadMaterial,
);

// Public fetch materials of a trainer
router.get("/:trainerId", getTrainerMaterials);

export default router;
