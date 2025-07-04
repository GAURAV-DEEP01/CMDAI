import clc from 'cli-color';
import { getLastCommand, runCommand } from '../util/commandHistory';
import { analyzeCommandExecution } from '../util/analysisHandler';
import { CommandExecutionError } from '../types/errors';
import { CLIArgs } from '../types/cliArgs';
import { ConfigSubCommand } from '../types/constants';
import { runSetup, readConfig } from '../util/configHandler';
import fs from 'fs/promises';

export async function handleExecuteCommand(userArgs: CLIArgs) {
  try {
    // Determine command source
    const commandStr = userArgs.commandStr || getLastCommand();

    if (!commandStr)
      throw new Error('No command provided and no history found');

    // Validate command input
    if (commandStr.trim().length === 0)
      throw new Error('Empty command provided');

    // Execute the command
    const [mainCommand, ...commandArgs] = commandStr.split(/\s+/);
    const { output, error } = await runCommand(
      mainCommand,
      commandArgs,
      userArgs.verbose,
      !userArgs.commandStr,
    );

    await analyzeCommandExecution({
      command: commandStr,
      output,
      error,
      userArgs,
    });
  } catch (error) {
    if (error instanceof CommandExecutionError) {
      process.stderr.write(
        `\n${clc.red('Command failed:')} ${error.message}\n`,
      );
      process.exit(error.exitCode);
    }

    process.stderr.write(
      `\n${clc.red('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    );
    process.exit(1);
  }
}

export async function handleFileCommand(userArgs: CLIArgs) {
  try {
    const filePath = userArgs.filePath;
    if (!filePath) throw new Error('No file path provided');

    // Check if file exists using relative path
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.length === 0) throw new Error('File is empty');

    // Call analysis with file content
    await analyzeCommandExecution({
      filePath,
      fileContent: content,
      userArgs: userArgs,
    });
  } catch (error) {
    process.stderr.write(
      `\n${clc.red('File Error:')} ${
        error instanceof Error ? error.message : 'Unknown error'
      }\n`,
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
  } else process.stderr.write(`${clc.red('Error:')} Invalid Config command`);

  process.exit(1);
}

export async function handleAskCommand(userArgs: CLIArgs) {
  try {
    const askString = userArgs.askString;
    if (!askString) throw new Error('No input provided');

    await analyzeCommandExecution({
      userArgs: userArgs,
      askString,
    });
  } catch (error) {
    process.stderr.write(
      `\n${clc.red('Error:')} ${
        error instanceof Error ? error.message : 'Unknown error'
      }\n`,
    );
    process.exit(1);
  }
}
