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


export const clearLine = () => {
    // Clear everything from the cursor to the end of the line
    process.stdout.write("\x1b[1A");
    process.stdout.write("\x1b[2K");
    process.stdout.write("\r");
  };
  