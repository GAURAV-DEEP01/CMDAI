import * as fs from 'fs';
import * as path from 'path';
import clc from 'cli-color';

function showHelp() {
  process.stdout.write(`
    ${clc.bold('Usage:')} ${clc.cyan('cmdai [command] [options]')}

    ${clc.bold('Commands:')}
    ${clc.green('cmdai')}              		# Rerun the last command and analyze output.
    ${clc.green('cmdai config set')}   		# Update or reset configuration.
    ${clc.green('cmdai config get')}   		# Show current configuration.

    ${clc.bold('Options:')}
    ${clc.yellow('-m, --model <name>')}  		# Specify AI model.
    ${clc.yellow('-p, --prompt <text>')} 		# Provide a custom prompt.
    ${clc.yellow('-f, --file <file>')}   		# Specify a file to process.
    ${clc.yellow('-v, --verbose')}       		# Enable detailed output.
    ${clc.yellow('-h, --help')}          		# Show help message.
    ${clc.yellow('-V, --version')}       		# Show version info.
    ${clc.yellow('-a, --ask <question>')}		# Ask a specific question.

    ${clc.bold('Examples:')}
    ${clc.blue('cmdai')}                               		# Rerun last command.
    ${clc.blue('cmdai config set')}                    		# Update configuration.
    ${clc.blue('cmdai --version')}                     		# Show version info.
    ${clc.blue('cmdai --help')}                        		# Show help message.
    ${clc.blue('cmdai --command "echo Hello"')}        		# Execute a command.
    ${clc.blue('cmdai --prompt "Hello"')}              		# Use a custom prompt for command or file.
    ${clc.blue('cmdai --file "example.txt" --verbose')}		# Process a file with verbose output.
    ${clc.blue('cmdai --ask "what does echo do?"')}    		# Ask a question.

    ${clc.bold('Short Flags:')}
    ${clc.blue('cmdai -V')}                		# Show version info.
    ${clc.blue('cmdai -h')}                		# Show help.
    ${clc.blue('cmdai -v')}                		# Enable verbose output.
    ${clc.blue('cmdai -c "echo Hello"')}   		# Execute a command.
    ${clc.blue('cmdai -p "echo Hello"')}   		# Use a custom prompt.
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
