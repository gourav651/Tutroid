import express from "express";
import https from "https";
import http from "http";
import { URL } from "url";

const router = express.Router();

// Proxy endpoint to download files from Cloudinary
router.get("/download", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL parameter is required",
      });
    }

    console.log("Proxying download for:", url);

    // Parse the URL
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    // Make request to Cloudinary
    const request = protocol.get(url, (cloudinaryRes) => {
      // Check if response is successful
      if (cloudinaryRes.statusCode !== 200) {
        console.error('Cloudinary response status:', cloudinaryRes.statusCode);
        return res.status(cloudinaryRes.statusCode).json({
          success: false,
          message: `Failed to fetch file: ${cloudinaryRes.statusCode}`,
        });
      }

      // Extract filename from URL
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1] || 'document.pdf';

      // Set headers to force download
      res.setHeader('Content-Type', cloudinaryRes.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (cloudinaryRes.headers['content-length']) {
        res.setHeader('Content-Length', cloudinaryRes.headers['content-length']);
      }

      // Pipe the response
      cloudinaryRes.pipe(res);
    });

    request.on('error', (error) => {
      console.error('Request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch file',
        });
      }
    });

    request.setTimeout(30000, () => {
      request.destroy();
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'Request timeout',
        });
      }
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download file',
      });
    }
  }
});

export default router;
