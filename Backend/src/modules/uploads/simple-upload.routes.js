import express from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import cloudinary from "../../config/cloudinary.js";

const router = express.Router();

// Configure Cloudinary storage for simple uploads with optimizations
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {

    const isPDF = file.mimetype === "application/pdf";
    
    return {
      folder: "uploads",
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
      resource_type: isPDF ? "raw" : "image", // Explicitly set to 'image' for images

      transformation: isPDF ? [] : [
        { quality: "auto:good", fetch_format: "auto" },
        { width: 1200, crop: "limit" },
      ],
      // Don't set public_id, let Cloudinary generate it
      timeout: 60000, // 60 second timeout for Cloudinary
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Back to 5MB for better user experience
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"), false);
    }
  },
});

// Simple upload endpoint - trainers and institutions only
router.post(
  "/upload",
  authMiddleware(["TRAINER", "INSTITUTION"]),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB.",
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Always use Cloudinary secure HTTPS URL
      const fileUrl = req.file.path;

      // Verify it's a valid Cloudinary URL
      if (!fileUrl || !fileUrl.startsWith('https://res.cloudinary.com/')) {
        console.error('Invalid Cloudinary URL:', fileUrl);
        return res.status(500).json({
          success: false,
          message: "Failed to get valid Cloudinary URL",
        });
      }

      // Return minimal response for faster processing
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          publicId: req.file.filename,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to upload file",
        });
      }
    }
  },
);

export default router;
