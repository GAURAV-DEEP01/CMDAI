// todo change provider into subtype
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
