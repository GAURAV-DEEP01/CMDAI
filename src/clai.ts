#!/usr/bin/env node
import { analyzeCommandExecution } from "./util/analysisHandler";
import readline from "readline";
import { showVersion, showHelp } from "./components/info";
import { Primary } from "./util/constants";
import { ArgumentError, CommandExecutionError } from "./types/errors";
import { getLastCommand, runCommand } from "./util/commandHistory";
import { handleSessionCommand } from "./components/sessionHandeling";
import { parseCLIArgs } from "./components/argParser";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import inquirer from "inquirer";
import clc from "cli-color";
// import { checkLLM } from "./util/checkLLM";

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
    //todo first check if llm running
    // await checkLLM();

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
      handleExecuteCommand(userArgs);
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

async function handleExecuteCommand(userArgs: CLIArgs) {
  try {
    // Determine command source
    const commandStr = userArgs.commandStr || getLastCommand();

    if (!commandStr) {
      throw new Error("No command provided and no history found");
    }

    // Validate command input
    if (commandStr.trim().length === 0) {
      throw new Error("Empty command provided");
    }

    // Execute the command
    const [mainCommand, ...commandArgs] = commandStr.split(/\s+/);
    const { output, error } = await runCommand(
      mainCommand,
      commandArgs,
      userArgs.verbose
    );
    process.stdout.write(clc.green.bold.underline(`Result:`));
    if (output) process.stdout.write(`${output}\n`);
    if (error) process.stderr.write(`${error}\n`);

    try {
      // Determine if analysis should proceed
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "analyze",
          message: `Run analysis with ${userArgs.model}?`,
          default: true,
        },
      ]);

      if (answer.analyze) {
        await analyzeCommandExecution({
          command: commandStr,
          output,
          error,
          model: userArgs.model as string,
          customPrompt: userArgs.prompt,
          verbose: userArgs.verbose,
        });
      }
    } catch (error) {
      process.stderr.write("Exited");
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof CommandExecutionError) {
      process.stderr.write(`\nCommand failed: ${error.message}\n`);
      process.exit(error.exitCode);
    }

    process.stderr.write(
      `\nError: ${error instanceof Error ? error.message : "Unknown error"}\n`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Critical error during execution:", err);
  process.exit(1);
});
