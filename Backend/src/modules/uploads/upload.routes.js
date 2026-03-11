import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Ensure extension is always included
    const filename = file.fieldname + "-" + uniqueSuffix + ext;
    console.log("Saving file as:", filename, "Original:", file.originalname, "Extension:", ext);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"), false);
    }
  },
});

// Upload endpoint - all authenticated users can upload profile images
router.post(
  "/upload",
  authMiddleware(["TRAINER", "INSTITUTION", "STUDENT"]),
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log("File uploaded:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Determine if it's a PDF
      const isPDF = req.file.mimetype === "application/pdf" || 
                    req.file.originalname.toLowerCase().endsWith('.pdf') ||
                    req.file.filename.toLowerCase().endsWith('.pdf');

      console.log("File type detection:", { isPDF, mimetype: req.file.mimetype, filename: req.file.filename });

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl,
          isPDF: isPDF,
          fileType: isPDF ? 'pdf' : (req.file.mimetype.startsWith('image/') ? 'image' : 'file')
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload file",
      });
    }
  },
);

export default router;
