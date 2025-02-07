import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';

export function queryGemini(model: string, input: string, apiKey: string) {
  const google = createGoogleGenerativeAI({
    apiKey,
  });
  return streamText({
    model: google(model),
    prompt: input,
  });
}

export function queryOpenai(model: string, input: string, apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });
  return streamText({
    model: openai(model),
    prompt: input,
  });
}

export function queryDeepseek(model: string, input: string, apiKey: string) {
  const deepseek = createDeepSeek({
    apiKey,
  });
  return streamText({
    model: deepseek(model),
    prompt: input,
  });
}

export function queryAnthropic(model: string, input: string, apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });
  return streamText({
    model: anthropic(model),
    prompt: input,
  });
}

export function queryOllama(model: string, input: string) {
  const ollama = createOllama();
  return streamText({
    model: ollama(model),
    prompt: input,
  });
}
