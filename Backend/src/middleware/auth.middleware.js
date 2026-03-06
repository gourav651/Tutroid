import jwt from "jsonwebtoken";

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

    // Debug logging
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "NOT SET");
    console.log("JWT_ISSUER:", process.env.JWT_ISSUER || "NOT SET");
    console.log("JWT_AUDIENCE:", process.env.JWT_AUDIENCE || "NOT SET");
    console.log("Token received:", token ? "YES" : "NO");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || "trainer-platform",
        audience: process.env.JWT_AUDIENCE || "trainer-users",
      });

      console.log("Token decoded successfully:", decoded.role, decoded.userId);

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      req.user = { ...decoded, id: decoded.userId };
      next();
    } catch (err) {
      console.log("JWT verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: err.message,
      });
    }
  };
};

// Shorthand for general authentication without role checking
export const authenticate = authMiddleware();
