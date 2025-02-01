import { ChildProcess, execSync, spawn } from "child_process";

// Helper: Fetch the last command from shell history
export function getSessionCommandLog(): string {
  //to do retuns log of
  return "getsessioncommand";
}

//   main()
//    if !session or and check
//      exit
//    if session and check
//
//clai
//clai --command="echo 'hello'"
//clai check

export function runCommand(
  command: string,
  args: string[],
  verbose: boolean = false
): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    if (verbose) {
      process.stdout.write(`Running command: ${command} ${args.join(" ")}`);
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

    // Handle the spawnedProcess exit
    spawnedProcess.on("close", (code) => {
      if (code !== 0) {
        error = `Command failed with exit code ${code}:\n ${error}`;
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
