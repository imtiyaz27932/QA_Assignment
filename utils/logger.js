
const fs = require("fs");
const path = require("path");

class Logger {
  static async getChalk() {
    const chalk = await import("chalk");
    return chalk.default;
  }

  static async info(message) {
    const chalk = await this.getChalk();
    console.log(`${chalk.blue("ℹ️ [INFO]")} ${message}`);
  }

  static async success(message) {
    const chalk = await this.getChalk();
    console.log(`${chalk.green("✅ [SUCCESS]")} ${message}`);
  }

  static async error(message) {
    const chalk = await this.getChalk();
    console.error(`${chalk.red("❌ [ERROR]")} ${message}`);
  }

  static async warn(message) {
    const chalk = await this.getChalk();
    console.warn(`${chalk.yellow("⚠️ [WARN]")} ${message}`);
  }
}

module.exports = Logger;
