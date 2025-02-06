import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider";
import { streamText } from "ai";
import clc from "cli-color";
import { clearStdLine, loadingAnimation } from "../util/tools";
import { ResponseType } from "../types/responseAnalysis";
import { validateAndParseResponse } from "../util/responseValidation";
import { CLIArgs } from "../types/cliArgs";
import { config } from "../clai";
import dotenv from "dotenv";
import os from "os";
dotenv.config({ path: `${os.homedir()}/.clai/.env` });
const MAX_RETRIES = 3;

export default async function queryLLM(
  userArgs: CLIArgs,
  input: string,
  retryCount: number = 0
): Promise<ResponseType> {
  const { verbose, filePath } = userArgs;

  if (!config) process.exit(1);

  const model = userArgs.model || config.model;

  const { provider } = config;
  const isFile = !!filePath;

  try {
    if (retryCount !== 0) {
      process.stdout.write(
        `Attempt ${retryCount + 1}/${MAX_RETRIES} with ${model}\n`
      );
    }

    const VALIDATION_SCHEMA = `// JSON Validation Requirements ${isFile
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

    let interval: NodeJS.Timeout | null = null;
    let i = 0;
    let connecting: NodeJS.Timeout | null = null;

    // Connection animation
    connecting = setInterval(() => {
      process.stdout.write(
        `\rConnecting to model ${loadingAnimation[i++ % loadingAnimation.length]
        }`
      );
    }, 50);

    // Route to appropriate provider
    let aiOutput = "";
    const fullPrompt =
      retryCount > 0
        ? `${input}\n\nCORRECT FORMAT:\n${VALIDATION_SCHEMA}`
        : input;

    // Get the appropriate provider client
    let responseStream: AsyncIterable<string>;
    switch (provider) {
      case "google":
        responseStream = (
          queryGemini(model, fullPrompt, process.env.GOOGLE_API_KEY!)
        ).textStream;
        break;
      case "openai":
        responseStream = (
          queryOpenai(model, fullPrompt, process.env.OPENAI_API_KEY!)
        ).textStream;
        break;
      case "deepseek":
        responseStream = (
          queryDeepseek(model, fullPrompt, process.env.DEEPSEEK_API_KEY!)
        ).textStream;
        break;
      case "anthropic":
        responseStream = (
          queryAnthropic(
            model,
            fullPrompt,
            process.env.ANTHROPIC_API_KEY!
          )
        ).textStream;
        break;
      case "ollama":
        responseStream = (queryOllama(model, fullPrompt)).textStream;
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    process.stdout.write(clc.erase.line);

    try {
      let isResponded = false;
      for await (const chunk of responseStream) {
        if (!verbose && !isResponded) {
          clearInterval(connecting);
          clearStdLine();
          isResponded = true;
          let i = 0;
          interval = setInterval(() => {
            process.stdout.write(
              `\rThinking ${loadingAnimation[i++ % loadingAnimation.length]}`
            );
          }, 50);
        }
        aiOutput += chunk;
        if (verbose) {
          process.stdout.write(chunk);
        }
      }
    } finally {
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
      return await queryLLM(userArgs, input, retryCount + 1);
    }
    process.stderr.write(
      clc.red(
        `Error: AI response validation failed after ${MAX_RETRIES} tries\n`
      )
    );
    process.exit(1);
  }
}

// Update provider functions to use streamText
function queryGemini(model: string, input: string, apiKey: string) {
  const google = createGoogleGenerativeAI({
    apiKey,
  });
  return streamText({
    model: google(model),
    prompt: input,
  });
}

function queryOpenai(model: string, input: string, apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });
  return streamText({
    model: openai(model),
    prompt: input,
  });
}

function queryDeepseek(model: string, input: string, apiKey: string) {
  const deepseek = createDeepSeek({
    apiKey,
  });
  return streamText({
    model: deepseek(model),
    prompt: input,
  });
}

function queryAnthropic(model: string, input: string, apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });
  return streamText({
    model: anthropic(model),
    prompt: input,
  });
}

function queryOllama(model: string, input: string) {
  const ollama = createOllama();
  return streamText({
    model: ollama(model),
    prompt: input,
  });
}
