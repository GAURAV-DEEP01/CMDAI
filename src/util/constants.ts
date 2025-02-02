export enum Primary {
  HELP = "help",
  VERSION = "version",
  SESSION = "session",
  CHECK = "check",
  EXECUTE = "execute",
  CONFIG = "config",
}

export enum SessionSubCommand {
  START = "start",
  END = "end",
  STATUS = "status"
}

export enum Flag {
  MODEL = "--model",
  PROMPT = "--prompt",
  VERBOSE = "--verbose",
  VERSION = "--version",
  HELP = "--help",
  COMMAND = "--command"
}
