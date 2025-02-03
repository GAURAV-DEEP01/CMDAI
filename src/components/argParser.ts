import {
  Primary,
  Flag,
  SessionSubCommand,
  ConfigSubCommand,
} from "../util/constants";
import { CLIArgs } from "../types/cliArgs";
import { ArgumentError } from "../types/errors";

// command combinations
// clai
// clai config set
// clai config get
// clai session start
// clai check
// clai session end
// clai session status
// clai version
// clai help
// clai --verbose
// clai --command="<command>"
// clai --prompt="<prompt>"
// clai --command="<command>" --prompt="<prompt>"
// clai --command="<command>" --verbose
// clai --prompt="<prompt>" --verbose
// clai --command="<command>" --prompt="<prompt>" --verbose

// Command structure definition for easy extension
const commandStructure: any = {
  [Primary.SESSION]: {
    subCommands: Object.values(SessionSubCommand),
    flags: [Flag.VERBOSE],
  },
  [Primary.CONFIG]: {
    subCommands: Object.values(ConfigSubCommand),
    flags: [Flag.KEY, Flag.VALUE, Flag.VERBOSE],
  },
  [Primary.CHECK]: {
    flags: [Flag.PROMPT, Flag.VERBOSE],
  },
  [Primary.EXECUTE]: {
    flags: [Flag.COMMAND, Flag.PROMPT, Flag.MODEL, Flag.VERBOSE],
  },
};

export function parseCLIArgs(): CLIArgs {
  try {
    const args = normalizeArgs(process.argv.slice(2));

    if (args.length === 0) {
      return { primary: Primary.EXECUTE };
    }

    const primary = findPrimaryCommand(args);
    const specialResult = handleSpecialCases(primary, args);
    if (specialResult) return specialResult;

    // Handle commands with subcommands
    switch (primary) {
      case Primary.SESSION:
        return parseSubCommand(args, Primary.SESSION, SessionSubCommand);
      case Primary.CONFIG:
        return parseSubCommand(args, Primary.CONFIG, ConfigSubCommand);
    }
    return parseRegularCommand(args, primary);

  } catch (error) {
    if (error instanceof ArgumentError) {
      const errorMessage = `Error (${error.code}): ${error.message}`;
      process.stderr.write(errorMessage + "\n");
    } else {
      process.stderr.write("Unexpected error during argument parsing:");
      console.error(error);
    }
    process.exit(1);
  }
}

// Generic subcommand parser
function parseSubCommand<T>(
  args: string[],
  primary: Primary,
  subCommandEnum: Record<string, T>
): CLIArgs {
  const subCommandArg = args.find((arg) =>
    Object.values(subCommandEnum).includes(arg as T)
  );
  if (!subCommandArg) {
    throw new ArgumentError(
      `Missing subcommand for ${primary}, expected: ${Object.values(
        subCommandEnum
      ).join(", ")}`,
      "MISSING_SUBCOMMAND"
    );
  }

  const flags = parseFlags(args, primary);
  validateCommandStructure(primary);

  return {
    primary,
    subCommand: subCommandArg as T,
    ...flags,
  } as CLIArgs;
}

// Generic flag parser
function parseFlags(args: string[], primary: Primary): Partial<CLIArgs> {
  const result: Partial<CLIArgs> = {};
  const allowedFlags = commandStructure[primary]?.flags || [];

  for (const arg of args) {
    if (!arg.startsWith("--")) continue;

    const [flag, value] = parseFlagValue(arg);

    if (!allowedFlags.includes(flag as Flag)) {
      throw new ArgumentError(
        `Invalid flag for ${primary}: ${flag}`,
        "INVALID_FLAG"
      );
    }

    switch (flag) {
      case Flag.KEY:
      case Flag.VALUE:
      case Flag.PROMPT:
      case Flag.COMMAND:
      case Flag.MODEL:
        if (!value)
          throw new ArgumentError(
            `Flag ${flag} requires a value`,
            "MISSING_VALUE"
          );
        result[flag.substring(2).toLowerCase() as keyof CLIArgs] = value as any;
        break;
      case Flag.VERBOSE:
        result.verbose = true;
        break;
    }
  }

  return result;
}

function validateCommandStructure(primary: Primary) {
  const structure = commandStructure[primary];
  if (!structure) return;
}

// Helper functions remain similar but updated for generic handling
function parseFlagValue(arg: string): [string, string] {
  const [flag, ...valueParts] = arg.split("=");
  return [flag, valueParts.join("=")];
}

