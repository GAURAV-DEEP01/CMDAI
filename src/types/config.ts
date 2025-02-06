// todo change provider into subtype
export type Config = {
  provider: "ollama" | "google" | "openai" | "anthropic" | "deepseek";
  model: string;
  session: boolean;
  forceBashHistoyWrite?: boolean;
};
