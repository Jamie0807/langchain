/**
 * 示例 05 - 使用 Ollama 调用本地大模型
 * 学习目标：完全本地运行，无需 API Key，无费用
 * 前提：安装 Ollama（https://ollama.com）并下载模型
 *
 * 运行：npm run 05:ollama
 */
import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  createOllamaChatModel,
  getOllamaBaseUrl,
  getOllamaModelName,
  sanitizeOllamaOutput,
} from "../lib/ollama";

async function main() {
  // 初始化 Ollama 模型（默认读取 .env 中的 OLLAMA_MODEL / OLLAMA_BASE_URL）
  const model = createOllamaChatModel({
    temperature: 0.7,
  });
  console.log(`当前模型: ${getOllamaModelName()} (${getOllamaBaseUrl()})`);

  // -------- 方式1：基础调用 --------
  console.log("=== 方式1：基础调用 ===");
  const result = await model.invoke([
    new SystemMessage("你是一个简洁的助手，用中文回答，不超过50字"),
    new HumanMessage("什么是向量数据库？"),
  ]);
  console.log(sanitizeOllamaOutput(result.content));

  // -------- 方式2：流式输出 --------
  console.log("\n=== 方式2：流式输出 ===");
  const stream = await model.stream("用一句话解释什么是 RAG");
  let streamText = "";
  for await (const chunk of stream) {
    streamText += chunk.content as string;
  }
  console.log("回答：" + sanitizeOllamaOutput(streamText));
  console.log();

  // -------- 方式3：LCEL 管道 --------
  console.log("=== 方式3：LCEL 管道 ===");
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个{role}，回答要简洁"],
    ["human", "{question}"],
  ]);

  // Ollama 同样支持 LangChain Runnable/LCEL 的 pipe 写法
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const answer = await chain.invoke({
    role: "TypeScript 专家",
    question: "async/await 和 Promise 的区别是什么？",
  });
  console.log(sanitizeOllamaOutput(answer));
}

main().catch(console.error);
