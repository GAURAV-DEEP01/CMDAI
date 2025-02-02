import { exec } from 'child_process';
import { CommandExecutionError } from '../types/errors';

export async function executeCommand(
  command: string,
  args: string[] = [],
  verbose: boolean = false
): Promise<{ output: string; error: string }> {
  return new Promise((resolve, reject) => {
    if (verbose) console.log(`Executing: ${command} ${args.join(' ')}`);

    const child = exec(
      `${command} ${args.join(' ')}`,
      { encoding: 'utf-8' },
      (error, stdout, stderr) => {
        if (error) {
          reject(new CommandExecutionError(
            `Command failed: ${error.message}`,
            error.code || 1
          ));
        } else {
          resolve({
            output: stdout.trim(),
            error: stderr.trim()
          });
        }
      }
    );

    // Handle process termination signals
    process.on('SIGINT', () => {
      child.kill('SIGINT');
      reject(new CommandExecutionError('Command interrupted by user', 130));
    });
  });
}
