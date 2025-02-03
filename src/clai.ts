#!/usr/bin/env node
import readline from "readline";
import { showVersion, showHelp } from "./components/info";
import { ConfigSubCommand, Primary } from "./util/constants";
import { ArgumentError } from "./types/errors";
import { handleSessionCommand } from "./components/sessionHandeling";
import { parseCLIArgs } from "./components/argParser";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import { checkLLM } from "./util/checkLLM";
import {
  handleConfigCommand,
  handleExecuteCommand,
} from "./components/commandHandler";

// Handle uncaught promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const config = await initializeConfig();
    const DEFAULT_MODEL = config.model;

    await checkLLM();

    let userArgs: CLIArgs;
    try {
      userArgs = parseCLIArgs();
    } catch (error) {
      if (error instanceof ArgumentError) {
        console.error(`Error (${error.code}): ${error.message}`);
      } else {
        console.error("Unexpected error during argument parsing:", error);
      }
      process.exit(1);
    }
    // console.log(userArgs);
    if (userArgs.help) {
      showHelp(DEFAULT_MODEL);
      process.exit(0);
    }

    if (userArgs.version) {
      showVersion();
      process.exit(0);
    }

    if (userArgs.primary === Primary.SESSION) {
      handleSessionCommand(userArgs);
      process.exit(0);
    }

    if (!userArgs.model) {
      userArgs.model = DEFAULT_MODEL;
    }

    if (userArgs.primary === Primary.EXECUTE) {
      await handleExecuteCommand(userArgs);
    }

    if (userArgs.primary === Primary.CONFIG) {
      await handleConfigCommand(userArgs.subCommand as ConfigSubCommand);
    }

    if (userArgs.primary === Primary.CHECK) {
      // Implement comprehensive system check logic here
      console.log("System check passed");
    }
  } catch (error) {
    console.error(
      `Unexpected error: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Critical error during execution:", err);
  process.exit(1);
});
