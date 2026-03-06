import express from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import cloudinary from "../../config/cloudinary.js";

const router = express.Router();

// Configure Cloudinary storage for simple uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file type
    const isPDF = file.mimetype === "application/pdf";
    
    return {
      folder: "uploads",
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
      resource_type: isPDF ? "raw" : "auto", // Use 'raw' for PDFs to preserve them
      transformation: isPDF ? [] : [{ quality: "auto" }], // No transformation for PDFs
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`, // Custom filename
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log('File uploaded to Cloudinary:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        resourceType: req.file.resource_type,
        format: req.file.format
      });

      // Always use Cloudinary secure HTTPS URL
      // req.file.path from Cloudinary is already the full HTTPS URL
      const fileUrl = req.file.path;

      // Verify it's a valid Cloudinary URL
      if (!fileUrl || !fileUrl.startsWith('https://res.cloudinary.com/')) {
        console.error('Invalid Cloudinary URL:', fileUrl);
        return res.status(500).json({
          success: false,
          message: "Failed to get valid Cloudinary URL",
        });
      }

      console.log('Returning Cloudinary URL:', fileUrl);

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl, // Full Cloudinary HTTPS URL
          publicId: req.file.filename, // Cloudinary public ID for reference
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload file",
      });
    }
  },
);

export default router;
