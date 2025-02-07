export enum Primary {
  EXECUTE = 'execute',
  ASK = 'ask',
  SESSION = 'session',
  CHECK = 'check',
  VERSION = 'version',
  HELP = 'help',
  FILE = 'file',
  CONFIG = 'config',
}

export enum SessionSubCommand {
  START = 'start',
  END = 'end',
  STATUS = 'status',
}

export enum ConfigSubCommand {
  GET = 'get',
  SET = 'set',
}
