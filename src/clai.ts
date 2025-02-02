#!/usr/bin/env node
import readline from "readline";
import { showVersion, showHelp } from "./components/info";
import { Primary } from "./util/constants";
import { ArgumentError } from "./types/errors";
import { getLastCommand, runCommand } from "./util/commandHistory";
import { handleSessionCommand } from "./util/sessionHandeling";
import { defaultPrompt } from "./data/defaultPrompt";
import aiQuery from "./components/aiQuery";
import { handleResponse } from "./components/handleResponse";
import { parseCLIArgs } from "./util/argParser";
import fs from "fs";
import path from "path";
import { CLIArgs } from "./types/cliArgs";
import { clearLine } from "./util/tools";

// Default Model
const homeDir = require("os").homedir();
const configPath = path.join(homeDir, ".clai/config.json");

if (!fs.existsSync(configPath)) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        version: "0.1.0",
        session: true,
        model: "deepseek-r1:7b",
        api: "",
      },
      null,
      2
    )
  );
  process.stdout.write("Config file created at ~/.clai/config.json\n");
}

const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const DEFAULT_MODEL = config.model;

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let userArgs: CLIArgs | null = null;
  try {
    userArgs = parseCLIArgs();
    // Use the parsed arguments
  } catch (error) {
    if (error instanceof ArgumentError) {
      console.error(`Error (${error.code}): ${error.message}`);
    } else {
      console.error("Unexpected error:", error);
    }
  }

  if (!userArgs) {
    process.stderr.write("Error parsing arguments\n");
    return;
  }

  if (userArgs.help) {
    showHelp(DEFAULT_MODEL);
    return;
  }

  if (userArgs.version) {
    showVersion();
    return;
  }

  if (userArgs.primary == Primary.EXECUTE) {
    const commandList = getLastCommand().split(" ");
    const mainCommand = commandList[0];
    const commandArgs = commandList.slice(1);
    const { output, error } = await runCommand(
      mainCommand,
      commandArgs,
      userArgs.verbose
    );

    if (output) process.stdout.write(output);
    if (error) process.stdout.write(error);

    const answer: string = await new Promise((resolve) => {
      rl.question(
        `Do you want ${userArgs.model || DEFAULT_MODEL
        } to analyse this output? (y/n): `,
        (input) => {
          clearLine(); // Clear the line if the user inputs 'y' or 'yes'
          resolve(input);
        }
      );
    });

    if (answer.toLowerCase() != "y" && answer.toLowerCase() != "yes") {
      rl.close();
      return;
    }
    let commandWithArguments = mainCommand;
    commandArgs.map((arg) => {
      commandWithArguments += " " + arg;
    });
    const ollamaInput = defaultPrompt(
      commandWithArguments,
      output,
      error,
      userArgs.prompt
    );
    // console.log(ollamaInput);

    const response = await aiQuery(
      userArgs.model || DEFAULT_MODEL,
      ollamaInput,
      userArgs.verbose
    );
    console.dir(response, { depth: null });

    await handleResponse(response, rl);
  }

  if (userArgs.primary == Primary.CHECK) {
    process.stdout.write("is in check mode\n");
  }

  if (userArgs.primary === Primary.SESSION) {
    handleSessionCommand(userArgs);
  }

  // const { output, error } = await runCommand(commandName, command, verbose);
  // if (output) process.stdout.write(output);
  // if (error) process.stdout.write(error);
  //
  // const answer: any = await new Promise((resolve) => {
  //   rl.question(`Do you want ${model} to analyse this output? (y/n):`, resolve);
  // });
  //
  // if (answer.toLowerCase() != "y" && answer.toLowerCase() != "yes") {
  //   rl.close();
  //   return;
  // }
  //
  // let commandWithArguments = command;
  // args.slice(1).map((arg) => {
  //   commandWithArguments += " " + arg;
  // });
  // const ollamaInput =
  //   prompt || defaultPrompt(commandWithArguments, output, error);
  // await queryOllama(model, ollamaInput, verbose);
  //
  // dont remove the below commented code ill fix this later

  // console.log("Model response:", modelResponse); // Log the raw model response

  // Parse and confirm the AI-suggested command
  // const errorMatch = modelResponse.match(/Error:\s*(.+)/i);
  // const codeMatch = modelResponse.match(/Code:\s*(.+)/i);

  // if (!errorMatch || !codeMatch) {
  //   console.log("Invalid response format from the model.");
  //   rl.close();
  //   return;
  // }

  // const suggestedError = errorMatch[1].trim();
  // const suggestedCommand = codeMatch[1].trim();

  // console.log("\nError Description:\n", suggestedError);
  // console.log("\nSuggested Command to Run:\n", suggestedCommand);
  //
  // rl.question("\nDo you want to run this command? (yes/no): ", (answer) => {
  //   if (answer.toLowerCase() === "yes") {
  //     console.log(`\nRunning: ${suggestedCommand}\n`);
  //     const execResult = spawn(suggestedCommand, {
  //       shell: true,
  //       stdio: "inherit",
  //     });
  //     execResult.on("close", () => rl.close());
  //   } else {
  //     console.log("Command not executed.");
  //     rl.close();
  //   }
  // });
  rl.close();
}

main()
  .catch((err) => {
    console.error("Error in main function:", err);
  })
  .then(() => {
    process.exit(1);
  });
