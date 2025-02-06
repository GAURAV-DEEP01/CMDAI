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
  "mistral",
  "gemma",
  "phi-3",
  "orca-mini",
];

const API_PROVIDERS = {
  openai: ["gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o", "gpt-4"],
  anthropic: [
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
    "claude-2.1",
  ],
  google: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1-pro", "gemini-1"],
  deepseek: ["deepseek-chat", "deepseek-coder", "deepseek-math"],
};

export async function initializeConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    process.stdout.write("No configuration found. Running setup...\n");
    await runSetup();
  }
  return readConfig();
}

export async function runSetup() {
  let answers;
  try {
    answers = await inquirer.prompt<{
      providerType: "ollama" | "google" | "openai" | "anthropic" | "deepseek";
      ollamaModel: string;
      customOllamaModel: string;
      apiProvider: keyof typeof API_PROVIDERS;
      apiModel: string;
      apiKey: string;
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
        type: "list",
        name: "ollamaModel",
        message: "Select Ollama model:",
        choices: async () => {
          try {
            const response = await axios.get(`http://localhost:11434/api/tags`);
            if (!response.data.models) {
              throw new Error("Invalid response from Ollama");
            }
            return response.data.models.map((m: any) => m.name);
          } catch (error) {
            console.error(
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
        when: (answers) => answers.providerType !== "ollama",
      },
      {
        type: "password",
        name: "apiKey",
        message: "Enter API key:",
        when: (answers) => answers.providerType !== "ollama",
        validate: (input) => !!input.trim(),
      },
      {
        type: "list",
        name: "apiModel",
        message: "Select model:",
        choices: (answers) => API_PROVIDERS[answers.apiProvider!],
        when: (answers) => answers.providerType !== "ollama",
      },
    ]);
  } catch (error) {
    process.exit(1);
  }

  const config: Config = {
    provider: answers.providerType,
    model:
      // todo check this
      answers.providerType === "ollama"
        ? answers.ollamaModel
        : answers.apiModel,
    session: false,
  };
  // v2
  if (answers.providerType !== "ollama") {
    // Store API key in .env file
    const envContent = `API_KEY=${answers.apiKey}`;
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(ENV_PATH, envContent);
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  process.stdout.write(`\n✅ Configuration saved to ${CONFIG_PATH}\n`);
}

