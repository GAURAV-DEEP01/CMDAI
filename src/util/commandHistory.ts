import { execSync, spawn } from 'child_process';
import inquirer from 'inquirer';
import { clearStdLine } from '../util/tools';
import clc from 'cli-color';

export function runCommand(
  command: string,
  args: string[],
  verbose: boolean = false,
  isRunningPreviousCmd?: boolean,
): Promise<{ output: string; error: string }> {
  return new Promise(async (resolve) => {
    if (isRunningPreviousCmd) {
      try {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'analyze',
            message: `Do you want to run: ${command} ${args.join(' ')}?`,
            default: true,
          },
        ]);
        clearStdLine();
        if (!answer.analyze) {
          process.exit(0);
        }
      } catch (error) {
        process.exit(1);
      }
    }
    if (verbose)
      process.stdout.write(`Running command: ${command} ${args.join(' ')}\n`);

    const spawnedProcess = spawn(command, args, { shell: true });
    let output = '';
    let error = '';
    let timeout: NodeJS.Timeout;

    let stdoutBuffer = '';
    let stderrBuffer = '';

    const processData = (
      data: string,
      buffer: string,
      prefix: string,
      isError: boolean,
    ): { newBuffer: string; processed: string } => {
      buffer += data;
      const lines = buffer.split(/\r?\n/);
      const newBuffer = lines.pop() || '';
      const stream = isError ? process.stderr : process.stdout;
      lines.forEach((line) => {
        stream.write(`${prefix}${line}\n`);
      });
      return {
        newBuffer,
        processed: lines.join('\n') + (newBuffer ? '' : '\n'),
      };
    };

    // Handle data on stdout
    spawnedProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      const result = processData(
        dataStr,
        stdoutBuffer,
        clc.green.bold('Output: '),
        false,
      );
      stdoutBuffer = result.newBuffer;
    });

    // Handle data on stderr
    spawnedProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      error += dataStr;
      const result = processData(
        dataStr,
        stderrBuffer,
        clc.red.bold('Error: '),
        true,
      );
      stderrBuffer = result.newBuffer;
    });

    timeout = setTimeout(async () => {
      try {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'analyze',
            message: `Process running for too long, Do you want to kill the process?`,
            default: true,
          },
        ]);
        clearStdLine();
        if (answer.analyze) {
          spawnedProcess.kill();
        }
      } catch (error) {
        process.stderr.write('Exited\n');
        process.exit(1);
      }
    }, 10000);

    // Handle process exit
    const finalFlush = () => {
      // Flush remaining stdout
      if (stdoutBuffer.length > 0) {
        process.stdout.write(clc.green.bold('Output: ') + stdoutBuffer + '\n');
        output += stdoutBuffer;
        stdoutBuffer = '';
      }
      // Flush remaining stderr
      if (stderrBuffer.length > 0) {
        process.stderr.write(clc.red.bold('Error: ') + stderrBuffer + '\n');
        error += stderrBuffer;
        stderrBuffer = '';
      }
    };

    spawnedProcess.on('close', (code) => {
      clearTimeout(timeout);
      finalFlush();

      if (code !== 0) {
        if (code !== null) {
          error = `\nCommand failed with exit code ${code}:\n${error}`;
        } else {
          error = `\nCommand exited\n${error}`;
        }
      }
      resolve({ output, error });
    });

    spawnedProcess.on('error', (err) => {
      clearTimeout(timeout);
      finalFlush();
      error = `Process spawn error: ${err.message}`;
      resolve({ output, error });
    });
  });
}

export function getLastCommand(offset: number = 1): string {
  try {
    const shell = process.env.SHELL || '';
    let historyCommand: string;

    if (shell.includes('zsh')) {
      const historyFile = process.env.HISTFILE || '~/.zsh_history';
      historyCommand = `tail -n ${
        offset + 1
      } ${historyFile} | head -n 1 | sed 's/^: [0-9]*:[0-9];//'`;
    } else if (shell.includes('bash')) {
      const historyFile = `${process.env.HOME}/.bash_history`;
      historyCommand = `tail -n ${offset} ${historyFile} | head -n 1`;
    } else {
      process.stderr.write(
        `${clc.red('Error:')} Unsupported shell. Please provide a command manually.\n`,
      );
      return '';
    }

    const command = execSync(historyCommand, { shell: shell })
      .toString()
      .trim();
    if (command.includes('clai')) {
      return getLastCommand(offset + 1);
    }
    return command;
  } catch (error) {
    process.stderr.write(
      `${clc.red('Error: ')} Failed to fetch the last command from history.\n`,
    );
    return '';
  }
}
