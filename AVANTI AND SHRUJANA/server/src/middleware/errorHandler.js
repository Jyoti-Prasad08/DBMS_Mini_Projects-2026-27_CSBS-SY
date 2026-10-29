/**
 * Centralized Error Handling Middleware
 * -------------------------------------------------------------
 * File: src/middleware/errorHandler.js
 * Purpose: Intercepts all unhandled errors or errors forwarded via next(err),
 *          formats them into a clean, teacher-friendly, uniform JSON response.
 * 
 * Response Format:
 *   {
 *     success: false,
 *     error: 'Descriptive error message',
 *     details?: ... (validation or database error details)
 *   }
 */

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let details = undefined;

  // 1. Mongoose Validation Error (e.g. required field missing, enum mismatch)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: Please check your input fields.';
    details = Object.values(err.errors).map((e) => e.message);
  }

  // 2. Mongoose Duplicate Key Error (E11000 - e.g. duplicate email, showId, etc.)
  else if (err.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `Duplicate Entry: A record with ${duplicatedField} '${duplicatedValue}' already exists.`;
    details = err.keyValue;
  }

  // 3. Mongoose CastError (e.g. malformed ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': value '${err.value}' is not valid.`;
  }

  // 4. Custom status set on error object
  else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Send formatted JSON error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
};
