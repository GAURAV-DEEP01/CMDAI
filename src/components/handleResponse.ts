import clc from "cli-color";
import { runCommand } from "../util/commandHistory";
import {
  CommandAnalysis,
  FileAnalysis,
  ResponseType,
} from "../types/responseAnalysis";
import { CLIArgs } from "../types/cliArgs";
import { analyzeCommandExecution } from "../util/analysisHandler";
import inquirer from "inquirer";
import { clearStdLine } from "../util/tools";

export async function handleResponse(
  response: ResponseType,
  userArgs: CLIArgs
) {
  if (isCommandAnalysis(response)) {
    await handleCommandResponse(response, userArgs);
  } else {
    handleFileResponse(response);
  }
}

function isCommandAnalysis(
  response: ResponseType
): response is CommandAnalysis {
  return (response as CommandAnalysis).corrected_command !== undefined;
}

async function handleCommandResponse(
  response: CommandAnalysis,
  userArgs: CLIArgs
) {
  process.stdout.write(clc.bold.underline("Command Validation Results\n"));
  process.stdout.write(
    clc.blue.bold("Description:") + ` ${response.description}\n`
  );

  if (response.explanation) {
    process.stdout.write(
      clc.blue.bold("Explanation:") + ` ${response.explanation}\n`
    );
  }

  process.stdout.write(clc.blue.bold("Possible Fixes:\n"));
  response.possible_fixes.forEach((fix, index) => {
    process.stdout.write(`  ${index + 1}. ${fix}\n`);
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

    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "analyze",
        message: `Run analysis with this result?`,
        default: true,
      },
    ]);
    clearStdLine();

    if (!answer.analyze) process.exit(1);

    await analyzeCommandExecution({
      command: response.corrected_command,
      output,
      error,
      userArgs,
    });
  } catch (e) {
    console.error(e);
  }
}

function handleFileResponse(response: FileAnalysis) {
  process.stdout.write(clc.bold.underline("File Analysis Results\n"));
  process.stdout.write(
    clc.blue.bold("File Type:") + ` ${response.file_type}\n`
  );
  process.stdout.write(clc.blue.bold("Summary:") + ` ${response.summary}\n`);

  process.stdout.write(clc.blue.bold("\nIssues Found:\n"));
  response.issues.forEach((issue, index) => {
    process.stdout.write(`  ${index + 1}. ${issue}\n`);
  });

  process.stdout.write(clc.blue.bold("\nRecommendations:\n"));
  response.recommendations.forEach((recommendation, index) => {
    process.stdout.write(`  ${index + 1}. ${recommendation}\n`);
  });

  process.stdout.write(
    clc.blue.bold("\nSecurity Analysis:") + ` ${response.security_analysis}\n`
  );
}
