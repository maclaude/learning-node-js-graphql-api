// Feed validation

/**
 * NPM import
 */
const { body } = require('express-validator/check');

/**
 * Code
 */
exports.postPost = [
  body('title')
    .trim()
    .isLength({ min: 5 }),
  body('content')
    .trim()
    .isLength({ min: 10 }),
];

exports.putPost = [
  body('title')
    .trim()
    .isLength({ min: 5 }),
  body('content')
    .trim()
    .isLength({ min: 10 }),
];
