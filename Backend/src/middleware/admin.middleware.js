import { authMiddleware } from "./auth.middleware.js";

/**
 * Middleware to restrict access to admin users only
 * Reuses the existing authMiddleware with ADMIN role check
 */
export const adminMiddleware = authMiddleware(["ADMIN"]);

/**
 * Alternative: Standalone admin middleware with detailed error messages
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};
