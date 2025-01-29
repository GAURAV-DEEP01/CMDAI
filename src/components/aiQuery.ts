import ollama from "ollama";

interface CommandAnalysis {
  error: string;
  suggested_command: string;
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
  common_mistakes?: string[];
  learning_resources?: string[];
}

export default async function aiQuery(
  model: string,
  input: string,
  verbose: boolean = false
) {
  try {
    console.log(`Querying ${model} model...`);
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: input }],
      stream: true,
    });
    let thinkingLogged = false;
    let aiOutput: string = "";
    for await (const part of response) {
      aiOutput += part.message.content;
      if (!verbose) {
        process.stdout.write(part.message.content);
      } else if (!thinkingLogged) {
        console.log("Thinking...");
        thinkingLogged = true;
      }
    }
    console.log("AI response received:\n", aiOutput);

    return parseAnalysisResponse(aiOutput);
  } catch (error) {
    console.error("Error querying Ollama:", error);
  }
}
export const parseAnalysisResponse = (response: string): CommandAnalysis => {
  // Use regex to extract the JSON block between ```json and ```
  const jsonMatch = response.match(/```json([\s\S]*?)```/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI output");
  }

  // Clean the JSON string
  const jsonString = jsonMatch[1].trim();

  try {
    // Parse the JSON string
    const parsed = JSON.parse(jsonString) as CommandAnalysis;

    // Validate required fields
    if (
      !parsed.error ||
      !parsed.suggested_command ||
      !parsed.description ||
      !Array.isArray(parsed.possible_fixes) ||
      !parsed.corrected_command
    ) {
      throw new Error("Invalid response format: missing required fields");
    }

    // Add defaults for optional fields
    return {
      ...parsed,
      explanation: parsed.explanation || "",
      common_mistakes: parsed.common_mistakes || [],
      learning_resources: parsed.learning_resources || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse command analysis response: ${error}`);
  }
};
