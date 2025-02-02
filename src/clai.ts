#!/usr/bin/env node
import readline from "readline";
import { showVersion, showHelp } from "./components/info";
import { Primary } from "./util/constants";
import { ArgumentError } from "./types/errors";
import { getLastCommand, runCommand } from "./util/commandHistory";
import { handleSessionCommand } from "./util/sessionHandeling";
import { defaultPrompt } from "./data/defaultPrompt";
import { handleResponse } from "./components/handleResponse";
import { parseCLIArgs } from "./util/argParser";
import { CLIArgs } from "./types/cliArgs";
import { clearLine } from "./util/tools";
import queryLLM, { CommandAnalysis } from "./components/queryLLM";
import { initializeConfig } from "./util/configHandler";
import inquirer from "inquirer";

async function main() {
  
  const config = await initializeConfig();
  const DEFAULT_MODEL = config.model;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let userArgs: CLIArgs | null = null;
  try {
    userArgs = parseCLIArgs();
    // Use the parsed arguments
  } catch (error) {
    if (error instanceof ArgumentError) {
      console.error(`Error (${error.code}): ${error.message}`);
    } else {
      console.error("Unexpected error:", error);
    }
  }

  if (!userArgs) {
    process.stderr.write("Error parsing arguments\n");
    return;
  }

  if (userArgs.help) {
    showHelp(DEFAULT_MODEL);
    return;
  }

  if (userArgs.version) {
    showVersion();
    return;
  }

  if (userArgs.primary == Primary.EXECUTE) {
    const commandList = getLastCommand().split(" ");
    const mainCommand = commandList[0];
    const commandArgs = commandList.slice(1);
    const { output, error } = await runCommand(
      mainCommand,
      commandArgs,
      userArgs.verbose
    );

    if (output) process.stdout.write(output);
    if (error) process.stdout.write(error);

    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "analyze",
        message: `Do you want ${
          userArgs?.model || DEFAULT_MODEL
        } to analyse this output?`,
        default: true,
      },
    ]);
    clearLine();

    if (!answer.analyze) {
      rl.close();
      return;
    }

    let commandWithArguments = mainCommand;
    commandArgs.map((arg) => {
      commandWithArguments += " " + arg;
    });
    const ollamaInput = defaultPrompt(
      commandWithArguments,
      output,
      error,
      userArgs.prompt
    );

    const response: CommandAnalysis = await queryLLM(
      userArgs.model || DEFAULT_MODEL,
      ollamaInput,
      userArgs.verbose
    );

    await handleResponse(response, rl);
  }

  if (userArgs.primary == Primary.CHECK) {
    process.stdout.write("is in check mode\n");
  }

  if (userArgs.primary === Primary.SESSION) {
    handleSessionCommand(userArgs);
  }

  rl.close();
}

main()
  .catch((err) => {
    console.error("Error in main function:", err);
  })
  .then(() => {
    process.exit(1);
  });
