export enum Primary {
  EXECUTE = "execute",
  SESSION = "session",
  CHECK = "check",
  VERSION = "version",
  HELP = "help",
  FILE = "file",
  CONFIG = "config",
}

export enum SessionSubCommand {
  START = "start",
  END = "end",
  STATUS = "status",
}

export enum ConfigSubCommand {
  GET = "get",
  SET = "set",
}

export enum Flag {
  VERBOSE = "--verbose",
  VERSION = "--version",
  HELP = "--help",
  COMMAND = "--command",
  PROMPT = "--prompt",
  MODEL = "--model",
  FILE = "--file",
}

export enum ShortFlag {
  VERBOSE = "-vb",
  VERSION = "-v",
  HELP = "-h",
  COMMAND = "-c",
  PROMPT = "-p",
  MODEL = "-m",
  FILE = "-f",
}
