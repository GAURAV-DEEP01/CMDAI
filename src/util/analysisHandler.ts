import { defaultPrompt, filePrompt } from '../data/PromptLLM';
import queryLLM from '../components/queryLLM';
import { CLIArgs } from '../types/cliArgs';

export async function analyzeCommandExecution(params: {
  command?: string;
  output?: string;
  error?: string;
  userArgs: CLIArgs;
  fileContent?: string;
  filePath?: string;
  askString?: string;
}) {
  const { userArgs, fileContent, filePath, askString } = params;
  let input: string;

  if (askString) {
    input = askString;
  } else if (fileContent && filePath) {
    input = filePrompt(fileContent, filePath, userArgs.prompt || '');
  } else {
    input = defaultPrompt(
      params.command || '',
      params.output || '',
      params.error || '',
      userArgs.prompt || '',
    );
  }

  try {
    await queryLLM(userArgs, input, 0);
  } catch (error) {
    console.error(
      '\nAnalysis failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
}
