import { defaultPrompt, filePrompt } from "../data/PromptLLM";
import { handleResponse } from "../components/handleResponse";
import queryLLM from "../components/queryLLM";
import { CLIArgs } from "../types/cliArgs";

export async function analyzeCommandExecution(params: {
  command?: string;
  output?: string;
  error?: string;
  userArgs: CLIArgs;
  fileContent?: string;
  filePath?: string;
}) {
  const { userArgs, fileContent, filePath } = params;
  let input: string;
  if (fileContent && filePath) {
    input = userArgs.prompt
      ? filePrompt(fileContent, filePath, userArgs.prompt)
      : filePrompt(fileContent, filePath);
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
    const response = await queryLLM(userArgs, input, 0);

    await handleResponse(response, userArgs);
  } catch (error) {
    console.error(
      "\nAnalysis failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}
