import {
  handleExecuteCommand,
  handleConfigCommand,
  handleFileCommand,
  handleAskCommand,
} from './commandHandler';
import { CLIArgs } from '../types/cliArgs';
import { Primary, ConfigSubCommand } from '../util/constants';

export async function handlePrimaryCommand(userArgs: CLIArgs) {
  switch (userArgs.primary) {
    case Primary.EXECUTE:
      await handleExecuteCommand(userArgs);
      process.exit(0);

    case Primary.CONFIG:
      await handleConfigCommand(userArgs.subCommand as ConfigSubCommand);
      process.exit(0);

    case Primary.FILE:
      await handleFileCommand(userArgs);
      process.exit(0);

    case Primary.ASK:
      await handleAskCommand(userArgs);
      process.exit(0);

    default:
      console.error('Error: Unexpected primary command');
      process.exit(1);
  }
}
