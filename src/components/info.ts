import * as fs from "fs";
import * as path from "path";
import clc from "cli-color";

function showHelp() {
  process.stdout.write(`
    ${clc.bold("Usage:")} ${clc.cyan("clai [command] [options]")}
    
    ${clc.bold("Commands:")}
    ${clc.green(
    "clai"
  )}                   Rerun the previous command and analyze output using ollama.
    ${clc.green("clai config get")}        Show current configuration.
    ${clc.green("clai config set")}        Update or reset configuration.
  
  ${clc.bold("Options:")}
    ${clc.yellow("--model=<name>")}, ${clc.yellow("-m=<name>")}           Specify AI model.
    ${clc.yellow("--prompt=<text>")}, ${clc.yellow("-p=<text>")}          Provide a custom AI prompt.
    ${clc.yellow("--verbose")}, ${clc.yellow("-vb")}                      Enable detailed output.
    ${clc.yellow("--help")}, ${clc.yellow("-h")}                          Show this help message.
    ${clc.yellow("--version")}, ${clc.yellow("-v")}                       Show version information.
    ${clc.yellow("--file=<file>")},${clc.yellow("-v")}                    Specify a file to process.
  
  ${clc.bold("Examples:")}
    ${clc.blue("clai")}                    # Rerun last command.
    ${clc.blue('clai --model="deepseek-r1:7b" --verbose')}
    ${clc.blue("clai --prompt=\"echo 'Hello, world!'\"")}\n
    ${clc.blue("clai --file=\"example.txt\"")}
  `);
}

export function showInfo(userArgs: any) {
  if (userArgs.help) {
    showHelp();
    return true;
  }

  if (userArgs.version) {
    showVersion();
    return true;
  }
  return false;
}

function showVersion() {
  const configPath = path.resolve(__dirname, "../../package.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    process.stdout.write(`Current version: ${config.version}\n`);
  } catch (error) {
    console.error(`${clc.red("Error reading version:")}`, error);
  }
}

// v2 additional commands:
// ${clc.blue("clai session start")}
// ${clc.blue("clai check")}              # Works only in session mode.
// ${clc.blue("clai session end")}
// ${clc.blue("clai session status")}

// ${clc.green(
//   "clai session start"
// )}     Start a session (stores commands and outputs).
// ${clc.green("clai session end")}       End the current session.
// ${clc.green("clai session status")}    Show session status.
// ${clc.green(
//   "clai check"
// )}             Analyze last command (session mode only).
