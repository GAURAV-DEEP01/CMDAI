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

    // to do set this up duing installation or first run, later
    // const shell = process.env.SHELL || "";
    // if (shell === "/bin/bash" && !configJson.forceBashHistoyWrite) {
    //   const bashrcPath = path.join(os.homedir(), ".bashrc");
    //   const isBashrc = fs.existsSync(bashrcPath);
    //   if (!isBashrc) {
    //     process.stderr.write("Bashrc not found\n");
    //     process.exit(1);
    //   }
    //
    //   if (!fs.readFileSync(bashrcPath, 'utf8').includes('PROMPT_COMMAND="history -a; $PROMPT_COMMAND"')) {
    //     const bashrcContent = `\n# Force immediate history update on every command\nPROMPT_COMMAND='history -a; $PROMPT_COMMAND'\n# Enable history for non-interactive shells (scripts)\nshopt -s histappend\n`;
    //     fs.appendFileSync(bashrcPath, bashrcContent);
    //   }
    // }
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
