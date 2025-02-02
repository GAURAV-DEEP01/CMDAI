import { execSync } from 'child_process';

export function performSystemCheck(verbose: boolean = false): boolean {
  try {
    if (verbose) console.log("Checking system dependencies...");

    // Check Ollama availability
    execSync('ollama --version', { stdio: 'pipe' });

    if (verbose) console.log("System check passed");
    return true;
  } catch (error) {
    console.error("System check failed:");
    console.error("Ollama not found. Please install from https://ollama.ai/");
    return false;
  }
}
