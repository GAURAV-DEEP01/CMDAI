#!/usr/bin/env node
import { showInfo } from './components/info';
import { parseCLIArgs } from './components/parseCLIArgs';
import { CLIArgs } from './types/cliArgs';
import { initializeConfig } from './util/configHandler';
import { checkLLM } from './util/checkLLM';
import { handlePrimaryCommand } from './components/handlePrimaryCommand';
import { Config } from './types/config';
import clc from 'cli-color';

export let config_g: Config;

async function main() {
  try {
    let userArgs: CLIArgs = parseCLIArgs();

    if (showInfo(userArgs)) process.exit(0);

    config_g = await initializeConfig();

    await checkLLM(userArgs);

    await handlePrimaryCommand(userArgs);
  } catch (error) {
    console.error(
      `${clc.red('Unexpected error:')} ${
        error instanceof Error ? error.message : error
      }`,
    );
    process.exit(1);
  }
}

(async () => {
  try {
    await main();
  } catch (err) {
    console.error(`${clc.red('Critical error')} during execution:`, err);
    process.exit(1);
  }
})();
