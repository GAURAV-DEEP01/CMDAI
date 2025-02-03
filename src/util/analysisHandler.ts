import { defaultPrompt } from "../data/defaultPrompt";
import { handleResponse } from "../components/handleResponse";
import queryLLM from "../components/queryLLM";

export async function analyzeCommandExecution(params: {
  command: string;
  output: string;
  error: string;
  model: string;
  customPrompt?: string;
  verbose?: boolean;
}) {
  const input = params.customPrompt
    ? defaultPrompt(
        params.command,
        params.output,
        params.error,
        params.customPrompt
      )
    : defaultPrompt(params.command, params.output, params.error);

  try {
    const response = await queryLLM(params.model, input, params.verbose, 0);

    // Handle the LLM response
    await handleResponse(response);
  } catch (error) {
    console.error(
      "\nAnalysis failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}
