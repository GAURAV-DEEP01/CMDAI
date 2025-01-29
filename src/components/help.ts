// Display help message
export default function showHelp(DEFAULT_MODEL: string) {
  console.log(`Usage: clai [options] <command>
    
    If no command is provided, clai will automatically rerun the last executed command.

    Options:
      --model=<model_name>    Specify the AI model to use (default: ${DEFAULT_MODEL})
      --prompt=<text>         Provide a custom prompt for the model
      --verbose               Enable detailed output
      --help                  Show this help message

    Examples:
      # Run a command with a specific model and verbose output
      clai --model=deepseek-r1:1.5b --verbose --prompt="ls -la"

      # Run a command directly
      clai --prompt="echo "Hello, world!"

      # Rerun the last executed command
      clai
    `);
}
