import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import postRoutes from "./modules/posts/posts.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import trainerRoutes from "./modules/trainer/trainer.routes.js";
import institutionRouter from "./modules/institution/institution.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import requestRoutes from "./modules/request/request.routes.js";
import materialRoutes from "./modules/materials/material.routes.js";
import materialRatingRoutes from "./modules/materialRating/materialRating.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import simpleUploadRoutes from "./modules/uploads/simple-upload.routes.js";
import networkingRoutes from "./modules/networking/networking.routes.js";
import messagingRoutes from "./modules/messaging/messaging.routes.js";
import userRoutes from "./modules/auth/user.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import discoveryRoutes from "./modules/discovery/discovery.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import verificationRoutes from "./modules/verification/verification.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { requestTimeout } from "./middleware/timeout.middleware.js";

const app = express();

console.log("APP FILE LOADED - CORS FIXED");

/* ================= SECURITY ================= */

// Request timeout middleware (must be early in the chain)
app.use(requestTimeout(30000)); // 30 second timeout

// CORS must be before helmet
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Basic security headers (configured to work with CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Global API rate limiter (generous for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500, // 500 requests per 15 minutes (increased from 100)
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});
app.use(limiter);

// JSON body limit protection
app.use(express.json({ limit: "100kb" }));

// Logging
app.use(morgan("dev"));

// Audit logging (after authentication)
app.use(auditMiddleware);

// Note: Static file serving for /materials removed - now using Cloudinary CDN

app.use("/api/posts", postRoutes); // legacy support

/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

/* ================= ROUTES ================= */

// API v1 routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/trainer", trainerRoutes);
app.use("/api/v1/institution", institutionRouter);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/material", materialRoutes);
app.use("/api/v1/material-rating", materialRatingRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/upload", simpleUploadRoutes);
app.use("/api/v1/networking", networkingRoutes);
app.use("/api/v1/messaging", messagingRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/discovery", discoveryRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/verification", verificationRoutes);

// Legacy routes (backward compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/institution", institutionRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/material", materialRoutes);
app.use("/api/material-rating", materialRatingRoutes);
app.use("/api/reports", reportRoutes);

/* ================= SERVE FRONTEND (Production) ================= */

if (process.env.NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientBuild));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

/* ================= ERROR HANDLER ================= */

app.use(errorHandler);

export default app;
