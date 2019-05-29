/**
 * Code
 */
const errorHandler = next => err => {
  const error = err;
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  // Use of next inside of a promise to reach the error middleware
  return next(error);
};

/**
 * Export
 */
module.exports = errorHandler;
