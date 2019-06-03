/* eslint-disable no-unused-vars */
/**
 * NPM import
 */
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

/**
 * Local import
 */
// Models
const User = require('../models/user');
const Post = require('../models/post');

/**
 * Code
 */
module.exports = {
  createUser: async ({ userInput }, req) => {
    // const email = args.userInput.email;

    /**
     * Validation
     */
    const errors = [];
    // Email
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }
    // Password
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password is too short' });
    }
    // If errors, throw an error
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

  login: async ({ email, password }) => {
    // Finding the user
    const user = await User.findOne({ email });
    // If no user exists, throw an error
    if (!user) {
      const error = new Error('User not found');
      error.code = 401;
      throw error;
    }
    // Comparing passwords
    const passwordsMatched = await bcrypt.compare(password, user.password);
    // If passwords don't match, throw an error
    if (!passwordsMatched) {
      const error = new Error('Password is incorrect');
      error.code = 401;
      throw error;
    }
    // Generating a token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'secret',
      { expiresIn: '1h' }
    );
    // Return a token & userId
    return { token, userId: user._id.toString() };
  },

  createPost: async ({ postInput }, req) => {
    /**
     * Validation
     */
    const errors = [];
    // Title
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid' });
    }
    // Content
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid' });
    }
    // If errors, throw an error
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.ode = 422;
      throw error;
    }

    // Creating a new Post
    const newPost = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
    });
    // Saving the new post
    const createdPost = await newPost.save();
    // @TODO add post to user's posts

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
};
