import { execSync, spawn } from "child_process";
import inquirer from "inquirer";
import { clearLine } from "../util/tools";

// Helper: Fetch the last command from shell history
export function getSessionCommandLog(): string {
  //to do retuns log of
  return "getsessioncommand";
}

export function runCommand(
  command: string,
  args: string[],
  verbose: boolean = false
): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    if (verbose) {
      process.stdout.write(`Running command: ${command} ${args.join(" ")}\n`);
    }
    const spawnedProcess = spawn(command, args, { shell: true });
    let output = "";
    let error = "";
    // Handle data on stdout
    spawnedProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Handle data on stderr (error stream)
    spawnedProcess.stderr.on("data", (data) => {
      error += data.toString();
    });
    setTimeout(async () => {
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "analyze",
          message: `Do you want to kill the process?`,
          default: true,
        },
      ]);
      clearLine();

      if (answer.analyze) {
        spawnedProcess.kill();
      }
    }, 10000);


    // Handle the spawnedProcess exit
    spawnedProcess.on("close", (code) => {
      if (code !== 0) {
        error = `Previous command failed with exit code ${code}:\n${error}`;
      }
      resolve({ output, error });
    });

    spawnedProcess.on("error", (err) => {
      error = `Process spawn error: ${err.message}`;
      resolve({ output, error });
    });
  });
}

// Helper: Run a shell command and capture its output
export function getLastCommand(): string {
  try {
    const shell = process.env.SHELL || "";
    let historyCommand: string;

    if (shell.includes("zsh")) {
      const historyFile = process.env.HISTFILE || "~/.zsh_history";
      historyCommand = `tail -n 2 ${historyFile} | head -n 1 | sed 's/^: [0-9]*:[0-9];//'`;
    } else if (shell.includes("bash")) {
      historyCommand = `history | tail -n 2 | head -n 1`;
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
