// Display help message
export function showHelp(DEFAULT_MODEL: string) {
  console.log(`Usage: clai [options] <command>

    If no command is provided, clai will automatically rerun the last executed command.

    Commands:
      clai                        // Runs the last executed bash, zsh, or powershell command and feeds the output to an AI model.
      clai session start          // Starts a session to store commands and their outputs. (No other flags allowed)
      clai session end            // Ends the current session, stopping the storage of commands and outputs. (No other flags allowed)
      clai session status         // Displays the current session status (whether it's running or not).
      clai check                  // Checks the previous command from the session log and feeds it to the AI model. (Only works in session mode)

    Options:
      --model="<model_name>"      Specify the AI model to use (default: ${DEFAULT_MODEL})
      --prompt="<text>"           Provide a custom prompt for the model
      --verbose                   Enable detailed output
      --help                      Show this help message
      --version                   Show the current version of the tool

    Examples:
      # Run a command with a specific model and verbose output
      clai --model="deepseek-r1:7b" --verbose --prompt="ls -la"

      # Run a command directly
      clai --prompt="echo 'Hello, world!'"

      # Rerun the last executed command
      clai

      # Start a session to store commands and its outputs
      clai session start

      # Check the last command stored in session and feed it to the AI model (inside a session)
      clai check

      # End the current session
      clai session end

      # View the status of the current session
      clai session status
  `);
}

export function showVersion() {
  console.log("0.1.0");
}
