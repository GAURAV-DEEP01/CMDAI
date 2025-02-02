import clc from "cli-color";

import { runCommand } from "../util/commandHistory";
import { clearLine } from "../util/tools";
import inquirer from "inquirer";

export async function handleResponse(
  response: {
    description: string;
    possible_fixes: string[];
    corrected_command: string;
    explanation?: string;
  },
  // todo type
  rl?: any
) {
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
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "analyze",
        message: `Run: ${response.corrected_command}? (y/n): `,
        default: true,
      },
    ]);
    clearLine();

    if (answer.analyze) {
      const [mainCommand, ...commandArgs] =
        response.corrected_command.split(" ");
      const { output, error } = await runCommand(
        mainCommand,
        commandArgs,
        true
      );
      if (error) {
        console.error("\n\x1b[1;31mError:\x1b[0m", error);
      } else {
        console.log("\n\x1b[1;32mOutput:\x1b[0m", output);
      }
    } else {
      console.log("\n\x1b[1;33mCommand not executed.\x1b[0m");
    }
  } catch (e) {
    console.log(e);
  }
}
