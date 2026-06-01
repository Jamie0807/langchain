import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";
import { tools } from "./1.tools";

// 定义模型
export const model = new ChatOllama({
  model: process.env.OLLAMA_MODEL || "qwen3:0.6b",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  temperature: 0,
  think: false,
});

export const modelWithTools = model.bindTools(tools);
