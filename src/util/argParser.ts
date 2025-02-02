import { Primary, Flag, SessionSubCommand } from "./constants";
import { cliArgs } from "../types/cliArgs";
import { ArgumentError } from "../types/errors";

// command combinations
// clai
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

export function parseCLIArgs(): cliArgs {
  const args = process.argv.slice(2);

  // Handle empty args case
  if (args.length === 0) {
    return { primary: Primary.EXECUTE };
  }

  // NORMALIZE ARGS BY COMBINING QUOTED VALUES AND HANDLING ESCAPED QUOTES
  const normalizedArgs = normalizeArgs(args);

  // Extract primary command (first non-flag argument)
  const primaryCommand = findPrimaryCommand(normalizedArgs);

  // Handle special cases first
  const specialCaseResult = handleSpecialCases(primaryCommand, normalizedArgs);
  if (specialCaseResult) {
    return specialCaseResult;
  }

  // Parse based on primary command type
  if (primaryCommand === Primary.SESSION) {
    return parseSessionCommand(normalizedArgs);
  }

  return parseRegularCommand(normalizedArgs, primaryCommand);
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

function findPrimaryCommand(args: string[]): Primary {
  // find first non-flag argument
  const command = args.find((arg) => !arg.startsWith("--"));
  return mapCommand(command || "");
}

function handleSpecialCases(primary: Primary, args: string[]): cliArgs | null {
  // Handle standalone flags
  if (args.length === 1) {
    if (args[0] === Flag.VERSION) {
      return { primary: Primary.VERSION, version: true } as cliArgs;
    }
    if (args[0] === Flag.HELP) {
      return { primary: Primary.HELP, help: true } as cliArgs;
    }
  }

  // Handle check command
  if (primary === Primary.CHECK) {
    const result: Partial<cliArgs> = { primary: Primary.CHECK };

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
            "INVALID_PROMPT",
          );
        }
        result.prompt = value;
      } else if (arg !== "check" && arg !== "prompt") {
        throw new ArgumentError(
          `Check command only accepts --verbose and --prompt flags, got: ${arg}`,
          "INVALID_CHECK_FLAGS",
        );
      }
      i++;
    }

    return result as cliArgs;
  }

  return null;
}

function parseSessionCommand(args: string[]): cliArgs {
  // Remove any leading 'prompt' if present
  const relevantArgs = args.filter((arg) => arg !== "prompt");

  if (relevantArgs.length < 2) {
    throw new ArgumentError(
      "Session command requires a subcommand (start/end/status)",
      "INVALID_SESSION",
    );
  }

  const subCommand = mapSessionSubCommand(relevantArgs[1]);
  if (!subCommand) {
    throw new ArgumentError(
      `Invalid session subcommand. Expected 'start', 'end', or 'status', got '${relevantArgs[1]}'`,
      "INVALID_SUBCOMMAND",
    );
  }

  validateNoExtraArgs(relevantArgs.slice(1), Primary.SESSION);

  return {
    primary: Primary.SESSION,
    subCommand,
  } as cliArgs;
}

function validateNoExtraArgs(args: string[], command: Primary): void {
  const nonFlagArgs = args.filter((arg) => !arg.startsWith("--"));
  if (nonFlagArgs.length > 1) {
    throw new ArgumentError(
      `${command} command cannot have additional arguments`,
      "UNEXPECTED_ARGS",
    );
  }
}

function parseRegularCommand(args: string[], primary: Primary): cliArgs {
  const result: Partial<cliArgs> = {
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
            "INVALID_MODEL",
          );
        result.model = value;
        break;
      case Flag.PROMPT:
        if (!value)
          throw new ArgumentError(
            "Prompt flag requires a value",
            "INVALID_PROMPT",
          );
        result.prompt = value;
        break;
      case Flag.COMMAND:
        if (!value)
          throw new ArgumentError(
            "Command flag requires a value",
            "INVALID_COMMAND",
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

  return result as cliArgs;
}

function validateCommandCombinations(args: Partial<cliArgs>): void {
  // Validate help/version can't be combined with other flags
  if (args.help || args.version) {
    const hasOtherFlags = Object.keys(args).some(
      (key) => key !== "help" && key !== "version" && key !== "primary",
    );
    if (hasOtherFlags) {
      throw new ArgumentError(
        `${args.help ? "Help" : "Version"} flag cannot be combined with other flags`,
        "INVALID_FLAG_COMBINATION",
      );
    }
  }
}

function mapCommand(cmd: string): Primary {
  const commandMap: Record<string, Primary> = {
    help: Primary.HELP,
    version: Primary.VERSION,
    session: Primary.SESSION,
    check: Primary.CHECK,
    prompt: Primary.EXECUTE,
  };

  return commandMap[cmd] || Primary.EXECUTE;
}

function mapSessionSubCommand(cmd: string): SessionSubCommand | undefined {
  const subCommandMap: Record<string, SessionSubCommand> = {
    start: SessionSubCommand.START,
    end: SessionSubCommand.END,
    status: SessionSubCommand.STATUS,
  };

  return subCommandMap[cmd];
}
