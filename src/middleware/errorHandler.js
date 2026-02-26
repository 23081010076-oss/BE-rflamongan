export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Duplicate entry",
      field: err.meta?.target,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Record not found",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};
