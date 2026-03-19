import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
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
import serveFileRoutes from "./modules/uploads/serve-file.routes.js";
import downloadProxyRoutes from "./modules/uploads/download-proxy.routes.js";
import networkingRoutes from "./modules/networking/networking.routes.js";
import messagingRoutes from "./modules/messaging/messaging.routes.js";
import userRoutes from "./modules/auth/user.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import discoveryRoutes from "./modules/discovery/discovery.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import debugRoutes from "./modules/debug/debug.routes.js";
import verificationRoutes from "./modules/verification/verification.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { requestTimeout } from "./middleware/timeout.middleware.js";
import { cacheMiddleware } from "./middleware/cache.middleware.js";

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));

app.use(requestTimeout(30000));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://tutroid.vercel.app",
      "http://tutroid.com",
      "https://tutroid.com",
      "http://www.tutroid.com",
      "https://www.tutroid.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 500,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  validate: { trustProxy: false },
});
app.use(limiter);

app.use(express.json({ limit: "50kb" }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"));
}

app.use(auditMiddleware);

app.get("/health", (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.get("/api/v1/auth/health", (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json({
    status: "healthy",
    service: "auth",
    timestamp: new Date().toISOString(),
  });
});

app.use("/uploads", serveFileRoutes);
app.use("/api/v1/proxy", downloadProxyRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", cacheMiddleware(60), postRoutes);
app.use("/api/v1/trainer", cacheMiddleware(120), trainerRoutes);
app.use("/api/v1/institution", cacheMiddleware(120), institutionRouter);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/material", materialRoutes);
app.use("/api/v1/material-rating", materialRatingRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/upload", simpleUploadRoutes);
app.use("/api/v1/networking", networkingRoutes);
app.use("/api/v1/messaging", messagingRoutes);
app.use("/api/v1/users", cacheMiddleware(180), userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/discovery", cacheMiddleware(300), discoveryRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/analytics", cacheMiddleware(120), analyticsRoutes);
app.use("/api/v1/debug", debugRoutes);
app.use("/api/v1/verification", verificationRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use("/api/posts", postRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/trainer", trainerRoutes);
  app.use("/api/institution", institutionRouter);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/material", materialRoutes);
  app.use("/api/material-rating", materialRatingRoutes);
  app.use("/api/reports", reportRoutes);
}

app.use(errorHandler);

export default app;
