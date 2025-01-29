#!/usr/bin/env node
import { spawn } from "child_process";
import readline from "readline";
import ollama from "ollama";
import { execSync } from "child_process";
import { defaultPrompt } from "./data/defaultPrompt";
import showHelp from "./components/help";

// Default Model
const DEFAULT_MODEL = "deepseek-r1:1.5b";

// Helper: Fetch the last command from shell history
function getLastCommand(): string {
  try {
    const shell = process.env.SHELL || "";
    let historyCommand: string;

    if (shell.includes("zsh")) {
      const historyFile = process.env.HISTFILE || "~/.zsh_history";
      historyCommand = `tail -n 2 ${historyFile} | head -n 1 | sed 's/^: [0-9]*:[0-9];//'`;
    } else if (shell.includes("bash")) {
      const historyFile = process.env.HISTFILE || "~/.bash_history";
      historyCommand = `tail -n 2 ${historyFile} | head -n 1`;
    } else {
      console.error("Unsupported shell. Please provide a command manually.");
      return "";
    }

    return execSync(historyCommand, { shell: shell }).toString().trim();
  } catch (error) {
    console.error("Failed to fetch the last command from history.");
    return "";
  }
}

// Helper: Run a shell command and capture its output
function runCommand(
  command: string,
  args: string[],
  verbose: boolean = false
): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    // if (verbose) {
    console.log(
      `Running command: ${command} with` +
        (args.length > 0 ? ` arguments: ` + args : ` no arguments`)
    );
    // } else {
    //   console.log("Running command");
    // }

    const process = spawn(command, args, { shell: true });
    let output = "";
    let error = "";

    // Handle data on stdout
    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Handle data on stderr (error stream)
    process.stderr.on("data", (data) => {
      error += data.toString();
    });

    // Handle the process exit
    process.on("close", (code) => {
      if (code !== 0) {
        error = `Command failed with exit code ${code}: ${error}`;
      }
      resolve({ output, error });
    });

    process.on("error", (err) => {
      error = `Process spawn error: ${err.message}`;
      resolve({ output, error });
    });
  });
}

async function queryOllama(
  model: string,
  input: string,
  verbose: boolean
): Promise<void> {
  try {
    console.log(`Querying ${model} model...`);
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: input }],
      stream: true,
    });
    let thinkingLogged = false;
    for await (const part of response) {
      if (verbose) {
        process.stdout.write(part.message.content);
      } else if (!thinkingLogged) {
        console.log("Thinking...");
        thinkingLogged = true;
      }
    }
  } catch (error) {
    console.error("Error querying Ollama:", error);
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    showHelp(DEFAULT_MODEL);
    rl.close();
    return;
  }

  const model =
    args.find((arg) => arg.startsWith("--model="))?.split("=")[1] ||
    DEFAULT_MODEL;
  const prompt = args.find((arg) => arg.startsWith("--prompt="))?.split("=")[1];
  const verbose = args.includes("--verbose");
  if (verbose)
    console.log("model:", model, ", prompt:", prompt ?? `"No prompt provided"`);

  let command = prompt || getLastCommand();
  let commandArgs: string[] = [];

  // Split command into parts if it's from history
  if (!args.includes(command)) {
    // Command came from history
    const parts = command.split(/\s+/);
    command = parts[0];
    commandArgs = parts.slice(1);
  }

  // Get remaining non-flag arguments for the command
  const remainingArgs = args.filter(
    (arg) =>
      arg !== command &&
      !arg.startsWith("--") &&
      args.indexOf(arg) > args.indexOf(command)
  );

  commandArgs = commandArgs.concat(remainingArgs);

  if (!command) {
    process.stdout.write("No command found to run.");
    rl.close();
    return;
  }

  const { output, error } = await runCommand(command, commandArgs, verbose);
  if (output) process.stdout.write(output);
  if (error) process.stdout.write(error);

  const answer: any = await new Promise((resolve) => {
    rl.question(`Do you want ${model} to analyse this output? (y/n):`, resolve);
  });

  if (answer.toLowerCase() != "y" && answer.toLowerCase() != "yes") {
    rl.close();
    return;
  }

  let commandWithArguments = command;
  args.slice(1).map((arg) => {
    commandWithArguments += " " + arg;
  });
  const ollamaInput =
    prompt || defaultPrompt(commandWithArguments, output, error);
  await queryOllama(model, ollamaInput, verbose);

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

main().catch((err) => {
  console.error("Error in main function:", err);
});
