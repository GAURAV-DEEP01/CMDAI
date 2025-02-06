#!/usr/bin/env node
import { showInfo } from "./components/info";
import { parseCLIArgs } from "./components/argParser";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import { checkLLM } from "./util/checkLLM";
import { handlePrimaryCommand } from "./components/handlePrimaryCommand";

async function main() {
  try {
    let userArgs: CLIArgs = parseCLIArgs();

    if (showInfo(userArgs)) process.exit(0);

    const config = await initializeConfig();

    userArgs.model = userArgs.model || config.model;

    await checkLLM(config, userArgs.model);

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
    await main();
  } catch (err) {
    console.error("Critical error during execution:", err);
    process.exit(1);
  }
})();
