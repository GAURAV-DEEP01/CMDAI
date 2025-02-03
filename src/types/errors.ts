export interface ValidationError {
  message: string;
  code: string;
}

export class ArgumentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "ArgumentError"; // Set custom error name
  }
}

export class CommandExecutionError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.exitCode = exitCode;
    this.name = "CommandExecutionError";
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
  }
}
