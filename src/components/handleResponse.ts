import { runCommand } from "../util/commandHistory";

export async function handleResponse(
  response: {
    description: string;
    possible_fixes: string[];
    corrected_command: string;
    explanation?: string;
  },
  // todo type
  rl: any
) {
  console.log("\n\x1b[1mValidation Result:\x1b[0m");
  console.log(`\x1b[1;34mDescription:\x1b[0m ${response.description}\n`);

  if (response.explanation) {
    console.log(`\x1b[1;34mExplanation:\x1b[0m ${response.explanation}\n`);
  }

  console.log("\x1b[1;34mPossible Fixes:\x1b[0m");
  response.possible_fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });                                     

  console.log(
    `\n\x1b[1;32mSuggested Command:\x1b[0m ${response.corrected_command}`
  );
  try {
    const answer: any = await new Promise((resolve) => {
      rl.question(`Run this command? (y/n):`, resolve);
    });

    if (answer === "y" || answer === "yes") {
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
