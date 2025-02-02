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
  const analysisPrompt = params.customPrompt
    ? params.customPrompt
    : defaultPrompt(params.command, params.output, params.error);

  if (params.verbose) {
    console.log("\nAnalysis Prompt:\n", analysisPrompt);
  }

  try {
    const response = await queryLLM(
      params.model,
      analysisPrompt,
      params.verbose
    );

    // Handle the LLM response
    await handleResponse(response);

  } catch (error) {
    console.error("\nAnalysis failed:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}
