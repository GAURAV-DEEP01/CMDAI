export type Config = {
  provider: "ollama" | "api";
  model: string;
  baseUrl?: string;
  session: boolean;
};
