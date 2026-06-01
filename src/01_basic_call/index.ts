/**
 * 示例 01 - 最基础的模型调用
 * 学习目标：理解如何初始化模型、发送 prompt、获取响应
 * 运行：npm run 01:basic
 */
import "dotenv/config";
import { createOllamaChatModel, sanitizeOllamaOutput } from "../lib/ollama.js";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

async function main() {
  // 初始化本地 Ollama 模型
  const modelName = "qwen3:0.6b";
  const model = createOllamaChatModel({
    temperature: 0.7, // 0 = 确定性，1 = 更有创意
  });
  console.log(`当前模型: ${modelName}`);


  // === 直接传字符串 ===
  // invoke = 执行模型，传入输入，等待返回结果（返回 AIMessage 对象）
  const prompt = "介绍刘亦菲";
  const result1 = await model.invoke(prompt);
  const currentFileDir = process.argv[1] ? dirname(process.argv[1]) : process.cwd();
  writeFileSync(join(currentFileDir, `${prompt}-answer.txt`), sanitizeOllamaOutput(result1.content));


  // === 流式输出（Streaming）===
  // stream 是 invoke 的流式版本：模型每生成一个 token 就立即返回，不用等全部生成完
  // model.stream() 返回一个异步流对象，模型每生成几个字就推送一个 chunk
  const streamPrompt = "用1000字来介绍肖倩倩";
  
  // process.stdout.write 直接往终端写字，和 console.log 的区别是：不自动换行
  // 这里先打印"回答："前缀，后续内容会紧跟在后面

  // for await...of 循环：每次从流里取一个 chunk（模型吐出的一小段文字）
  for await (const chunk of await model.stream(streamPrompt)) {
    writeFileSync(
      join(currentFileDir, `${streamPrompt}-stream.txt`), 
      sanitizeOllamaOutput(chunk.content), 
      { flag: "a" }
    );
  }
}



main().catch(console.error);
