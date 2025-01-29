export interface ValidationError {
  message: string;
  code: string;
}

export class ArgumentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ArgumentError'; // Set custom error name
  }
}

