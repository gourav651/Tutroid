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
    
    // For PDFs, we need to include the extension in the public_id
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    if (isPDF) {
      // For PDFs, use format parameter to ensure .pdf extension
      return {
        folder: "uploads",
        resource_type: "raw",
        public_id: `${timestamp}-${randomString}`,
        format: "pdf", // This ensures the file is saved with .pdf extension
        access_mode: "public", // Make sure the file is publicly accessible
        timeout: 60000,
      };
    } else {
      // For images, use standard image upload
      return {
        folder: "uploads",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
        transformation: [
          { quality: "auto:good", fetch_format: "auto" },
          { width: 1200, crop: "limit" },
        ],
        timeout: 60000,
      };
    }
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

// Simple upload endpoint - all authenticated users can upload
router.post(
  "/upload",
  authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]),
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

      // Determine file type
      const isPDF = req.file.mimetype === "application/pdf";
      
      let fileUrl;
      
      if (isPDF) {
        // For PDFs, use the direct path from Cloudinary
        // Cloudinary automatically handles raw files
        fileUrl = req.file.path;
        
        console.log("PDF upload:", {
          publicId: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype
        });
      } else {
        // For images, use the path directly
        fileUrl = req.file.path;
      }

      // Verify it's a valid Cloudinary URL
      if (!fileUrl || !fileUrl.startsWith('https://res.cloudinary.com/')) {
        console.error('Invalid Cloudinary URL:', fileUrl);
        return res.status(500).json({
          success: false,
          message: "Failed to get valid Cloudinary URL",
        });
      }
      
      console.log("Cloudinary upload successful:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        finalUrl: fileUrl,
        isPDF: isPDF
      });

      // Return response with file type information
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          publicId: req.file.filename,
          mimetype: req.file.mimetype,
          isPDF: isPDF,
          fileType: isPDF ? 'pdf' : 'image'
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
