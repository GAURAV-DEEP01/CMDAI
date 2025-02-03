import clc from "cli-color";

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

export function clearStdLine() {
  process.stdout.write(clc.erase.line);
}
