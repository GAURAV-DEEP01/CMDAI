import { readConfig } from "./tools";
import { initializeConfig } from "./configHandler";

// not fixed
async function pingEndpoint(urlString: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    const response = await fetch(urlString, { signal: controller.signal });
    clearTimeout(timeoutId); // Clear the timeout if the request succeeds
    return response.ok; // Returns true if status is 2xx
  } catch (error) {
    return false; // Returns false if the request fails or times out
  }
}

export async function checkLLM() {
  let config = readConfig();
  let baseUrl = config.baseUrl;

  // If baseUrl is not configured, initialize it
  if (!baseUrl) {
    process.stderr.write("No baseUrl configured\n");
    config = await initializeConfig();
    baseUrl = config.baseUrl;
  }

  // Default URL for Ollama
  if (config.provider === "ollama" && !baseUrl) {
    baseUrl = "http://localhost:11434";
  }

  // Ensure baseUrl is defined
  if (!baseUrl) {
    process.stderr.write("Error: No baseUrl configured\n");
    process.exit(0);
  }

  // Ping the endpoint
  const isAlive = await pingEndpoint(baseUrl);
  if (!isAlive) {
    process.stderr.write(`Error: Unable to connect to LLM at ${baseUrl}\n`);
    process.stderr.write("Please check if the service is running\n");
    process.exit(0);
  }
}
