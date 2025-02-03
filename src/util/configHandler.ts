import fs from "fs";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import axios from "axios";
import { readConfig } from "./tools";
import { Config } from "../types/config";

const homeDir = os.homedir();
const CONFIG_DIR = path.join(homeDir, ".clai");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const ENV_PATH = path.join(CONFIG_DIR, ".env");

// Default models for fallback scenarios
const DEFAULT_OLLAMA_MODELS = [
  "llama3.2:3b",
  "deepseek-r1:1.5b",
  "deepseek-r1:7b",
  "codellama",
];

const API_PROVIDERS = {
  // todo fix this
  openai: ["gpt-3.5-turbo", "gpt-4"],
  anthropic: ["claude-2", "claude-instant"],
  google: ["t5-3b", "t5-11b"],
  DeepSeek: ["deepseek-1", "deepseek-2"],
};

async function initializeConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    await runSetup();
  }
  return readConfig();
}

//todo setconfig & getconfig

async function runSetup() {
  let answers;
  try {
    answers = await inquirer.prompt<{
      providerType: "ollama" | "api";
      ollamaModel: string;
      customOllamaModel: string;
      apiProvider: keyof typeof API_PROVIDERS;
      apiModel: string;
      apiKey: string;
      ollamaBaseUrl: string;
      apiBaseUrl: string;
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
            const response = await axios.get(
              `${answers.ollamaBaseUrl}/api/tags`
            );
            if (!response.data.models) {
              throw new Error("Invalid response from Ollama");
            }
            return response.data.models.map((m: any) => m.name);
          } catch (error) {
            console.log(
              "⚠️  Could not connect to Ollama. Using default models"
            );
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
      {
        type: "input",
        name: "apiBaseUrl",
        message: (answers) => `${answers.apiProvider} base URL:`,
        default: (answers) => {
          switch (answers.apiProvider) {
            case "openai":
              //todo check if apis are correct
              return "https://api.openai.com";
            case "anthropic":
              return "https://api.anthropic.com";
            case "google":
              return "https://api.google.com";
            case "DeepSeek":
              return "https://api.deepseek.com";
            default:
              return "http://localhost:11434";
          }
        },
        when: (answers) => answers.providerType === "api",
        validate: (input) => isValidUrl(input) || "Please enter a valid URL",
      },
    ]);
  } catch (error) {
    process.stderr.write("Exited");
    process.exit(1);
  }

  const config: Config = {
    provider: answers.providerType,
    model:
      answers.providerType === "ollama"
        ? answers.ollamaModel
        : answers.apiModel,
    baseUrl:
      answers.providerType === "ollama"
        ? answers.ollamaBaseUrl
        : answers.apiBaseUrl,
    session: false,
  };

  if (answers.providerType === "api") {
    // Store API key in .env file
    const envContent = `API_KEY=${answers.apiKey}`;
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
