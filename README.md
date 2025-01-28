# CLAI - Command Line AI

**CLAI** is an innovative command-line tool that allows you to interact with a powerful AI to analyze shell commands and their outputs. By utilizing advanced AI models like Ollama, CLAI can help you troubleshoot errors, suggest fixes, and even provide detailed analysis for any command you run in your terminal.

## Features
- **Command History Integration**: CLAI can fetch and use the last command executed in your shell to analyze, saving you time and effort.
- **Error Detection and Suggestions**: After running a command, CLAI analyzes the output, identifies possible errors or issues, and suggests solutions or alternative commands.
- **AI-Powered Analysis**: Using advanced AI models like Ollama, CLAI provides structured insights into errors, including potential fixes, alternative commands, and explanations.
- **Interactive CLI**: The tool interacts with you through a simple command-line interface, asking if you'd like AI assistance after a command is executed.

## How It Works
1. **Run a Command**: Use any command available in your shell, and CLAI captures its output.
2. **AI Analysis**: Once the output is captured, CLAI asks if you want AI analysis of the result. If yes, it sends the command and output to an AI model.
3. **Get Insights**: The AI returns a structured JSON output, containing:
   - Description of the error.
   - Suggested fixes or alternative commands.
   - A corrected version of the command if possible.
4. **Optional Command Execution**: After receiving the AI's analysis, you can choose to run the suggested command or explore possible fixes further.

## Use Cases
- **Debugging**: Helps troubleshoot errors in shell commands with accurate suggestions.
- **Learning**: A great tool for learning command-line usage, as it can explain errors and suggest improvements.
- **Automation**: Automate the analysis of common shell commands in a script or workflow.

CLAI is built to streamline your command-line experience, making it a powerful assistant for developers and sysadmins alike.
