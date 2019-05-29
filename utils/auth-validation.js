/* eslint-disable no-unused-vars */
// Auth validation

/**
 * NPM import
 */
const { body } = require('express-validator/check');

/**
 * Local import
 */
// Models
const User = require('../models/user');

/**
 * Code
 */
exports.signup = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (userDoc) {
          const error = 'Email address already exists';
          return Promise.reject(error);
        }
        return true;
      });
    }),
  body('password')
    .trim()
    .isLength({ min: 5 }),
  body('name')
    .trim()
    .not()
    .isEmpty(),
];
