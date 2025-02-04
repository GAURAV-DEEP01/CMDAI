#!/usr/bin/env node
import { showInfo } from "./components/info";
import { parseCLIArgs } from "./components/argParser";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import { checkLLM } from "./util/checkLLM";
import { handlePrimaryCommand } from "./components/handlePrimaryCommand";

// somethin
async function main() {
  try {
    let userArgs: CLIArgs = parseCLIArgs();

    if (showInfo(userArgs))
      process.exit(0);

    const config = await initializeConfig();
    const DEFAULT_MODEL = config.model;

    await checkLLM(config);

    await handlePrimaryCommand(userArgs, DEFAULT_MODEL);

  } catch (error) {
    console.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Critical error during execution:", err);
  process.exit(1);
});