function findPrimaryCommand(args: string[]): Primary {
  // Updated mapping
  const commandMap: Record<string, Primary> = {
    help: Primary.HELP,
    version: Primary.VERSION,
    session: Primary.SESSION,
    check: Primary.CHECK,
    config: Primary.CONFIG,
    prompt: Primary.EXECUTE,
  };

  const cmd = args.find((arg) => commandMap[arg]);
  return cmd ? commandMap[cmd] : Primary.EXECUTE;
}

function normalizeArgs(args: string[]): string[] {
  const normalized: string[] = [];
  let currentArg = "";
  let inQuotes = false;
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    // handle quoted values in --flag="value" format
    if (arg.startsWith("--") && arg.includes('="')) {
      const [flag, ...rest] = arg.split('="');
      const value = rest.join('="');

      if (value.endsWith('"')) {
        normalized.push(`${flag}=${value.slice(0, -1)}`);
      } else {
        currentArg = `${flag}=${value}`;
        inQuotes = true;
      }
    }
    // continue collecting quoted value
    else if (inQuotes) {
      if (arg.endsWith('"')) {
        normalized.push(`${currentArg} ${arg.slice(0, -1)}`);
        currentArg = "";
        inQuotes = false;
      } else {
        currentArg += ` ${arg}`;
      }
    }
    // regular argument
    else {
      normalized.push(arg);
    }

    i++;
  }
  return normalized;
}

function handleSpecialCases(primary: Primary, args: string[]): CLIArgs | null {
  // Handle standalone flags
  if (args.length === 1) {
    if (args[0] === Flag.VERSION) {
      return { primary: Primary.VERSION, version: true } as CLIArgs;
    }
    if (args[0] === Flag.HELP) {
      return { primary: Primary.HELP, help: true } as CLIArgs;
    }
  }

  // Handle check command
  if (primary === Primary.CHECK) {
    const result: Partial<CLIArgs> = { primary: Primary.CHECK };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg === Flag.VERBOSE) {
        result.verbose = true;
      } else if (arg.startsWith("--prompt=")) {
        const [, ...valueParts] = arg.split("=");
        const value = valueParts.join("=");
        if (!value) {
          throw new ArgumentError(
            "Prompt flag requires a value",
            "INVALID_PROMPT"
          );
        }
        result.prompt = value;
      } else if (arg !== "check" && arg !== "prompt") {
        throw new ArgumentError(
          `Check command only accepts --verbose and --prompt flags, got: ${arg}`,
          "INVALID_CHECK_FLAGS"
        );
      }
      i++;
    }

    return result as CLIArgs;
  }

  return null;
}

function parseRegularCommand(args: string[], primary: Primary): CLIArgs {
  const result: Partial<CLIArgs> = {
    primary: primary || Primary.EXECUTE,
  };

  // Filter out any extra 'prompt' commands
  const relevantArgs = args.filter((arg) => arg !== "prompt");

  for (const arg of relevantArgs) {
    if (!arg.startsWith("--")) continue;

    const [flag, ...valueParts] = arg.split("=");
    const value = valueParts.join("="); // Rejoin in case value contains =

    switch (flag) {
      case Flag.MODEL:
        if (!value)
          throw new ArgumentError(
            "Model flag requires a value",
            "INVALID_MODEL"
          );
        result.model = value;
        break;
      case Flag.PROMPT:
        if (!value)
          throw new ArgumentError(
            "Prompt flag requires a value",
            "INVALID_PROMPT"
          );
        result.prompt = value;
        break;
      case Flag.COMMAND:
        if (!value)
          throw new ArgumentError(
            "Command flag requires a value",
            "INVALID_COMMAND"
          );
        result.commandStr = value;
        break;
      case Flag.VERBOSE:
        result.verbose = true;
        break;
      case Flag.VERSION:
        result.version = true;
        break;
      case Flag.HELP:
        result.help = true;
        break;
      default:
        throw new ArgumentError(`Unknown flag: ${flag}`, "UNKNOWN_FLAG");
    }
  }

  validateCommandCombinations(result);

  return result as CLIArgs;
}

function validateCommandCombinations(args: Partial<CLIArgs>): void {
  if (args.help || args.version) {
    const hasOtherFlags = Object.keys(args).some(
      (key) => key !== "help" && key !== "version" && key !== "primary"
    );
    if (hasOtherFlags) {
      throw new ArgumentError(
        `${args.help ? "Help" : "Version"
        } flag cannot be combined with other flags`,
        "INVALID_FLAG_COMBINATION"
      );
    }
  }
}
