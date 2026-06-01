/**
 * 示例 07 - 消息系统
 * 学习目标：理解 LangChain 中不同消息类型的作用，并用消息数组调用模型
 * 运行：npm run 07:messages
 */
import "dotenv/config";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  createOllamaChatModel,
  getOllamaModelName,
  sanitizeOllamaOutput,
} from "../lib/ollama";

async function main() {
  const model = createOllamaChatModel({
    temperature: 0.7,
    think: false,
  });
  console.log(`当前模型: ${getOllamaModelName()}`);

  const messages = [
    // SystemMessage：系统级提示，约束模型角色和输出风格
    new SystemMessage("你是一个专业的诗人，只负责写诗"),
    // AIMessage：模型消息，表示模型的输出
    new AIMessage("你好"),
    // HumanMessage：用户消息，表示用户真正输入的问题
    new HumanMessage("写诗"),
  ];

  const response = await model.invoke(messages);
  console.log(sanitizeOllamaOutput(response));
}

main().catch(console.error);
