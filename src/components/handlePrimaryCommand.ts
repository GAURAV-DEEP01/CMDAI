import {
  handleExecuteCommand,
  handleConfigCommand,
  handleFileCommand,
} from './commandHandler';
import { handleSessionCommand } from './sessionHandeling';
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

    //v2
    case Primary.CHECK:
      process.stderr.write('Comming soon...\n');
      process.exit(0);

    case Primary.SESSION:
      process.stdout.write('Comming soon...\n');
      handleSessionCommand(userArgs);
      process.exit(0);

    default:
      console.error('Error: Unexpected primary command');
      process.exit(1);
  }
}
