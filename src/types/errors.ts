export class CommandExecutionError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.exitCode = exitCode;
    this.name = 'CommandExecutionError';
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
  }
}
