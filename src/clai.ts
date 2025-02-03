#!/usr/bin/env node
import { showInfo } from "./components/info";
import { parseCLIArgs } from "./components/argParser";
import { CLIArgs } from "./types/cliArgs";
import { initializeConfig } from "./util/configHandler";
import { checkLLM } from "./util/checkLLM";
import { handlePrimaryCommand } from "./components/handlePrimaryCommand";

async function main() {
  try {
    const config = await initializeConfig();
    const DEFAULT_MODEL = config.model;

    await checkLLM();

    let userArgs: CLIArgs = parseCLIArgs();

    if (showInfo(userArgs, DEFAULT_MODEL))
      process.exit(0);

    await handlePrimaryCommand(userArgs, DEFAULT_MODEL);

  } catch (error) {
    console.log(`Unexpected error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Critical error during execution:", err);
  process.exit(1);
});

