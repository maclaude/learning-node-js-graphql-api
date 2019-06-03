/**
 * Node Core Module
 */
const path = require('path');

/**
 * NPM import
 */
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const uuidV4 = require('uuid/v4');
const graphqlHttp = require('express-graphql');

/**
 * Local import
 */
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
// Middlewares
const auth = require('./middlewares/auth');
// Utils
const deleteFile = require('./utils/delete-file');

/**
 * Code
 */
// Environment variables
dotenv.config();

// Initialize express
const app = express();

// Multer file storage
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const fileName = `${uuidV4()}-${file.originalname}`;
    callback(null, fileName);
  },
});

// Multer file filter
const fileFilter = (req, file, callback) => {
  if (
    // Types
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    // Accept
    callback(null, true);
  } else {
    // Reject
    callback(null, false);
  }
};

/**
 * Middlewares
 */
// Parser (Parsing the incoming JSON data)
// ! This middleware should always be placed first
app.use(bodyParser.json());

// Initialize Multer file upload
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));

// Access to the images directory path
app.use('/images', express.static(path.join(__dirname, 'images')));

// Setting response CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Set response status of 200 for OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

// Setting auth status middleware
app.use(auth);

// Post image middleware
app.put('/post-image', (req, res, next) => {
  // Checking user authentication status
  if (!req.isAuth) {
    const error = new Error('User is not authenticated');
    error.code = 401;
    throw error;
  }

  // Checking if a file is provided
  if (!req.file) {
    return res.status(200).json({ message: 'No file is provided' });
  }
  // Deleting the file if the image is updated
  if (req.body.oldPath) {
    deleteFile(req.body.oldPath);
  }
  // Sending the response
  return res
    .status(201)
    .json({ message: 'File stored', filePath: req.file.path });
});

// Setting-up GraphQL
app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true, // Access to GraphiQL: http://localhost:8000/graphql
    // Formatting error
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const { data } = err.originalError;
      const message = err.message || 'An error occured';
      const code = err.originalError.code || 500;
      return { message, status: code, data };
    },
  })
);

// Error Handling
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const { message, data } = error;
  res.status(status).json({ message, data });
});

/**
 * Database connexion with Mongoose
 */
// Database password
const { DB_PASSWORD } = process.env;

// Database URI
const DB_URI = `mongodb+srv://maclaude:${DB_PASSWORD}@node-js-qfuuy.mongodb.net/blog?retryWrites=true`;

mongoose
  .connect(DB_URI, { useNewUrlParser: true })
  .then(response => {
    console.log('Connected');
    // Starting the server
    app.listen(8000);
  })
  .catch(err => console.log(err));
