import { Primary, Flag, SessionSubCommand } from "./constants";
import { CLIArgs } from "./CLIArgs";
import { ArgumentError } from "../types/errors";

export function parseCLIArgs(): CLIArgs {
    const args = process.argv.slice(2);

    // Handle empty args case
    if (args.length === 0) {
        return { primary: Primary.EXECUTE };
    }

    // First, check for standalone flags that don't need additional processing
    if (args.length === 1) {
        if (args[0] === Flag.VERSION) {
            return { primary: Primary.VERSION, version: true } as CLIArgs;
        }
        if (args[0] === Flag.HELP) {
            return { primary: Primary.HELP, help: true } as CLIArgs;
        }
    }

    // Parse session commands first as they have special rules
    if (args[0] === Primary.SESSION) {
        return parseSessionCommand(args);
    }

    // Handle check primary
    if (args[0] === Primary.CHECK) {
        return { primary: Primary.CHECK } as CLIArgs;
    }

    // Parse regular commands and flags
    return parseRegularCommand(args);
}

function parseSessionCommand(args: string[]): CLIArgs {
    if (args.length < 2) {
        throw new ArgumentError("Session command requires a subcommand (start/end/status)", "INVALID_SESSION");
    }

    const subCommand = mapSessionSubCommand(args[1]);
    if (!subCommand) {
        throw new ArgumentError(
            `Invalid session subcommand. Expected 'start', 'end', or 'status', got '${args[1]}'`,
            "INVALID_SUBCOMMAND"
        );
    }

    // Session commands should not have additional flags
    if (args.length > 2) {
        throw new ArgumentError(
            `Session ${subCommand} command cannot have additional flags`,
            "INVALID_SESSION_FLAGS"
        );
    }

    return {
        primary: Primary.SESSION,
        subCommand
    } as CLIArgs;
}

function parseRegularCommand(args: string[]): CLIArgs {
    const result: Partial<CLIArgs> = {
        primary: Primary.EXECUTE
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        // Handle flags with values
        if (arg.startsWith("--")) {
            const [flag, ...valueParts] = arg.split("=");
            const value = valueParts.join("="); // Rejoin in case value contains =

            switch (flag) {
                case Flag.MODEL:
                    if (!value) throw new ArgumentError("Model flag requires a value", "INVALID_MODEL");
                    result.model = value;
                    break;
                case Flag.PROMPT:
                    if (!value) throw new ArgumentError("Prompt flag requires a value", "INVALID_PROMPT");
                    result.prompt = value;
                    break;
                case Flag.COMMAND:
                    if (!value) throw new ArgumentError("Command flag requires a value", "INVALID_COMMAND");
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
        } else if (i === 0) {
            // If first argument isn't a flag, treat it as a command
            result.primary = mapCommand(arg);
        } else {
            throw new ArgumentError(`Unexpected argument: ${arg}`, "UNEXPECTED_ARG");
        }

        i++;
    }

    // Validate command requirements
    // Now allow execution with just a prompt (no command required)
    if (result.primary === Primary.EXECUTE && !result.commandStr && !result.prompt) {
        throw new ArgumentError("Execute command requires either --command or --prompt flag", "MISSING_COMMAND_OR_PROMPT");
    }

    return result as CLIArgs;
}

function mapCommand(cmd: string): Primary {
    const commandMap: Record<string, Primary> = {
        help: Primary.HELP,
        version: Primary.VERSION,
        session: Primary.SESSION,
        check: Primary.CHECK
    };

    return commandMap[cmd] || Primary.EXECUTE;
}

function mapSessionSubCommand(cmd: string): SessionSubCommand | undefined {
    const subCommandMap: Record<string, SessionSubCommand> = {
        start: SessionSubCommand.START,
        end: SessionSubCommand.END,
        status: SessionSubCommand.STATUS
    };

    return subCommandMap[cmd];
}
