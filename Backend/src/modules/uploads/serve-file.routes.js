import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve uploaded files with proper headers
router.get("/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, "../../../uploads");
    const filePath = path.join(uploadsDir, filename);

    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Get file extension
    const ext = path.extname(filename).toLowerCase();

    // Set appropriate headers based on file type
    if (ext === ".pdf") {
      // For PDFs, set Content-Type to application/pdf and inline disposition
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${path.basename(filename)}"`);
    } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext)) {
      // For images, set appropriate Content-Type
      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "image/jpeg");
      res.setHeader("Content-Disposition", "inline");
    } else {
      // For other files, let browser decide
      res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filename)}"`);
    }

    // Enable caching for better performance
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error reading file",
        });
      }
    });
  } catch (error) {
    console.error("Serve file error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to serve file",
      });
    }
  }
});

export default router;
