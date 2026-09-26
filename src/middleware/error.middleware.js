export const errorHandler = (err, req, res, next) => {
  // Log the full stack trace for development/debugging
  console.error("💥 Error Logged:", err.stack || err.message);

  // Determine the status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || 500;

  // Send a clean, uniform JSON response
  return res.status(statusCode).json({
    status: "error",
    message: err.message || "An unexpected server error occurred.",
    // Only show raw error details in development mode for security
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
