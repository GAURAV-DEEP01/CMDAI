import * as fs from 'fs';
import * as path from 'path';
import clc from 'cli-color';

function showHelp() {
  process.stdout.write(`
    ${clc.bold('Usage:')} ${clc.cyan('clai [command] [options]')}

    ${clc.bold('Commands:')}
    ${clc.green('clai')}              		# Rerun the last command and analyze output.
    ${clc.green('clai config set')}   		# Update or reset configuration.
    ${clc.green('clai config get')}   		# Show current configuration.

    ${clc.bold('Options:')}
    ${clc.yellow('-m, --model <name>')}  		# Specify AI model.
    ${clc.yellow('-p, --prompt <text>')} 		# Provide a custom prompt.
    ${clc.yellow('-f, --file <file>')}   		# Specify a file to process.
    ${clc.yellow('-v, --verbose')}       		# Enable detailed output.
    ${clc.yellow('-h, --help')}          		# Show help message.
    ${clc.yellow('-V, --version')}       		# Show version info.
    ${clc.yellow('-a, --ask <question>')}		# Ask a specific question.

    ${clc.bold('Examples:')}
    ${clc.blue('clai')}                               		# Rerun last command.
    ${clc.blue('clai config set')}                    		# Update configuration.
    ${clc.blue('clai --version')}                     		# Show version info.
    ${clc.blue('clai --help')}                        		# Show help message.
    ${clc.blue('clai --command "echo Hello"')}        		# Execute a command.
    ${clc.blue('clai --prompt "Hello"')}              		# Use a custom prompt for command or file.
    ${clc.blue('clai --file "example.txt" --verbose')}		# Process a file with verbose output.
    ${clc.blue('clai --ask "what does echo do?"')}    		# Ask a question.

    ${clc.bold('Short Flags:')}
    ${clc.blue('clai -V')}                		# Show version info.
    ${clc.blue('clai -h')}                		# Show help.
    ${clc.blue('clai -v')}                		# Enable verbose output.
    ${clc.blue('clai -c "echo Hello"')}   		# Execute a command.
    ${clc.blue('clai -p "echo Hello"')}   		# Use a custom prompt.
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
  const configPath = path.resolve(__dirname, '../../package.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    process.stdout.write(`Current version: ${config.version}\n`);
  } catch (error) {
    console.error(`${clc.red('Error reading version:')}`, error);
  }
}
