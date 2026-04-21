/**
 * 示例 01 - 最基础的模型调用
 * 学习目标：理解如何初始化模型、发送 prompt、获取响应
 * 运行：npm run 01:basic
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function main() {
  // 1. 初始化模型
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.7, // 0 = 确定性，1 = 更有创意
  });

  console.log("=== 方式1：直接传字符串 ===");
  // invoke = 执行模型，传入输入，等待返回结果（返回 AIMessage 对象）
  const result1 = await model.invoke("用一句话解释什么是机器学习");
  console.log(result1.content);

  console.log("\n=== 方式2：使用消息数组（推荐）===");
  // invoke 也可以传消息数组：SystemMessage 设定角色，HumanMessage 是用户输入
  const result2 = await model.invoke([
    new SystemMessage("你是一个专业的前端工程师，回答要简洁实用"),
    new HumanMessage("TypeScript 最重要的 3 个特性是什么？"),
  ]);
  console.log(result2.content);

  console.log("\n=== 方式3：流式输出（Streaming）===");
  // stream 是 invoke 的流式版本：模型每生成一个 token 就立即返回，不用等全部生成完
  const stream = await model.stream("写一首关于代码的五言绝句");
  process.stdout.write("回答：");
  for await (const chunk of stream) {
    process.stdout.write(chunk.content as string);
  }
  console.log("\n");
}

main().catch(console.error);
