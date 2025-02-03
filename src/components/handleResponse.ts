import clc from "cli-color";

import { runCommand } from "../util/commandHistory";

export async function handleResponse(response: {
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
}) {
  process.stdout.write(clc.bold.underline("Validation Results\n"));
  process.stdout.write(
    clc.blue.bold("Description:") + ` ${response.description}\n`
  );

  if (response.explanation) {
    process.stdout.write(
      clc.blue.bold("Explanation:") + ` ${response.explanation}\n`
    );
  }

  process.stdout.write(clc.blue.bold("Possible Fixes:"));
  response.possible_fixes.forEach((fix, index) => {
    process.stdout.write(`  ${index + 1}. ${fix}`);
  });

  process.stdout.write(
    clc.green.bold("\nCorrected Command:") + ` ${response.corrected_command}\n`
  );

  try {
    const [mainCommand, ...commandArgs] = response.corrected_command.split(" ");
    const { output, error } = await runCommand(mainCommand, commandArgs, true);
    if (error) {
      process.stderr.write(clc.red.bold("\nError:") + ` ${error}\n`);
    } else {
      process.stdout.write(clc.green.bold("\nOutput:") + ` ${output}\n`);
    }
  } catch (e) {
    console.error(e);
  }
}
