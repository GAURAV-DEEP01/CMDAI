import clc from "cli-color";

import { runCommand } from "../util/commandHistory";

export async function handleResponse(response: {
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
}) {
  process.stdout.write(`${clc.bold.underline("Validation Results\n")}`);
  process.stdout.write(
    `\x1b[1;34mDescription:\x1b[0m ${response.description}\n`
  );

  if (response.explanation) {
    process.stdout.write(
      `\x1b[1;34mExplanation:\x1b[0m ${response.explanation}\n`
    );
  }

  process.stdout.write("\x1b[1;34mPossible Fixes:\x1b[0m");
  response.possible_fixes.forEach((fix, index) => {
    process.stdout.write(`  ${index + 1}. ${fix}`);
  });

  console.log(
    `\n\x1b[1;32mCorrected Command:\x1b[0m ${response.corrected_command}`
  );

  try {
    const [mainCommand, ...commandArgs] = response.corrected_command.split(" ");
    const { output, error } = await runCommand(mainCommand, commandArgs, true);
    if (error) {
      console.error("\n\x1b[1;31mError:\x1b[0m", error);
    } else {
      console.log("\n\x1b[1;32mOutput:\x1b[0m", output);
    }
  } catch (e) {
    console.log(e);
  }
}
