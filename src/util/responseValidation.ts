import { z } from "zod";
import { ResponseType } from "../types/responseAnalysis";

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

// Validate and parse using zod
export const validateAndParseResponse = (response: string): ResponseType => {
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
