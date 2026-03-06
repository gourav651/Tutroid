export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Prisma database connection errors
  if (err.code === 'P1001') {
    message = "Database connection failed. Please try again later.";
  } else if (err.code === 'P2002') {
    message = "A record with this information already exists.";
  } else if (err.code === 'P2025') {
    message = "Record not found.";
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(`[ERROR] ${req.method} ${req.url}:`, {
      statusCode,
      message,
      code: err.code,
      stack: statusCode === 500 ? err.stack : undefined,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack, code: err.code }),
  });
};
