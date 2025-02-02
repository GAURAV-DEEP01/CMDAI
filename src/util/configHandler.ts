import fs from "fs";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import axios from "axios";

type Config = {
  provider: "ollama" | "api";
  model: string;
  apiKey?: string;
  ollamaBaseUrl?: string;
};

const homeDir = os.homedir();
const CONFIG_DIR = path.join(homeDir, ".clai");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const ENV_PATH = path.join(CONFIG_DIR, ".env");

// Default models for fallback scenarios
const DEFAULT_OLLAMA_MODELS = ["llama2", "mistral", "codellama"];
const API_PROVIDERS = {
  openai: ["gpt-3.5-turbo", "gpt-4"],
  anthropic: ["claude-2", "claude-instant"],
  // todo fix this
  google: ["t5-3b", "t5-11b"],
  DeepSeek: ["deepseek-1", "deepseek-2"],
};

async function initializeConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    await runSetup();
  }
  return loadConfig();
}

function loadConfig(): Config {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

async function runSetup() {
  const answers = await inquirer.prompt<{
    providerType: "ollama" | "api";
    ollamaModel: string;
    customOllamaModel: string;
    apiProvider: keyof typeof API_PROVIDERS;
    apiModel: string;
    apiKey: string;
    ollamaBaseUrl: string;
  }>([
    {
      type: "list",
      name: "providerType",
      message: "Choose your LLM provider:",
      choices: [
        { name: "Local Ollama", value: "ollama" },
        { name: "Custom cloud API", value: "api" },
      ],
    },
    {
      type: "input",
      name: "ollamaBaseUrl",
      message: "Ollama base URL (default: http://localhost:11434):",
      default: "http://localhost:11434",
      when: (answers) => answers.providerType === "ollama",
      validate: (input) => isValidUrl(input) || "Please enter a valid URL",
    },
    {
      type: "list",
      name: "ollamaModel",
      message: "Select Ollama model:",
      choices: async (answers) => {
        try {
          const response = await axios.get(`${answers.ollamaBaseUrl}/api/tags`);
          if (!response.data.models) {
            throw new Error("Invalid response from Ollama");
          }
          return response.data.models.map((m: any) => m.name);
        } catch (error) {
          console.log("⚠️  Could not connect to Ollama. Using default models");
          return DEFAULT_OLLAMA_MODELS;
        }
      },
      when: (answers) => answers.providerType === "ollama",
    },
    {
      type: "list",
      name: "apiProvider",
      message: "Select API provider:",
      choices: Object.keys(API_PROVIDERS),
      when: (answers) => answers.providerType === "api",
    },
    {
      type: "password",
      name: "apiKey",
      message: "Enter API key:",
      when: (answers) => answers.providerType === "api",
      validate: (input) => !!input.trim(),
    },
    {
      type: "list",
      name: "apiModel",
      message: "Select model:",
      choices: (answers) => API_PROVIDERS[answers.apiProvider!],
      when: (answers) => answers.providerType === "api",
    },
  ]);

  const config: Config = {
    provider: answers.providerType,
    model:
      answers.providerType === "ollama"
        ? answers.ollamaModel
        : answers.apiModel,
    ollamaBaseUrl: answers.ollamaBaseUrl,
  };

  if (answers.providerType === "api") {
    // Store API key in .env file
    const envContent = `${answers.apiProvider.toUpperCase()}_API_KEY=${
      answers.apiKey
    }`;
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(ENV_PATH, envContent);
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`\n✅ Configuration saved to ${CONFIG_PATH}\n`);
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export { initializeConfig };
