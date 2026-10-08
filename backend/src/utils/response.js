/**
 * Standardized API response formatters
 */

const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200, pagination = null) => {
  const response = {
    success: true,
    message,
    data
  };
  if (pagination) {
    response.pagination = pagination;
  }
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
