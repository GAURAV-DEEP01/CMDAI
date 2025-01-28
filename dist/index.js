"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
const readline_1 = __importDefault(require("readline"));
// Default Model
const DEFAULT_MODEL = "deepseek-r1:1.5b";
// Helper: Fetch the last command from shell history
function getLastCommand() {
    try {
        // Check if running zsh or bash and fetch the last command
        const shell = process.env.SHELL || "";
        let historyCommand;
        if (shell.includes("zsh")) {
            const historyFile = process.env.HISTFILE || "~/.zsh_history";
            // Fetch the last two commands and get the second one
            historyCommand = `tail -n 2 ${historyFile} | head -n 1 | sed 's/^: [0-9]*:[0-9];//'`;
        }
        else if (shell.includes("bash")) {
            const historyFile = process.env.HISTFILE || "~/.bash_history";
            // Fetch the last two commands and get the second one
            historyCommand = `tail -n 2 ${historyFile} | head -n 1`;
        }
        else {
            console.error("Unsupported shell. Please provide a command manually.");
            return "";
        }
        return (0, child_process_1.execSync)(historyCommand, { shell: shell }).toString().trim();
    }
    catch (error) {
        console.error("Failed to fetch the last command from history.");
        return "";
    }
}
// Helper: Run a shell command and capture its output
function runCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
// Helper: Send a query to the Ollama model
function queryOllama(model, input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Querying Ollama model...");
            const response = yield axios_1.default.post("http://localhost:11434/api/chat", {
                model,
                messages: [{ role: "user", content: input }],
            });
            return response.data.reply || "No response from the model.";
        }
        catch (error) {
            console.error("Error querying Ollama:", error.message);
            return "Failed to query the model.";
        }
    });
}
// Main CLI logic
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // Get CLI arguments
        const args = process.argv.slice(2);
        const model = ((_a = args.find((arg) => arg.startsWith("--model="))) === null || _a === void 0 ? void 0 : _a.split("=")[1]) ||
            DEFAULT_MODEL;
        const prompt = (_b = args.find((arg) => arg.startsWith("--prompt="))) === null || _b === void 0 ? void 0 : _b.split("=")[1];
        // Fetch last command or use provided argument
        let command = args[0] || getLastCommand();
        if (!command) {
            console.log("No command found to run.");
            rl.close();
            return;
        }
        console.log(`Command to analyze: "${command}"\n`);
        // Run the command and get its output
        const { output, error } = yield runCommand(command);
        // Prepare AI input
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
        const modelResponse = yield queryOllama(model, ollamaInput);
        console.log("\nModel Response:\n", modelResponse);
        // Parse and confirm the AI-suggested command
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
    });
}
main();
