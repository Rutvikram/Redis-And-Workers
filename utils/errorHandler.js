// utils/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error("🔥 Error caught:", err);

  // For operational errors (expected, safe to show to user)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }

  // For programming or unknown errors
  return res.status(500).json({
    success: false,
    message: "Internal server error. Please try again later."
  });
}
