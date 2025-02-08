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
import { getStreamFromProvider } from '../util/provider';

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
    let connecting: NodeJS.Timeout | null = null;
    let i = 0;

    connecting = setInterval(() => {
      process.stdout.write(
        `\rConnecting to model ${
          loadingAnimation[i++ % loadingAnimation.length]
        }`,
      );
    }, 50);

    let aiOutput = '';
    const fullPrompt =
      retryCount > 0 && !askString
        ? `${input}\n\nCORRECT FORMAT:\n${ValidationSchema(!!filePath)}`
        : input;

    let responseStream: AsyncIterable<string> = getStreamFromProvider(
      provider,
      model,
      fullPrompt,
    );

    try {
      let isResponded = false;
      for await (const chunk of responseStream) {
        if (!isResponded) {
          clearInterval(connecting);
          clearStdLine();
          process.stdout.write('\r' + clc.erase.line);
          process.stdout.write('\r' + clc.erase.line);
        }
        if (!verbose && !isResponded && !askString) {
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
        isResponded = true;
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
