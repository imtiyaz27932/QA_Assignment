const fs = require("fs");
const path = require("path");

const basePath = path.join(__dirname, "..", "files");

const sampleFilePath = path.join(basePath, "sample.txt");
const uploadFilePath = path.join(basePath, "upload.txt");

function writeToFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function readFromFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

module.exports = {
  sampleFilePath,
  uploadFilePath,
  writeToFile,
  readFromFile,
};
