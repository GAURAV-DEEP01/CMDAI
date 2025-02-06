#!/usr/bin/env node
import { showInfo } from "./components/info";
import { parseCLIArgs } from "./components/parseCLIArgs";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import { checkLLM } from "./util/checkLLM";
import { handlePrimaryCommand } from "./components/handlePrimaryCommand";
import { Config } from "./types/config";

export let config: Config;

async function main() {
  try {
    let userArgs: CLIArgs = parseCLIArgs();

    if (showInfo(userArgs)) process.exit(0);
    if (!config) return;

    await checkLLM(userArgs);

    await handlePrimaryCommand(userArgs);
  } catch (error) {
    console.error(
      `Unexpected error: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  }
}

(async () => {
  try {
    config = await initializeConfig();
    await main();
  } catch (err) {
    console.error("Critical error during execution:", err);
    process.exit(1);
  }
})();
