const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Multer File Size Error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File size exceeds maximum allowed limit', 400);
  }

  // Multer Specific / Custom File Filter Error
  if (err.name === 'MulterError' || (err.message && err.message.includes('Only PDF') || err.message.includes('Invalid image'))) {
    return errorResponse(res, err.message, 400);
  }

  // Postgres unique constraint violation
  if (err.code === '23505') {
    return errorResponse(res, 'A record with these unique details already exists', 409);
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced record does not exist', 400);
  }

  // Postgres invalid syntax or data type
  if (err.code === '22P02') {
    return errorResponse(res, 'Invalid parameter or data type supplied', 400);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal error occurred'
      : message,
    statusCode
  );
};

const notFoundHandler = (req, res) => {
  return errorResponse(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
