// Checking authentication middleware

/**
 * NPM import
 */
const jwt = require('jsonwebtoken');

/**
 * Code
 */
const isAuth = (req, res, next) => {
  // Checking for Authorization in the req header
  const authHeader = req.get('Authorization');
  // If no Authorization, throw an error
  if (!authHeader) {
    const error = new Error('No authenticated');
    error.statusCode = 401;
    throw error;
  }

  // Getting the token
  const token = authHeader.split(' ')[1];
  let decodedToken;

  try {
    // Checking token validity
    decodedToken = jwt.verify(token, 'secret');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  // If token isn't valid, throw an error
  if (!decodedToken) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  // Exctracting information from the token
  req.userId = decodedToken.userId;

  // Moving the request forward
  next();
};

/**
 * Export
 */
module.exports = isAuth;
