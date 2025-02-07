import { execSync } from 'child_process';
import clc from 'cli-color';
import { CLIArgs } from '../types/cliArgs';
import { config } from '../clai';

export async function checkLLM(userArg: CLIArgs) {
  if (config.provider != 'ollama' && userArg.model) {
    process.stderr.write(
      `${clc.red('Error:')} The specified model can only be used with a local LLM provider.\n`,
    );
    process.exit(1);
  }
  const model = userArg.model || config.model;

  if (!model) {
    process.stderr.write(`${clc.red('Error:')} Model is not defined\n`);
    process.exit(1);
  }

  // Check if Ollama is installed
  if (config.provider === 'ollama') {
    try {
      execSync('which ollama', { stdio: 'ignore' });
    } catch (error) {
      process.stderr.write(
        `${clc.red('Error')} Ollama is not installed.Please install it to proceed.\nVisit ${clc.blue.underline(
          'https://ollama.com/download',
        )}\n`,
      );
      process.exit(1);
    }
  }

  if (config.provider === 'ollama') {
    try {
      execSync(`ollama list | grep ${model}`, {
        stdio: 'ignore',
      });
    } catch (error) {
      process.stderr.write(
        `The model "${model}" is not downloaded.Please download it to proceed.\n`,
      );
      process.stderr.write(
        `Run: ${clc.bold('ollama pull ')}${clc.green(model)}\n`,
      );
      process.exit(1);
    }
  }
}
