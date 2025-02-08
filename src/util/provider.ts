import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';

function queryGemini(model: string, input: string, apiKey: string) {
  const google = createGoogleGenerativeAI({
    apiKey,
  });
  return streamText({
    model: google(model),
    prompt: input,
  });
}

function queryOpenai(model: string, input: string, apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });
  return streamText({
    model: openai(model),
    prompt: input,
  });
}

function queryDeepseek(model: string, input: string, apiKey: string) {
  const deepseek = createDeepSeek({
    apiKey,
  });
  return streamText({
    model: deepseek(model),
    prompt: input,
  });
}

function queryAnthropic(model: string, input: string, apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });
  return streamText({
    model: anthropic(model),
    prompt: input,
  });
}

function queryOllama(model: string, input: string) {
  const ollama = createOllama();
  return streamText({
    model: ollama(model),
    prompt: input,
  });
}

export function getStreamFromProvider(
  provider: string,
  model: string,
  fullPrompt: string,
): AsyncIterable<string> {
  switch (provider) {
    case 'google':
      return queryGemini(model, fullPrompt, process.env.GOOGLE_API_KEY!)
        .textStream;

    case 'openai':
      return queryOpenai(model, fullPrompt, process.env.OPENAI_API_KEY!)
        .textStream;

    case 'deepseek':
      return queryDeepseek(model, fullPrompt, process.env.DEEPSEEK_API_KEY!)
        .textStream;

    case 'anthropic':
      return queryAnthropic(model, fullPrompt, process.env.ANTHROPIC_API_KEY!)
        .textStream;

    case 'ollama':
      return queryOllama(model, fullPrompt).textStream;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
