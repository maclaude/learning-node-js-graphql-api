// Feed controller

/**
 * NPM import
 */
const { validationResult } = require('express-validator/check');

/**
 * Local import
 */
// Models
const Post = require('../models/post');
const User = require('../models/user');
// Utils
const errorHandler = require('../utils/error-handler');
const deleteFile = require('../utils/delete-file');

/**
 * Code
 */
exports.getPosts = async (req, res, next) => {
  // if page is undefined set value to 1
  const currentPage = req.query.page || 1;
  const POST_PER_PAGE = 2;

  try {
    // Total count of posts
    const totalItems = await Post.find().countDocuments();

    // Fetching posts
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      // Skipping posts of previous pages
      .skip((currentPage - 1) * POST_PER_PAGE)
      // Limit of posts we want to retrieve
      .limit(POST_PER_PAGE);

    // Sending the response to the client
    res.status(200).json({ message: 'Posts fetched', posts, totalItems });
  } catch (err) {
    errorHandler(next);
  }
};

exports.getPost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    // Fetching current post
    const post = await Post.findById(postId);

    // Throw an error if nothing is retrieved
    if (!post) {
      const error = new Error('Could not find the requested post.');
      error.statusCode = 404;
      // An error thrown in a then, will reach the catch as an argument
      throw error;
    }

    // Sending the response to the client
    res.status(200).json({ message: 'Post fetched', post });
  } catch (err) {
    errorHandler(next);
  }
};

exports.postPost = async (req, res, next) => {
  // Request validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  // Throw an error if nothing is retrieved
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  const imageUrl = req.file.path;

  // Creating the new post
  const newPost = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId,
  });

  try {
    // Saving the new post
    await newPost.save();
    // Fetching user
    const user = await User.findById(req.userId);
    // Adding the new post to the user's post array
    user.posts.push(newPost);
    // Saving the updated user
    await user.save();

    // Sending the response to the client who created the post
    res.status(201).json({
      message: 'Post created',
      post: newPost,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    errorHandler(next);
  }
};

exports.putPost = async (req, res, next) => {
  const { postId } = req.params;

  // Request validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { title, content } = req.body;
  let { image: imageUrl } = req.body;

  if (req.file) {
    imageUrl = req.file.path;
  }
  // Throw an error if no image is provided
  if (!imageUrl) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }

  try {
    // Fetching current post
    const post = await Post.findById(postId).populate('creator');

    // Throw an error if nothing is retrieved
    if (!post) {
      const error = new Error('Could not find the requested post.');
      error.statusCode = 404;
      throw error;
    }

    // Checking if the creator of the post is the logged in user
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized to update the post');
      error.statusCode = 403;
      throw error;
    }

    // Deleting the image if it's been updated
    if (imageUrl !== post.imageUrl) {
      deleteFile(post.imageUrl);
    }

    // Updating the post
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    // Saving the updated post
    const response = await post.save();

    // Sending the response to the client
    res.status(200).json({ message: 'Post updated', post: response });
  } catch (err) {
    errorHandler(next);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    // Fetching current post
    const post = await Post.findById(postId);

    // Throw an error if nothing is retrieved
    if (!post) {
      const error = new Error('Could not find the requested post.');
      error.statusCode = 404;
      throw error;
    }

    // Checking if the creator of the post is the logged in user
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized to update the post');
      error.statusCode = 403;
      throw error;
    }

    // Deleting post image
    deleteFile(post.imageUrl);
    // Deleting post from database
    await Post.findByIdAndRemove(postId);

    // Finding the user creator of the post
    const user = await User.findById(req.userId);

    // Removing the post id relation with this user
    user.posts.pull(postId);
    await user.save();

    // Sending the response to the client
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    errorHandler(next);
  }
};

exports.getUserStatus = async (req, res, next) => {
  const { userId } = req;
  try {
    // Finding current user
    const user = await User.findById({ _id: userId });

    // Throw an error if nothing is retrieved
    if (!user) {
      const error = new Error('No user found with this userId.');
      error.statusCode = 401;
      throw error;
    }

    // Sending the response to the client
    res.status(200).json({ status: user.status });
  } catch (err) {
    errorHandler(next);
  }
};

exports.patchUserStatus = async (req, res, next) => {
  const { userId } = req;
  const { status: newStatus } = req.body;

  try {
    // Finding current user
    const user = await User.findById({ _id: userId });

    // Throw an error if nothing is retrieved
    if (!user) {
      const error = new Error('No user found with this userId.');
      error.statusCode = 401;
      throw error;
    }

    // Updating the user status
    user.status = newStatus;
    await user.save();

    // Sending the response to the client
    res.status(200).json({ message: 'User status updated' });
  } catch (err) {
    errorHandler(next);
  }
};
