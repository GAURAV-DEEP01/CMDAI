import { initializeConfig } from "./configHandler";
import { Config } from "../types/config";
import { execSync } from "child_process";
import clc from "cli-color";

// to do use ai api from vercel
async function pingEndpoint(urlString: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(urlString, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function checkLLM(config: Config, model: string) {
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
    return await checkLLM(config, model);
  }

  // Default URL for Ollama
  if (config.provider === "ollama") {
    baseUrl = "http://localhost:11434";
  }

  // Ping the endpoint
  const isAlive = await pingEndpoint(baseUrl);
  if (!isAlive) {
    process.stderr.write(`Error: Unable to connect to LLM at ${baseUrl}\n`);
    process.stderr.write("Please check if the service is running\n");
    process.stderr.write(
      `Example: ${clc.bold("ollama run ")}${clc.green(model)}\n`
    );
    process.exit(0);
  }

  if (config.provider === "ollama") {
    try {
      execSync(`ollama list | grep ${model}`, {
        stdio: "ignore",
      });
    } catch (error) {
      process.stderr.write(
        `The model "${model}" is not downloaded. Please download it to proceed.\n`
      );
      process.stderr.write(
        `Run: ${clc.bold("ollama pull ")}${clc.green(model)}\n`
      );
      process.exit(1);
    }
  }
}
