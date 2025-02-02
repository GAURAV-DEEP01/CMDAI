export const loadingAnimation = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
];

export function clearLine() {
  // Clear everything from the cursor to the end of the line
  process.stdout.write("\x1b[1A\x1b[1A\x1b[2K");
  process.stdout.write("\r");
  process.stdout.write("\x1b[1B\n");
}

export function validateModelName(modelName: string): boolean {
  // Basic validation for model name format
  const validModelPattern = /^[a-z0-9\-_:]+$/i;
  return validModelPattern.test(modelName);
}

