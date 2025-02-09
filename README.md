<pre align="center">
 ██████╗  ███╗   ███╗  ██████╗    █████╗   ██╗
██╔════╝  ████╗ ████║  ██╔══██╗  ██╔══██╗  ██║
██║       ██╔████╔██║  ██║  ██║  ███████║  ██║
██║       ██║╚██╔╝██║  ██║  ██║  ██╔══██║  ██║
╚██████╗  ██║ ╚═╝ ██║  ██████╔╝  ██║  ██║  ██║
 ╚═════╝  ╚═╝     ╚═╝  ╚═════╝   ╚═╝  ╚═╝  ╚═╝
</pre>

# <p align="center"><strong align="center">Command Line AI</strong></p>

**cmdai** is an innovative command-line tool that leverages AI to analyze shell commands and their outputs. By utilizing Ollama, cmdai can help you troubleshoot errors, suggest fixes, and provide detailed insights into your terminal commands.

## Features

- **Command History Integration**: cmdai fetches and analyzes the last executed command.
- **Error Detection and Suggestions**: It identifies errors and suggests solutions or alternative commands.
- **AI-Powered Analysis**: Uses advanced AI models like Ollama to provide structured insights.
- **Interactive CLI**: Engages with users to offer AI assistance after a command execution.

## Installation

### Automatic Installation

To install cmdai, run the following command:

```bash
curl -sSL <INSTALLATION_SCRIPT_URL> | sh
```

This script will handle all dependencies and setup.

To ensure that users who want to set up cmdai manually can do so without issues, I'll add detailed manual setup steps to the README. Here's the updated section:

---

## Manual Installation

If you prefer to set up cmdai manually, follow these steps:

### 1. Clone the Repository

First, clone the cmdai repository to your desired location (e.g., `~/cmdai`):

```bash
git clone https://github.com/GAURAV-DEEP01/cmdai.git ~/cmdai
cd ~/cmdai
```

### 2. Create the `.cmdai` Directory

cmdai requires a directory to store its configuration and other files. Create the `.cmdai` directory in your home folder:

```bash
mkdir -p ~/.cmdai
```

### 3. Configure Shell History Settings

Depending on your shell, you may need to configure your shell's history settings to ensure cmdai works correctly.

#### For **Bash** Users:

Add the following lines to your `~/.bashrc` file:

```bash
# cmdai Configuration
PROMPT_COMMAND="history -a"
shopt -s histappend
```

Then, reload your `.bashrc`:

```bash
source ~/.bashrc
```

#### For **Zsh** Users:

No additional configuration is required for Zsh users.

### 4. Install Dependencies

Ensure you have the necessary dependencies installed. cmdai requires `git` and `npm`. If they are not installed, you can install them using your package manager.

For example, on Ubuntu:

```bash
sudo apt update
sudo apt install git npm
```

### 5. Build the Project

Navigate to the cloned repository and build the project:

```bash
cd ~/cmdai
npm install
npm run package
```

### 6. Verify Installation

After completing the above steps, cmdai should be set up and ready to use. You can verify the installation by running:

```bash
cmdai --version
```

If everything is set up correctly, you should see the version information for cmdai.

---

## Usage

### Basic Commands

```bash
cmdai                      # Rerun the last command and analyze the output
cmdai config get           # Show the current configuration
cmdai config set           # Update or reset the configuration
```

### Options

```bash
--model=<name>  | -m <name>  # Specify AI model
--prompt=<text> | -p <text>  # Provide a custom AI prompt
--verbose       | -v         # Enable detailed output
--help          | -h         # Show help message
--version       | -V         # Show version information
```

### Examples

```bash
cmdai                        # Rerun the last command
cmdai --model="deepseek-r1:7b" --verbose
cmdai --prompt="echo 'Hello, world!'"
```

---

## How It Works

1. **Run a Command**: cmdai captures the last executed command.
2. **AI Analysis**: It sends the command and its output to an AI model for analysis.
3. **Get Insights**: The AI provides a structured response with:
   - Error description
   - Suggested fixes or alternative commands
   - A corrected version of the command if applicable
4. **Optional Execution**: Users can choose to run the suggested command.

---

## Use Cases

- **Debugging**: Quickly troubleshoot shell command errors.
- **Learning**: Get explanations and improvements for commands.
- **Automation**: Integrate with scripts for automated command analysis.
