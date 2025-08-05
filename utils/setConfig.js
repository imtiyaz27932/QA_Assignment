const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const settingsPath = path.resolve(__dirname, "../settings.json");

// Default settings
const defaultSettings = {
  executionMode: "parallel",
  browserMode: "headless",
  environment: "staging"
};

function loadSettings() {
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, "utf-8");
      return { ...defaultSettings, ...JSON.parse(content) };
    } catch (error) {
      console.error(chalk.red("Error loading settings:"), error);
      return defaultSettings;
    }
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(chalk.green("✅ Settings updated successfully"));
    console.log(chalk.blue("Current settings:"), settings);
  } catch (error) {
    console.error(chalk.red("Error saving settings:"), error);
  }
}

function setConfig() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.yellow("Usage: node setConfig.js <option>"));
    console.log(chalk.blue("Available options:"));
    console.log("  parallel     - Run tests in parallel");
    console.log("  sequential   - Run tests sequentially");
    console.log("  headless     - Run browsers in headless mode");
    console.log("  headed       - Run browsers with UI");
    console.log("  env:<name>   - Set environment (local, dev, staging, production)");
    return;
  }

  const settings = loadSettings();
  const option = args[0].toLowerCase();

  switch (option) {
    case 'parallel':
      settings.executionMode = 'parallel';
      console.log(chalk.blue("Setting execution mode to parallel"));
      break;
    case 'sequential':
      settings.executionMode = 'sequential';
      console.log(chalk.blue("Setting execution mode to sequential"));
      break;
    case 'headless':
      settings.browserMode = 'headless';
      console.log(chalk.blue("Setting browser mode to headless"));
      break;
    case 'headed':
      settings.browserMode = 'headed';
      console.log(chalk.blue("Setting browser mode to headed"));
      break;
    default:
      if (option.startsWith('env:')) {
        const environment = option.split(':')[1];
        const validEnvs = ['local', 'dev', 'staging', 'production'];
        if (validEnvs.includes(environment)) {
          settings.environment = environment;
          console.log(chalk.blue(`Setting environment to ${environment}`));
        } else {
          console.error(chalk.red(`Invalid environment: ${environment}`));
          console.log(chalk.blue(`Valid environments: ${validEnvs.join(', ')}`));
          return;
        }
      } else {
        console.error(chalk.red(`Unknown option: ${option}`));
        return;
      }
  }

  saveSettings(settings);
}

if (require.main === module) {
  setConfig();
}

module.exports = { loadSettings, saveSettings, setConfig };