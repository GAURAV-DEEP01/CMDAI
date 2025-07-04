import clc from 'cli-color';
import {
  clearStdLine,
  loadingAnimation,
  ValidationSchema,
} from '../util/tools';
import { validateAndParseResponse } from '../util/responseValidation';
import { CLIArgs } from '../types/cliArgs';
import { config_g } from '../cmdai';
import dotenv from 'dotenv';
import os from 'os';
import { getStreamFromProvider } from '../util/provider';
import marked from '../util/cliMarkdown';
import { handleResponse } from './handleResponse';

dotenv.config({ path: `${os.homedir()}/.cmdai/.env` });
const MAX_RETRIES = 3;

export default async function queryLLM(
  userArgs: CLIArgs,
  input: string,
  retryCount: number = 0,
) {
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

        if ((!verbose && !isResponded) || askString) {
          let i = 0;
          interval = setInterval(() => {
            process.stdout.write(
              `\rThinking ${loadingAnimation[i++ % loadingAnimation.length]}`,
            );
          }, 50);
        }

        if (verbose) {
          process.stdout.write(chunk);
        }

        aiOutput += chunk;
        isResponded = true;
      }
    } finally {
      if (interval) {
        clearInterval(interval);
        clearStdLine();

        process.stdout.write('\r' + clc.erase.line);
        process.stdout.write('\r' + clc.erase.line);
      }
    }

    process.stdout.write('\n');
    if (askString) {
      process.stdout.write(await marked.parse(aiOutput));
    } else {
      const response = validateAndParseResponse(aiOutput);
      await handleResponse(response, userArgs);
    }
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
