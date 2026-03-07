import jwt from "jsonwebtoken";

// Simple token cache to avoid repeated JWT verification
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (allowedRoles.length && !allowedRoles.includes(cached.decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      req.user = { ...cached.decoded, id: cached.decoded.userId };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || "trainer-platform",
        audience: process.env.JWT_AUDIENCE || "trainer-users",
      });

      // Cache the decoded token
      tokenCache.set(token, {
        decoded,
        timestamp: Date.now()
      });

      // Clean old cache entries periodically
      if (tokenCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of tokenCache.entries()) {
          if (now - value.timestamp > CACHE_TTL) {
            tokenCache.delete(key);
          }
        }
      }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      req.user = { ...decoded, id: decoded.userId };
      next();
    } catch (err) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.log("JWT verification failed:", err.message);
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  };
};

// Shorthand for general authentication without role checking
export const authenticate = authMiddleware();
