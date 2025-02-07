import clc from 'cli-color';
import {
  clearStdLine,
  loadingAnimation,
  ValidationSchema,
} from '../util/tools';
import { ResponseType } from '../types/responseAnalysis';
import { validateAndParseResponse } from '../util/responseValidation';
import { CLIArgs } from '../types/cliArgs';
import { config_g } from '../clai';
import dotenv from 'dotenv';
import os from 'os';
import {
  queryGemini,
  queryOpenai,
  queryDeepseek,
  queryAnthropic,
  queryOllama,
} from '../util/provider';

dotenv.config({ path: `${os.homedir()}/.clai/.env` });
const MAX_RETRIES = 3;

export default async function queryLLM(
  userArgs: CLIArgs,
  input: string,
  retryCount: number = 0,
): Promise<ResponseType> {
  const { verbose, filePath, askString } = userArgs;
  const { provider } = config_g;

  const model = userArgs.model || config_g.model;
  if (retryCount !== 0) {
    process.stdout.write(
      `Attempt ${retryCount + 1}/${MAX_RETRIES} with ${model}\n`,
    );
  }

  try {
    let interval: NodeJS.Timeout | null = null;
    let i = 0;
    let connecting: NodeJS.Timeout | null = null;

    // Connection animation
    connecting = setInterval(() => {
      process.stdout.write(
        `\rConnecting to model ${
          loadingAnimation[i++ % loadingAnimation.length]
        }`,
      );
    }, 50);

    // Route to appropriate provider
    let aiOutput = '';
    const fullPrompt =
      retryCount > 0 && !askString
        ? `${input}\n\nCORRECT FORMAT:\n${ValidationSchema(!!filePath)}`
        : input;

    // Get the appropriate provider client
    let responseStream: AsyncIterable<string>;
    switch (provider) {
      case 'google':
        responseStream = queryGemini(
          model,
          fullPrompt,
          process.env.GOOGLE_API_KEY!,
        ).textStream;
        break;
      case 'openai':
        responseStream = queryOpenai(
          model,
          fullPrompt,
          process.env.OPENAI_API_KEY!,
        ).textStream;
        break;
      case 'deepseek':
        responseStream = queryDeepseek(
          model,
          fullPrompt,
          process.env.DEEPSEEK_API_KEY!,
        ).textStream;
        break;
      case 'anthropic':
        responseStream = queryAnthropic(
          model,
          fullPrompt,
          process.env.ANTHROPIC_API_KEY!,
        ).textStream;
        break;
      case 'ollama':
        responseStream = queryOllama(model, fullPrompt).textStream;
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    clearInterval(connecting);
    clearStdLine();
    process.stdout.write('\r' + clc.erase.line + '\n');
    try {
      let isResponded = false;
      for await (const chunk of responseStream) {
        if (!verbose && !isResponded && !askString) {
          clearInterval(connecting);
          clearStdLine();
          isResponded = true;
          let i = 0;
          interval = setInterval(() => {
            process.stdout.write(
              `\rThinking ${loadingAnimation[i++ % loadingAnimation.length]}`,
            );
          }, 50);
        }
        aiOutput += chunk;
        if (verbose || askString) {
          process.stdout.write(chunk);
        }
      }
    } finally {
      if (interval) {
        clearInterval(interval);
        process.stdout.write(clc.erase.line);
      }
    }
    process.stdout.write('\n');
    if (askString) return aiOutput;
    return validateAndParseResponse(aiOutput);
  } catch (error) {
    if (retryCount < MAX_RETRIES - 1) {
      console.error(
        `Retrying: ${error instanceof Error ? error.message : error}`,
      );
      return await queryLLM(userArgs, input, retryCount + 1);
    }
    process.stderr.write(
      clc.red(
        `${clc.red('Error:')}AI response validation failed after ${MAX_RETRIES} tries\n`,
      ),
    );
    process.exit(1);
  }
}
