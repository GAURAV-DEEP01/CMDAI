import clc from "cli-color";
import fs from "fs";
import os from "os";
import path from "path";
import { Config } from "../types/config";

export function clearStdLine() {
  process.stdout.write(clc.erase.line);
}

export function readConfig(): Config {
  const configPath = path.join(os.homedir(), ".clai", "config.json");
  try {
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error reading config file:", error.message);
    } else {
      console.error("Error reading config file:", error);
    }
    process.exit(0);
  }
}

export const loadingAnimation = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
];
