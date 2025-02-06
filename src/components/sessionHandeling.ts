import { CLIArgs } from "../types/cliArgs";
import { SessionSubCommand } from "../util/constants";
import fs from "fs";
import os from "os";
import path from "path";
import { readConfig } from "../util/tools";

// Constants for consistent messaging
const CONFIG_DIR = path.join(os.homedir(), "/.clai");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const STATUS_ICONS = { SUCCESS: "✓", ERROR: "✗" };

// v2 - Add a new function to handle session commands
export function handleSessionCommand(userArgs: CLIArgs) {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      process.stderr.write(
        `${STATUS_ICONS.SUCCESS} Created config directory\n`
      );
    }

    let config = readConfig();

    switch (userArgs?.subCommand) {
      case SessionSubCommand.START:
        handleSessionStart(config);
        break;
      case SessionSubCommand.END:
        handleSessionEnd(config);
        break;
      case SessionSubCommand.STATUS:
        handleSessionStatus(config);
        break;
      default:
        throw new Error(
          `Invalid session sub-command: ${userArgs?.subCommand}\n`
        );
    }
  } catch (error) {
    console.error(
      `${STATUS_ICONS.ERROR} ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

function writeConfigFile(config: any) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    process.stdout.write(`${STATUS_ICONS.SUCCESS} Config file updated\n`);
  } catch (error) {
    throw new Error(
      `Failed to write config file: ${(error as Error).message}\n`
    );
  }
}

function handleSessionStart(config: any) {
  if (config.session) {
    process.stdout.write(`${STATUS_ICONS.ERROR} Session is already active\n`);
    return;
  }
  // start storing command and output in a session log file
  // create a new session file
  const sessionFile = path.join(CONFIG_DIR, "session.log");
  fs.writeFileSync(sessionFile, "");
  config.session = true;
  writeConfigFile(config);
  process.stdout.write(`${STATUS_ICONS.SUCCESS} New session started\n`);
}

function handleSessionEnd(config: any) {
  if (!config.session) {
    process.stdout.write(`${STATUS_ICONS.ERROR} No active session to end\n`);
    return;
  }

  config.session = false;
  writeConfigFile(config);
  process.stdout.write(`${STATUS_ICONS.SUCCESS} Session ended successfully\n`);
}

function handleSessionStatus(config: any) {
  const status = config.session ? "active" : "inactive";
  const icon = config.session ? STATUS_ICONS.SUCCESS : STATUS_ICONS.ERROR;
  process.stdout.write(`${icon} Current session status: ${status}\n`);
}
