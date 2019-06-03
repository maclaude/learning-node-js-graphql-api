// Checking authentication middleware

/**
 * NPM import
 */
const jwt = require('jsonwebtoken');

/**
 * Code
 */
const auth = (req, res, next) => {
  // Checking for Authorization in the req header
  const authHeader = req.get('Authorization');
  // If no Authorization, set isAuth to false
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  // Getting the token
  const token = authHeader.split(' ')[1];
  let decodedToken;

  try {
    // Checking token validity
    decodedToken = jwt.verify(token, 'secret');
  } catch (err) {
    req.isAuth = false;
    return next();
  }

  // If token isn't valid, set isAuth to false
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  // Exctracting information from the token
  req.userId = decodedToken.userId;
  // Setting isAuth to true
  req.isAuth = true;

  // Moving the request forward
  return next();
};

/**
 * Export
 */
module.exports = auth;
