/**
 * 示例 05 - 使用 Ollama 调用本地大模型
 * 学习目标：完全本地运行，无需 API Key，无费用
 * 前提：安装 Ollama（https://ollama.com）并下载模型
 *
 * 下载模型命令：
 *   ollama pull qwen3:0.6b    （通义千问，522MB，适合低配机器）
 *   ollama pull llama3.2:3b   （Meta Llama，2GB）
 *   ollama pull deepseek-r1:7b（DeepSeek，4GB，推理能力强）
 *
 * 运行：npm run 05:ollama
 */
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function main() {
  // 初始化 Ollama 模型（baseUrl 默认就是本地 11434 端口）
  const model = new ChatOllama({
    model: "qwen3:0.6b",  // 换成你本地已下载的模型名
    baseUrl: "http://localhost:11434",
    temperature: 0.7,
    // 关闭思考模式（qwen3 专属），去掉 <think> 输出
    think: false,
  });

  // -------- 方式1：基础调用 --------
  console.log("=== 方式1：基础调用 ===");
  const result = await model.invoke([
    new SystemMessage("你是一个简洁的助手，用中文回答，不超过50字"),
    new HumanMessage("什么是向量数据库？"),
  ]);
  console.log(result.content);

  // -------- 方式2：流式输出 --------
  console.log("\n=== 方式2：流式输出 ===");
  const stream = await model.stream("用一句话解释什么是 RAG");
  process.stdout.write("回答：");
  for await (const chunk of stream) {
    process.stdout.write(chunk.content as string);
  }
  console.log("\n");

  // -------- 方式3：LCEL 管道（和 OpenAI 写法完全一样！）--------
  console.log("=== 方式3：LCEL 管道 ===");
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个{role}，回答要简洁"],
    ["human", "{question}"],
  ]);

  // Ollama 和 OpenAI 接口一致，pipe 写法完全相同
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const answer = await chain.invoke({
    role: "TypeScript 专家",
    question: "async/await 和 Promise 的区别是什么？",
  });
  console.log(answer);
}

main().catch(console.error);
