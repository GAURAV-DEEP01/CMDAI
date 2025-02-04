import { initializeConfig } from "./configHandler";
import { Config } from "../types/config";
import { execSync } from "child_process";
import clc from "cli-color";

// not fixed
async function pingEndpoint(urlString: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7-second timeout
    const response = await fetch(urlString, { signal: controller.signal });
    clearTimeout(timeoutId); // Clear the timeout if the request succeeds
    return response.ok; // Returns true if status is 2xx
  } catch (error) {
    return false; // Returns false if the request fails or times out
  }
}

export async function checkLLM(config: Config) {
  let baseUrl = config.baseUrl;

  // Check if Ollama is installed
  if (config.provider === "ollama") {
    try {
      execSync("which ollama", { stdio: "ignore" });
    } catch (error) {
      process.stderr.write(
        `Ollama is not installed. Please install it to proceed.\nVisit ${clc.blue.underline(
          "https://ollama.com/download"
        )}\n`
      );
      process.exit(1);
    }
  }

  // If baseUrl is not configured, initialize it
  if (!baseUrl) {
    process.stderr.write("No baseUrl configured\n");
    config = await initializeConfig();
    return await checkLLM(config);
  }

  // Default URL for Ollama
  if (config.provider === "ollama" || !baseUrl) {
    baseUrl = "http://localhost:11434";
  }

  // Ping the endpoint
  const isAlive = await pingEndpoint(baseUrl);
  if (!isAlive) {
    process.stderr.write(`Error: Unable to connect to LLM at ${baseUrl}\n`);
    process.stderr.write("Please check if the service is running\n");
    process.stderr.write(
      `Example: ${clc.bold("ollama run ")}${clc.green("<model_name>")}\n`
    );
    process.exit(0);
  }
}
