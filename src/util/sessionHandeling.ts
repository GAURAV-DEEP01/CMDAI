import { CLIArgs } from "./cliArgs";
import { SessionSubCommand } from "./constants";
import fs from "fs";

export function handleSessionCommand(userArgs: CLIArgs) {
  const configPath = "./config/config.json";
  let configFile;
  let config;
  try {
    configFile = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configFile);
  } catch (e) {
    process.stdout.write("Error reading config file\n");
    throw e;
  }
  if (userArgs?.subCommand === SessionSubCommand.START) {
    if (config.session) {
      process.stdout.write("Session already started\n");
      return;
    }
    process.stdout.write("Session started\n");
    config.session = true;
    process.stdout.write("Session state updated to true in config.json\n");
  } else if (userArgs?.subCommand === SessionSubCommand.END) {
    if (!config.session) {
      process.stdout.write("No Session found");
      return;
    }
    process.stdout.write("Session ended\n");
    config.session = false;
    process.stdout.write("Session state updated to false in config.json\n");
  } else if (userArgs?.subCommand === SessionSubCommand.STATUS) {
    if (!config.session) {
      process.stdout.write("Session status: not running\n");
    } else {
      process.stdout.write("Session status: running\n");
    }
  }
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    process.stdout.write("Error writing to config file\n");
    throw e;
  }
}
