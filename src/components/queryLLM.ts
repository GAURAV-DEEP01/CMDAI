import ollama from "ollama";
import clc from "cli-color";
import { z } from "zod";
import { loadingAnimation } from "../util/tools";
import { ResponseType } from "../types/responseAnalysis";

const MAX_RETRIES = 3;

export default async function queryLLM(
  model: string,
  input: string,
  verbose: boolean = false,
  isFile: boolean,
  retryCount: number = 0
): Promise<ResponseType> {
  try {
    if (retryCount !== 0)
      process.stdout.write(
        `Attempt ${retryCount + 1}/${MAX_RETRIES} with ${model}\n`
      );

    const VALIDATION_SCHEMA = `// JSON Validation Requirements ${
      isFile
        ? `{
    "file_type": "string (type of the file being analyzed)",
    "summary": "string (brief summary of the file)",
    "issues": ["string", "...", "..."],
    "recommendations": ["string", "...", "..."],
    "security_analysis": "string (detailed security analysis)"
  }`
        : `
  {
    "description": "string (technical explanation)",
    "possible_fixes": ["string", "...", "..."],
    "corrected_command": "string (directly executable)",
    "explanation": "string? (detailed analysis)",
  }`
    }`;

    let i = 0;
    let interval: NodeJS.Timeout | null = null;
    let connecting: NodeJS.Timeout | null = null;
    connecting = setInterval(() => {
      process.stdout.write(
        `\rConnecting to model ${
          loadingAnimation[i++ % loadingAnimation.length]
        }`
      );
    }, 50);

    const response = await ollama.chat({
      model,
      messages: [
        {
          role: "user",
          content:
            retryCount > 0
              ? `${input}\n\nCORRECT FORMAT:\n${VALIDATION_SCHEMA}`
              : input,
        },
      ],
      stream: true,
    });
    process.stdout.write(clc.erase.line);

    let aiOutput = "";

    clearInterval(connecting);
    // Start loading animation if not verbose
    if (!verbose) {
      let i = 0;
      interval = setInterval(() => {
        process.stdout.write(
          `\rThinking ${loadingAnimation[i++ % loadingAnimation.length]}`
        );
      }, 50);
    }
    process.stdout.write("\n");

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
        process.stdout.write(clc.erase.line);
      }
    }
    process.stdout.write("\n");
    return validateAndParseResponse(aiOutput);
  } catch (error) {
    if (retryCount < MAX_RETRIES - 1) {
      console.error(
        `Retrying: ${error instanceof Error ? error.message : error}`
      );
      return await queryLLM(model, input, verbose, isFile, retryCount + 1);
    }
    process.stderr.write(
      clc.red(
        `Error: AI response validation failed after ${MAX_RETRIES} tries\n`
      )
    );
    process.exit(0);
  }
}

const CommandResponseSchema = z
  .object({
    description: z.string(),
    possible_fixes: z.array(z.string()),
    corrected_command: z
      .string()
      .refine((cmd) => isValidCommand(cmd), {
        message: "Dangerous command detected",
      })
      .transform((cmd) => sanitizeCommand(cmd)),
    explanation: z.string().optional().default(""),
  })
  .strict();

const FileResponseSchema = z
  .object({
    file_type: z.string(),
    summary: z.string(),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
    security_analysis: z.string(),
  })
  .strict();

const ResponseSchema = z.union([CommandResponseSchema, FileResponseSchema]);

//v2 validate and parse using zod
const validateAndParseResponse = (response: string): ResponseType => {
  try {
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = response.match(jsonBlockRegex);

    if (!match?.[1]) throw new Error("No valid JSON code block found");

    const jsonString = match[1]
      .trim()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/^[\x00-\x1F]+/, "")
      .replace(/(\r\n|\n|\r)/gm, "");

    const rawData = JSON.parse(jsonString);
    const result = ResponseSchema.safeParse(rawData);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Validation failed:\n${errorMessages}\n`);
    }

    return result.data;
  } catch (error) {
    throw new Error(
      `Response validation failed: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
};

// Keep the existing helper functions unchanged
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
    .replace(/\bsudo\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};
