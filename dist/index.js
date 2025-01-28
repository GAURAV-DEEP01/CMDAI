"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const readline_1 = __importDefault(require("readline"));
const ollama_1 = __importDefault(require("ollama"));
const child_process_2 = require("child_process");
const DEFAULT_MODEL = "deepseek-r1:1.5b";
function getLastCommand() {
    try {
        const shell = process.env.SHELL || "";
        let historyCommand;
        if (shell.includes("zsh")) {
            const historyFile = process.env.HISTFILE || "~/.zsh_history";
            historyCommand = `tail -n 2 ${historyFile} | head -n 1 | sed 's/^: [0-9]*:[0-9];//'`;
        }
        else if (shell.includes("bash")) {
            const historyFile = process.env.HISTFILE || "~/.bash_history";
            historyCommand = `tail -n 2 ${historyFile} | head -n 1`;
        }
        else {
            console.error("Unsupported shell. Please provide a command manually.");
            return "";
        }
        return (0, child_process_2.execSync)(historyCommand, { shell: shell }).toString().trim();
    }
    catch (error) {
        console.error("Failed to fetch the last command from history.");
        return "";
    }
}
async function runCommand(command) {
    return new Promise((resolve) => {
        const process = (0, child_process_1.spawn)(command, { shell: true });
        let output = "";
        let error = "";
        process.stdout.on("data", (data) => {
            output += data.toString();
        });
        process.stderr.on("data", (data) => {
            error += data.toString();
        });
        process.on("close", () => {
            resolve({ output, error });
        });
    });
}
async function queryOllama(model, input) {
    try {
        console.log("Querying Ollama model...");
        const response = await ollama_1.default.chat({
            model,
            messages: [{ role: "user", content: input }],
        });
        console.log("Model response received:", response);
        return "No response from the model.";
    }
    catch (error) {
        console.error("Error querying Ollama:", error);
        return "Failed to query the model.";
    }
}
async function main() {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const args = process.argv.slice(2);
    const model = args.find((arg) => arg.startsWith("--model="))?.split("=")[1] ||
        DEFAULT_MODEL;
    const prompt = args.find((arg) => arg.startsWith("--prompt="))?.split("=")[1];
    let command = args[0] || getLastCommand();
    if (!command) {
        console.log("No command found to run.");
        rl.close();
        return;
    }
    console.log(`Command to analyze: "${command}"\n`);
    const { output, error } = await runCommand(command);
    const ollamaInput = prompt ||
        `You are a command-line analysis AI. Given the following inputs:
    - Command: ${command}  (The command entered by the user)
    - Output: ${output || error} (The output returned by the terminal or shell)

    Your task is to:
    1. Analyze the command and output.
    2. Identify the error or issue based on the provided output.
    3. If the command contains a typo or is misspelled, detect the typo and suggest the most likely intended command.
    4. Provide a clear description of the error (Error: <description>).
    5. If the command is incorrect or unclear, suggest possible alternatives or fixes.
    6. Provide a corrected version of the command, if possible (Code: <corrected_command_to_run>).
    7. If unsure of the exact fix, give a general suggestion for troubleshooting, such as checking spelling, path, permissions, or syntax.

    The output should be structured in the following format for easy parsing:

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

    Example:

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
    console.log("Model response:", modelResponse);
    const errorMatch = modelResponse.match(/Error:\s*(.+)/i);
    const codeMatch = modelResponse.match(/Code:\s*(.+)/i);
    if (!errorMatch || !codeMatch) {
        console.log("Invalid response format from the model.");
        rl.close();
        return;
    }
    const suggestedError = errorMatch[1].trim();
    const suggestedCommand = codeMatch[1].trim();
    console.log("\nError Description:\n", suggestedError);
    console.log("\nSuggested Command to Run:\n", suggestedCommand);
    rl.question("\nDo you want to run this command? (yes/no): ", (answer) => {
        if (answer.toLowerCase() === "yes") {
            console.log(`\nRunning: ${suggestedCommand}\n`);
            const execResult = (0, child_process_1.spawn)(suggestedCommand, {
                shell: true,
                stdio: "inherit",
            });
            execResult.on("close", () => rl.close());
        }
        else {
            console.log("Command not executed.");
            rl.close();
        }
    });
}
main().catch((err) => {
    console.error("Error in main function:", err);
});
