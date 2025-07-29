
const fs = require("fs");
const path = require("path");

const tempDir = path.resolve(__dirname, "../temp");
const dataPath = path.join(tempDir, "testData.json");

function writeTestData(data) {

 
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function readTestData() {
  if (!fs.existsSync(dataPath)) return {};
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

module.exports = { writeTestData, readTestData };
