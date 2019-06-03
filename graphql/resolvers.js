/* eslint-disable no-unused-vars */
/**
 * NPM import
 */
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * Local import
 */
// Models
const User = require('../models/user');

/**
 * Code
 */
module.exports = {
  createUser: async ({ userInput }, req) => {
    // const email = args.userInput.email;

    const errors = [];
    // Email validation
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }
    // Password validation
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password is too short' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.ode = 422;
      throw error;
    }

    // Finding if a user already exists with this email
    const existingUser = await User.findOne({ email: userInput.email });
    // If a user already exists, throw an error
    if (existingUser) {
      const error = new Error('User already exists');
      throw error;
    }
    // Encrypting password
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    // Creating a new user
    const newUser = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    // Saving the new user
    const createdUser = await newUser.save();
    // Returning the User object
    // ._doc delete all the meta data mongoose creates
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
};
