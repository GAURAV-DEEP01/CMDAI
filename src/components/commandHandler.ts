import inquirer from "inquirer";
import clc from "cli-color";
import { getLastCommand, runCommand } from "../util/commandHistory";
import { analyzeCommandExecution } from "../util/analysisHandler";
import { CommandExecutionError } from "../types/errors";
import { CLIArgs } from "../types/cliArgs";
import { ConfigSubCommand } from "../util/constants";
import { runSetup } from "../util/configHandler";
import { clearStdLine, readConfig } from "../util/tools";

export async function handleExecuteCommand(userArgs: CLIArgs) {
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
    process.stdout.write(clc.green.bold.underline(`Result:\n`));
    if (output) process.stdout.write(`${output}`);
    if (error) process.stderr.write(`${error}`);

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
      clearStdLine();

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

export async function handleConfigCommand(subCommand: ConfigSubCommand) {
  if (subCommand === ConfigSubCommand.GET) {
    const config = readConfig();
    process.stdout.write(clc.blue.bold.underline(`Current Configuration:\n`));
    process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
  } else if (subCommand === ConfigSubCommand.SET) {
    await runSetup();
  } else {
    process.stderr.write("Invalid Config command");
  }
  process.exit(1);
}
