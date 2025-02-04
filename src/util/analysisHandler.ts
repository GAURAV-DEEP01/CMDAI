import { defaultPrompt, filePrompt } from "../data/PromptLLM";
import { handleResponse } from "../components/handleResponse";
import queryLLM from "../components/queryLLM";
import inquirer from "inquirer";
import { clearStdLine } from "./tools";
import { CLIArgs } from "../types/cliArgs";

export async function analyzeCommandExecution(params: {
  command?: string;
  output?: string;
  error?: string;
  userArgs: CLIArgs;
  fileContent?: string;
}) {
  const { userArgs, fileContent } = params;

  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "analyze",
      message: `Run analysis with ${userArgs.model}?`,
      default: true,
    },
  ]);
  clearStdLine();

  if (!answer.analyze) process.exit(0);

  let input: string;
  if (fileContent) {
    input = userArgs.prompt
      ? filePrompt(fileContent, userArgs.prompt)
      : filePrompt(fileContent);
  } else {
    input = userArgs.prompt
      ? defaultPrompt(
          params.command!,
          params.output || "",
          params.error || "",
          userArgs.prompt
        )
      : defaultPrompt(params.command!, params.output || "", params.error || "");
  }

  try {
    const response = await queryLLM(
      userArgs.model!,
      input,
      userArgs.verbose,
      !!fileContent,
      0
    );

    await handleResponse(response);
  } catch (error) {
    console.error(
      "\nAnalysis failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}
