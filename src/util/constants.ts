export enum Primary {
  EXECUTE = "execute",
  SESSION = "session",
  CHECK = "check",
  VERSION = "version",
  HELP = "help",
  CONFIG = "config" // Added new primary command
}

export enum SessionSubCommand {
  START = "start",
  END = "end",
  STATUS = "status"
}

export enum ConfigSubCommand { // Added new config subcommands
  GET = "get",
  SET = "set"
}

export enum Flag {
  VERBOSE = "--verbose",
  VERSION = "--version",
  HELP = "--help",
  COMMAND = "--command",
  PROMPT = "--prompt",
  MODEL = "--model",
  KEY = "--key",       // Added for config
  VALUE = "--value"    // Added for config
}
