const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

module.exports = async () => {
  console.log(chalk.blue("🧹 Running global teardown..."));
  
  try {
    // Clean up temporary files
    const tempDir = path.resolve(__dirname, "temp");
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log(chalk.green("✅ Cleaned up temporary files"));
    }

    // Archive old test results if they exist
    const testResultsDir = path.resolve(__dirname, "test-results");
    if (fs.existsSync(testResultsDir)) {
      const archiveDir = path.resolve(__dirname, "archived-results");
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = path.join(archiveDir, `results-${timestamp}`);
      
      // Only archive if there are actual test results
      const resultFiles = fs.readdirSync(testResultsDir);
      if (resultFiles.length > 0) {
        fs.renameSync(testResultsDir, archivePath);
        console.log(chalk.green(`✅ Archived test results to ${archivePath}`));
      }
    }

    console.log(chalk.blue("🏁 Global teardown completed successfully"));
  } catch (error) {
    console.error(chalk.red("❌ Error during global teardown:"), error);
  }
};