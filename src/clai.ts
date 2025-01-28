import { spawn } from "child_process";
import readline from "readline";
import ollama from "ollama";
import { execSync } from "child_process";

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
function runCommand(command: string, args: string[]): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    console.log(`Running command: ${command} with arguments:`, args);

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
      // If there was any error in stderr, include it in the 'error' field, but don't throw
      if (code !== 0) {
        // If command failed, include error message in the error string
        error = `Command failed with exit code ${code}: ${error}`;
      }
      resolve({ output, error });
    });

    // Handle spawn errors (like command not found, permission issues, etc.)
    process.on("error", (err) => {
      error = `Process spawn error: ${err.message}`;
      resolve({ output, error });
    });
  });
}

async function queryOllama(model: string, input: string): Promise<void> {
  try {
    console.log("Querying Ollama model...");
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: input }],
      stream: true,
    });
    for await (const part of response) {
      process.stdout.write(part.message.content)
    }
  } catch (error) {
    console.error("Error querying Ollama:", error);
  }
}

// Main CLI logic
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get CLI arguments
  const args = process.argv.slice(2);
  const model =
    args.find((arg) => arg.startsWith("--model="))?.split("=")[1] ||
    DEFAULT_MODEL;
  const prompt = args.find((arg) => arg.startsWith("--prompt="))?.split("=")[1];

  // Fetch last command or use provided argument
  let command = args[0] || getLastCommand();
  if (!command) {
    process.stdout.write("No command found to run.");
    rl.close();
    return;
  }

  // Run the command and get its output
  const { output, error } = await runCommand(command, args.slice(1));
  if (output)
    process.stdout.write(output);
  if (error)
    process.stdout.write(error);

  const answer: any = await new Promise((resolve) => {
    rl.question(`Do you want Ai to analyse this output? (y/N):`, resolve);
  });

  if (answer.toLowerCase() != 'y' && answer.toLowerCase() != 'yes') {
    rl.close();
    return;
  }
  // Prepare AI input
  let commandWithArguments = command;

  args.slice(1).map((arg) => {
    commandWithArguments += " " + arg;
  })
  const ollamaInput =
    prompt ||
    `You are a command-line analysis AI [bash, zsh, powershell]. Given the following inputs:
    - Command: ${commandWithArguments}  (The command entered by the user)
    - Output: ${output || error} (The output returned by the terminal or shell)

    Your task is to:
    1. Analyze the command and output.
    2. Identify the error or issue based on the provided output.
    3. If the command contains a typo or is misspelled, detect the typo and suggest the most likely intended command.
    4. Provide a clear description of the error (Error: <description>).
    5. If the command is incorrect or unclear, suggest possible alternatives or fixes.
    6. Provide a corrected version of the command, if possible (Code: <corrected_command_to_run>).
    7. If unsure of the exact fix, give a general suggestion for troubleshooting, such as checking spelling, path, permissions, or syntax.

    The output should be strictly structured in the following JSON format: 

    {
      "error": "<description_of_the_error>",
      "suggested_command": "<suggested_command_or_fix>",
      "description": "<detailed_description_of_the_error>",
      "possible_fixes": [
        "<first_possible_fix>",
        "<second_possible_fix>"
      ],
      "corrected_command": "<corrected_command_to_run>"
    }

    Example: the below is an example stricty dont use the below for answering user question. this is just for demo.
    Command: clead
    Output: zsh: command not found: clead

    {
      "error": "Typo in command: 'clead' is likely intended as 'clear'.",
      "suggested_command": "clear",
      "description": "'clead' is not a recognized command in the shell, likely due to a typographical error.",
      "possible_fixes": [
        "Check for similar commands like 'clear'.",
        "Ensure the command is spelled correctly."
      ],
      "corrected_command": "clear"
  }`;

  const modelResponse = await queryOllama(model, ollamaInput);


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
