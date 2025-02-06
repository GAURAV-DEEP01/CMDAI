import { Command } from 'commander';
import { CLIArgs } from '../types/cliArgs';
import { Primary, ConfigSubCommand } from '../util/constants';

// command combinations
// clai
// clai config set
// clai config get
// clai --version
// clai --help
// clai --verbose
// clai --command="<command>"
// clai --command="<command>" --model="<model>"
// clai --prompt="<prompt>" 
// clai --prompt="<prompt>" --model="<model>"
// clai --command="<command>" --verbose 
// clai --command="<command>" --verbose --model="<model>"
// clai --prompt="<prompt>" --verbose
// clai --prompt="<prompt>" --verbose --model="<model>"
// clai --command="<command>" --prompt="<prompt>"
// clai --command="<command>" --prompt="<prompt>" --model="<model>"
// clai --command="<command>" --prompt="<prompt>" --verbose
// clai --command="<command>" --prompt="<prompt>" --verbose --model="<model>"
// clai --file="<file>" --verbose
// clai --file="<file>" --verbose --model="<model>"
// clai --file="<file>" --prompt="<question>"
// clai --file="<file>" --prompt="<question>" --model="<model>"
// clai --file="<file>" --prompt="<question>" --verbose
// clai --file="<file>" --prompt="<question>" --verbose --model="<model>"
// clai --ask="<question>" --model="<model>"

// same as above for short flags 

// v2
// clai session start
// clai check
// clai session end
// clai session status

const validateCLIArgs = (args: CLIArgs): void => {
  const checkInvalidOptions = (...optionsToCheck: (keyof CLIArgs)[]): void => {
    const invalidOptions = optionsToCheck.filter(opt => args[opt] !== undefined);
    if (invalidOptions.length > 0) {
      throw new Error(`Invalid options for ${args.primary}: ${invalidOptions.join(', ')}`);
    }
  };

  switch (args.primary) {
    case Primary.CONFIG:
      checkInvalidOptions('commandStr', 'prompt', 'filePath', 'askString');
      break;
    case Primary.VERSION:
      checkInvalidOptions('commandStr', 'prompt', 'filePath', 'askString', 'help', 'model');
      break;
    case Primary.HELP:
      checkInvalidOptions('commandStr', 'prompt', 'filePath', 'askString', 'version', 'model');
      break;
    case Primary.EXECUTE:
      // Allow EXECUTE without commandStr (interactive mode)
      checkInvalidOptions('filePath', 'askString');
      break;
    case Primary.FILE:
      if (!args.filePath) throw new Error('--file is required for file primary action');
      checkInvalidOptions('commandStr', 'askString');
      break;
    case Primary.ASK:
      if (!args.askString) throw new Error('--ask is required for ask primary action');
      checkInvalidOptions('commandStr', 'prompt', 'filePath');
      break;
    default:
      throw new Error(`Unhandled primary action: ${args.primary}`);
  }

  if (args.version && args.help) {
    throw new Error('--version and --help cannot be used together');
  }
};

export const parseCLIArgs = (): CLIArgs => {
  const program = new Command();
  const cliArgs: CLIArgs = { primary: Primary.EXECUTE }; // Default to EXECUTE

  // Setup config subcommand
  const configCmd = new Command('config')
    .description('Manage application configuration');

  configCmd.command(ConfigSubCommand.GET)
    .description('Get configuration values')
    .action(() => {
      cliArgs.primary = Primary.CONFIG;
      cliArgs.subCommand = ConfigSubCommand.GET;
    });

  configCmd.command(ConfigSubCommand.SET)
    .description('Set configuration values interactively')
    .action(() => {
      cliArgs.primary = Primary.CONFIG;
      cliArgs.subCommand = ConfigSubCommand.SET;
    });

  // Setup root command
  program
    .version('0.1.0', '-V, --version', 'Show version information')
    .option('-h, --help', 'Show help information')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-c, --command <command>', 'Command to execute')
    .option('-p, --prompt <prompt>', 'Prompt to use')
    .option('-f, --file <file>', 'File to process')
    .option('-a, --ask <question>', 'Question to ask')
    .option('-m, --model <model>', 'Model name')
    .addCommand(configCmd)
    .action(() => {
      const options = program.opts();

      // Determine primary action based on options
      if (options.command) {
        cliArgs.primary = Primary.EXECUTE;
      } else if (options.file) {
        cliArgs.primary = Primary.FILE;
      } else if (options.ask) {
        cliArgs.primary = Primary.ASK;
      } else if (options.version) {
        cliArgs.primary = Primary.VERSION;
      } else if (options.help) {
        cliArgs.primary = Primary.HELP;
      }
      // If none of the above, keep default as EXECUTE
    });

  program.parse(process.argv);

  // Map parsed options to CLIArgs
  const options = program.opts();
  cliArgs.verbose = options.verbose;
  cliArgs.version = options.version;
  cliArgs.help = options.help;
  cliArgs.commandStr = options.command;
  cliArgs.prompt = options.prompt;
  cliArgs.filePath = options.file;
  cliArgs.askString = options.ask;
  cliArgs.model = options.model;

  validateCLIArgs(cliArgs);

  return cliArgs;
};
