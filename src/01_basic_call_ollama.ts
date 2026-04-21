/**
 * 示例 01 - 最基础的模型调用（Ollama 本地版）
 * 学习目标：理解如何初始化模型、发送 prompt、获取响应
 * 特点：完全本地运行，无需 API Key，无需网络
 *
 * 前提：启动 Ollama 服务，并已下载模型
 *   ollama pull qwen3:0.6b
 *
 * 运行：npm run 01:ollama
 */
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function main() {
  // 初始化本地 Ollama 模型（和 ChatOpenAI 用法完全一样，只是换了类名）
  const model = new ChatOllama({
    model: "qwen3:0.6b",              // 本地已下载的模型名
    baseUrl: "http://localhost:11434", // Ollama 默认端口
    temperature: 0.7,
    think: false,                      // 关闭 qwen3 思维链，去掉 <think> 输出
  });

  console.log("=== 方式1：直接传字符串 ===");
  // invoke = 执行模型，传入输入，等待返回结果（返回 AIMessage 对象）
  const result1 = await model.invoke("用一句话解释什么是机器学习");
  console.log(result1.content);

  console.log("\n=== 方式2：使用消息数组（推荐）===");
  // invoke 也可以传消息数组：SystemMessage 设定角色，HumanMessage 是用户输入
  const result2 = await model.invoke([
    // SystemMessage：系统指令，用来设定模型的角色和行为规则
    // 相当于偷偷告诉模型「你要扮演这个角色」，用户看不到这行内容
    new SystemMessage("你是一个专业的前端工程师，回答要简洁实用"),

    // HumanMessage：用户的提问，相当于聊天框里用户发的消息
    new HumanMessage("TypeScript 最重要的 3 个特性是什么？"),
    // invoke 返回的是 AIMessage 对象，用 .content 取出文本内容
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
