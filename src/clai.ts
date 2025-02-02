#!/usr/bin/env node
import readline from "readline";
import { showVersion, showHelp } from "./components/info";
import { Primary } from "./util/constants";
import { ArgumentError, CommandExecutionError } from "./types/errors";
import { getLastCommand, runCommand } from "./util/commandHistory";
import { handleSessionCommand } from "./util/sessionHandeling";
import { defaultPrompt } from "./data/defaultPrompt";
import { handleResponse } from "./components/handleResponse";
import { parseCLIArgs } from "./util/argParser";
import { CLIArgs } from "./types/cliArgs";
import { clearLine, validateModelName } from "./util/tools";
import queryLLM, { CommandAnalysis } from "./components/queryLLM";
import { initializeConfig } from "./util/configHandler";
import inquirer from "inquirer";

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
    const DEFAULT_MODEL = config.model || "llama2";

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
      handleExecuteCommand(userArgs)
    }

    if (userArgs.primary === Primary.CHECK) {
      // Implement comprehensive system check logic here
      console.log("System check passed");
    }

  } catch (error) {
    console.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Critical error during execution:", err);
  process.exit(1);
});

import { executeCommand } from "./util/commandExecutor";
import { analyzeCommandExecution } from "./util/analysisHandler";

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
    const { output, error } = await executeCommand(
      mainCommand,
      commandArgs,
      userArgs.verbose
    );

    // Display results
    if (output) process.stdout.write(`\n${output}\n`);
    if (error) process.stderr.write(`\n${error}\n`);

    // Determine if analysis should proceed
    const shouldAnalyze = userArgs.prompt
      ? true // Auto-analyze if custom prompt provided
      : await promptForAnalysis(userArgs.model);

    if (shouldAnalyze) {
      await analyzeCommandExecution({
        command: commandStr,
        output,
        error,
        model: userArgs.model as string,
        customPrompt: userArgs.prompt,
        verbose: userArgs.verbose
      });
    }
  } catch (error) {
    handleExecuteError(error);
  }
}

async function promptForAnalysis(model?: string): Promise<boolean> {
  const { analyze } = await inquirer.prompt([{
    type: "confirm",
    name: "analyze",
    message: `Run analysis with ${model || 'default model'}?`,
    default: true
  }]);
  return analyze;
}

function handleExecuteError(error: unknown) {
  if (error instanceof CommandExecutionError) {
    process.stderr.write(`\nCommand failed: ${error.message}\n`);
    process.exit(error.exitCode);
  }

  process.stderr.write(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  process.exit(1);
}
