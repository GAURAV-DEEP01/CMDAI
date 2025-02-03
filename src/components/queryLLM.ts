import ollama from "ollama";

import clc from "cli-color";
import { clearStdLine, loadingAnimation } from "../util/tools";
import { CommandAnalysis } from "../types/commandAnalysis";

const MAX_RETRIES = 3;

const VALIDATION_SCHEMA = `// JSON Validation Requirements
{
  "description": "string (technical explanation)",
  "possible_fixes": ["string", "...", "..."],
  "corrected_command": "string (directly executable)",
  "explanation": "string? (detailed analysis)",
}`;

export default async function queryLLM(
  model: string,
  input: string,

  //todo create custom prompt when true
  isDefaultPrompt: boolean,
  verbose: boolean = false,
  retryCount: number = 0
): Promise<CommandAnalysis> {
  try {
    process.stdout.write(
      `Attempt ${retryCount + 1}/${MAX_RETRIES} with ${model}\n`
    );

    process.stdout.write(`Thinking`);
    const response = await ollama.chat({
      model,
      messages: [
        {
          role: "user",
          content:
            retryCount > 0
              ? `${input}\n\nINVALID RESPONSE - CORRECT FORMAT:\n${VALIDATION_SCHEMA}`
              : input,
        },
      ],
      stream: true,
    });
    clearStdLine();

    let aiOutput = "";
    let interval: NodeJS.Timeout | null = null;

    // Start loading animation if not verbose
    if (!verbose) {
      let i = 0;
      interval = setInterval(() => {
        process.stdout.write(
          `\rThinking ${loadingAnimation[i++ % loadingAnimation.length]}`
        );
      }, 50);
    }

    try {
      for await (const part of response) {
        aiOutput += part.message.content;
        if (verbose) {
          process.stdout.write(part.message.content);
        }
      }
    } finally {
      // Cleanup loading animation
      if (interval) {
        clearInterval(interval);
        clearStdLine();
      }
    }

    process.stdout.write("\n");
    return validateAndParseResponse(aiOutput);
  } catch (error) {
    if (retryCount < MAX_RETRIES - 1) {
      console.log(
        `Retrying: ${error instanceof Error ? error.message : error}`
      );
      return await queryLLM(
        model,
        input,
        isDefaultPrompt,
        verbose,
        retryCount + 1
      );
    }
    process.stderr.write(
      clc.red(
        `Error: AI response validation failed after ${MAX_RETRIES} tries\n`
      )
    );
    process.exit(0);
  }
}

const validateAndParseResponse = (response: string): CommandAnalysis => {
  try {
    // Find the first instance of ```json
    const jsonStartIndex = response.indexOf("```json");
    if (jsonStartIndex === -1) {
      throw new Error("No JSON block found in the response.");
    }

    // Extract the content after ```json
    const jsonContent = response.substring(jsonStartIndex + "```json".length);

    // Find the closing ``` after the JSON block
    const jsonEndIndex = jsonContent.indexOf("```");
    if (jsonEndIndex === -1) {
      throw new Error("No closing ``` found for the JSON block.");
    }

    // Extract the JSON string and clean it
    const jsonString = jsonContent
      .substring(0, jsonEndIndex) // Extract the JSON block
      .trim() // Remove leading/trailing whitespace
      .replace(/[\u2018\u2019]/g, "'") // Handle smart quotes
      .replace(/[\u201C\u201D]/g, '"'); // Handle smart double quotes

    // Parse the JSON string
    const parsed: CommandAnalysis = JSON.parse(jsonString);

    // Schema validation
    const requiredFields = [
      "description",
      "possible_fixes",
      "corrected_command",
    ];

    const missingFields = requiredFields.filter((field) => !(field in parsed));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Command safety check
    if (!isValidCommand(parsed.corrected_command)) {
      throw new Error(`Invalid command: ${parsed.corrected_command}`);
    }

    // Type validation
    if (!Array.isArray(parsed.possible_fixes)) {
      throw new Error("possible_fixes must be an array");
    }

    // Enhanced validation
    if (
      parsed.corrected_command.includes("&&") ||
      parsed.corrected_command.includes("||")
    ) {
      throw new Error("Compound commands are not allowed");
    }

    return {
      description: parsed.description,
      possible_fixes: parsed.possible_fixes,
      corrected_command: sanitizeCommand(parsed.corrected_command),
      explanation: parsed.explanation || "",
    };
  } catch (error) {
    throw new Error(
      `Response validation failed: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
};

const isValidCommand = (command: string): boolean => {
  const forbiddenPatterns = [
    /rm\s+-rf/,
    /;\s*$/,
    /\b(wget|curl)\s+-O/,
    /(\$\(|`)/,
    />\s*\/dev/,
  ];
  return !forbiddenPatterns.some((pattern) => pattern.test(command));
};

const sanitizeCommand = (command: string): string => {
  return command
    .replace(/\bsudo\b/g, "") // Remove sudo for safety
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .trim();
};
