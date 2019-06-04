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
// Utils
const deleteFile = require('../utils/delete-file');

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
    // Checking user authentication status
    if (!req.isAuth) {
      const error = new Error('User is not authenticated');
      error.code = 401;
      throw error;
    }

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
      error.code = 422;
      throw error;
    }

    // Finding user by id
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    // Creating a new Post
    const newPost = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    // Saving the new post
    const createdPost = await newPost.save();

    // Add createdPost to user's posts
    user.posts.push(createdPost);
    // Saving updated user
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  posts: async ({ page }, req) => {
    // Checking user authentication status
    if (!req.isAuth) {
      const error = new Error('User is not authenticated');
      error.code = 401;
      throw error;
    }

    // If page is undefined set it to 1
    const currentPage = page || 1;
    // Defining number of post per page
    const POST_PER_PAGE = 2;

    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .populate('creator');

    return {
      posts: posts.map(post => ({
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      totalPosts,
    };
  },

  post: async ({ id }, req) => {
    // Checking user authentication status
    if (!req.isAuth) {
      const error = new Error('User is not authenticated');
      error.code = 401;
      throw error;
    }

    // Finding post by id
    const post = await Post.findById(id).populate('creator');
    // If no post founded, throw an error
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  updatePost: async ({ id, postInput }, req) => {
    // Checking user authentication status
    if (!req.isAuth) {
      const error = new Error('User is not authenticated');
      error.code = 401;
      throw error;
    }

    // Finding post by id
    const post = await Post.findById(id).populate('creator');
    // If no post founded, throw an error
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    // Checking if the post's creator is the logged in user
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }

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
      error.code = 422;
      throw error;
    }

    // Updating the post
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }
    // Saving the upadated post
    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async ({ id }, req) => {
    // Checking user authentication status
    if (!req.isAuth) {
      const error = new Error('User is not authenticated');
      error.code = 401;
      throw error;
    }

    // Finding post by id
    const post = await Post.findById(id);

    // If no post founded, throw an error
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    // Checking if the post's creator is the logged in user
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }

    // Deleting the post's image
    deleteFile(post.imageUrl);
    // Deleting the post
    await Post.findByIdAndRemove(id);
    // Finding the user
    const user = await User.findById(req.userId);
    // Deleting the post from user's posts
    user.posts.pull(id);
    // Saving the updated user
    await user.save();

    return true;
  },
};
