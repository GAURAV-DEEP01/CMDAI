export type Provider =
  | 'ollama'
  | 'google'
  | 'openai'
  | 'anthropic'
  | 'deepseek';

export type Config = {
  provider: Provider;
  model: string;
  forceBashHistoyWrite?: boolean;
};

export const DEFAULT_OLLAMA_MODELS = [
  'llama3.2:3b',
  'deepseek-r1:1.5b',
  'deepseek-r1:7b',
  'codellama',
  'mistral',
  'gemma',
  'phi-3',
  'orca-mini',
];

export const API_PROVIDERS = {
  openai: ['gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4o', 'gpt-4'],
  anthropic: [
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'claude-2.1',
  ],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1-pro', 'gemini-1'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-math'],
};
