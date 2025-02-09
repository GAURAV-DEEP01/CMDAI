import { Command } from 'commander';
import { CLIArgs } from '../types/cliArgs';
import { Primary, ConfigSubCommand } from '../types/constants';

function validateCLIArgs(args: CLIArgs): void {
  const checkInvalidOptions = (...optionsToCheck: (keyof CLIArgs)[]): void => {
    const invalidOptions = optionsToCheck.filter(
      (opt) => args[opt] !== undefined,
    );
    if (invalidOptions.length > 0) {
      throw new Error(
        `Invalid options for ${args.primary}: ${invalidOptions.join(', ')}`,
      );
    }
  };

  switch (args.primary) {
    case Primary.PIPED:
      checkInvalidOptions('commandStr', 'filePath', 'askString', 'subCommand');
      break;
    case Primary.CONFIG:
      checkInvalidOptions('commandStr', 'prompt', 'filePath', 'askString');
      break;
    case Primary.VERSION:
      checkInvalidOptions(
        'commandStr',
        'prompt',
        'filePath',
        'askString',
        'help',
        'model',
      );
      break;
    case Primary.HELP:
      checkInvalidOptions(
        'commandStr',
        'prompt',
        'filePath',
        'askString',
        'version',
        'model',
      );
      break;
    case Primary.EXECUTE:
      // Allow EXECUTE without commandStr (interactive mode)
      checkInvalidOptions('filePath', 'askString');
      break;
    case Primary.FILE:
      if (!args.filePath)
        throw new Error('--file is required for file primary action');
      checkInvalidOptions('commandStr', 'askString');
      break;
    case Primary.ASK:
      if (!args.askString)
        throw new Error('--ask is required for ask primary action');
      checkInvalidOptions('commandStr', 'prompt', 'filePath');
      break;
    default:
      throw new Error(`Unhandled primary action: ${args.primary}`);
  }

  if (args.version && args.help) {
    throw new Error('--version and --help cannot be used together');
  }
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

export async function parseCLIArgs(): Promise<CLIArgs> {
  const cliArgs: CLIArgs = { primary: Primary.EXECUTE };
  if (!process.stdin.isTTY) {
    const pipedInput = await readStdin();
    if (pipedInput) {
      cliArgs.primary = Primary.PIPED;
      cliArgs.pipedStr = pipedInput;
    }
  }

  const program = new Command();
  // Setup config subcommand
  const configCmd = new Command('config').description(
    'Manage application configuration',
  );

  configCmd
    .command(ConfigSubCommand.GET)
    .description('Get configuration values')
    .action(() => {
      cliArgs.primary = Primary.CONFIG;
      cliArgs.subCommand = ConfigSubCommand.GET;
    });

  configCmd
    .command(ConfigSubCommand.SET)
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
      if (cliArgs.pipedStr) {
        cliArgs.primary = Primary.PIPED;
      } else if (options.command) {
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
}

// function handlePipedCommand(pipedData: string) {
//   throw new Error('Function not implemented.');
// }

// command combinations
// cmdai
// cmdai config set
// cmdai config get
// cmdai --version
// cmdai --help
// cmdai --verbose
// cmdai --command="<command>"
// cmdai --command="<command>" --model="<model>"
// cmdai --prompt="<prompt>"
// cmdai --prompt="<prompt>" --model="<model>"
// cmdai --command="<command>" --verbose
// cmdai --command="<command>" --verbose --model="<model>"
// cmdai --prompt="<prompt>" --verbose
// cmdai --prompt="<prompt>" --verbose --model="<model>"
// cmdai --command="<command>" --prompt="<prompt>"
// cmdai --command="<command>" --prompt="<prompt>" --model="<model>"
// cmdai --command="<command>" --prompt="<prompt>" --verbose
// cmdai --command="<command>" --prompt="<prompt>" --verbose --model="<model>"
// cmdai --file="<file>" --verbose
// cmdai --file="<file>" --verbose --model="<model>"
// cmdai --file="<file>" --prompt="<question>"
// cmdai --file="<file>" --prompt="<question>" --model="<model>"
// cmdai --file="<file>" --prompt="<question>" --verbose
// cmdai --file="<file>" --prompt="<question>" --verbose --model="<model>"
// cmdai --ask="<question>" --model="<model>"

// same as above for short flags
