import { ChatOllama } from "@langchain/ollama";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "qwen3:0.6b";

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL;
}

export function getOllamaModelName(): string {
  return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
}

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractText(item)).join("");
  }

  if (value && typeof value === "object") {
    const maybeText = (value as { text?: unknown }).text;
    if (typeof maybeText === "string") {
      return maybeText;
    }
  }

  return value == null ? "" : String(value);
}

function parseOllamaOutput(text: string): { answer: string } {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const answerMatch = normalized.match(/<answer>([\s\S]*?)<\/answer>/i);

  if (answerMatch) {
    return { answer: answerMatch[1].trim() };
  }

  return { answer: normalized };
}

export function sanitizeOllamaOutput(value: unknown): string {
  const rawText = extractText(value);
  const { answer } = parseOllamaOutput(rawText);
  return `${answer.replace(/<\/?answer>/gi, "").trim()}\n`;
}

export function createOllamaChatModel(options?: {
  temperature?: number;
  model?: string;
  topP?: number;
  topK?: number;
  think?: boolean;
}) {
  const model = options?.model || getOllamaModelName();

  return new ChatOllama({
    baseUrl: getOllamaBaseUrl(),
    temperature: options?.temperature,
    model,
    topP: options?.topP,
    topK: options?.topK,
    think: options?.think,
  });
}
