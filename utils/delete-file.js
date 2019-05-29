/**
 * Node Core Module import
 */
const fs = require('fs');
const path = require('path');

/**
 * Code
 */
const deleteFile = filePath => {
  let currentPath = filePath;
  currentPath = path.join(__dirname, '..', filePath);
  fs.unlink(currentPath, err => console.log(err));
};

/**
 * Export
 */
module.exports = deleteFile;
