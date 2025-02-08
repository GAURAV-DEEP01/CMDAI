import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import axios from 'axios';
import clc from 'cli-color';
import {
  API_PROVIDERS,
  Config,
  DEFAULT_OLLAMA_MODELS,
  Provider,
} from '../types/config';

const homeDir = os.homedir();
const CONFIG_DIR = path.join(homeDir, '.clai');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const ENV_PATH = path.join(CONFIG_DIR, '.env');

export async function initializeConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    process.stdout.write('No configuration found. Running setup...\n');
    await runSetup();
  }
  return readConfig();
}

export function readConfig(): Config {
  const configPath = path.join(os.homedir(), '.clai', 'config.json');
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `${clc.red.bold('Error')} reading config file:`,
        error.message,
      );
    } else {
      console.error(`${clc.red.bold('Error')} reading config file:`, error);
    }
    process.exit(0);
  }
}

export async function runSetup() {
  let answers;
  try {
    answers = await inquirer.prompt<{
      providerType: Provider;
      ollamaModel: string;
      customOllamaModel: string;
      apiProvider: keyof typeof API_PROVIDERS;
      apiModel: string;
      apiKey: string;
    }>([
      {
        type: 'list',
        name: 'providerType',
        message: 'Choose your LLM provider:',
        choices: [
          { name: 'Local Ollama', value: 'ollama' },
          { name: 'Custom cloud API', value: 'api' },
        ],
      },
      {
        type: 'list',
        name: 'ollamaModel',
        message: 'Select Ollama model:',
        choices: async () => {
          try {
            const response = await axios.get(`http://localhost:11434/api/tags`);
            if (!response.data.models) {
              throw new Error('Invalid response from Ollama');
            }
            return response.data.models.map((m: any) => m.name);
          } catch (error) {
            console.error(
              '⚠️  Could not connect to Ollama. Using default models',
            );
            return DEFAULT_OLLAMA_MODELS;
          }
        },
        when: (answers) => answers.providerType === 'ollama',
      },
      {
        type: 'list',
        name: 'apiProvider',
        message: 'Select API provider:',
        choices: Object.keys(API_PROVIDERS),
        when: (answers) => answers.providerType !== 'ollama',
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter API key:',
        when: (answers) => answers.providerType !== 'ollama',
        validate: (input) => !!input.trim(),
      },
      {
        type: 'list',
        name: 'apiModel',
        message: 'Select model:',
        choices: (answers) => API_PROVIDERS[answers.apiProvider!],
        when: (answers) => answers.providerType !== 'ollama',
      },
    ]);
  } catch (error) {
    process.exit(1);
  }

  const config: Config = {
    provider: answers.apiProvider || 'ollama',
    model:
      answers.providerType === 'ollama'
        ? answers.ollamaModel
        : answers.apiModel,
  };

  if (answers.providerType !== 'ollama') {
    // Determine the environment variable name for the provider
    let envVarName;
    switch (answers.apiProvider) {
      case 'google':
        envVarName = 'GOOGLE_API_KEY';
        break;
      case 'openai':
        envVarName = 'OPENAI_API_KEY';
        break;
      default:
        envVarName = 'DEEPSEEK_API_KEY';
    }

    // Read existing .env file or start with an empty object
    let envVars = {} as any;
    if (fs.existsSync(ENV_PATH)) {
      const existingContent = fs.readFileSync(ENV_PATH, 'utf8');
      envVars = dotenv.parse(existingContent);
    }

    envVars[envVarName] = answers.apiKey;

    // Convert the object back to .env format string
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Ensure the config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Write the updated content to .env file
    fs.writeFileSync(ENV_PATH, newEnvContent);
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  process.stdout.write(`\n✅ Configuration saved to ${CONFIG_PATH}\n`);
}
