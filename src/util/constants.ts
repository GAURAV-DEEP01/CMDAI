export enum Primary {
  HELP = "help",
  VERSION = "version",
  SESSION = "session",
  CHECK = "check",
  EXECUTE = "execute",
  EXECUTE_PREVIOUS = "execute_previous"
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
