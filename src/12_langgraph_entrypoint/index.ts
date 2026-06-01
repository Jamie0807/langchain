/**
 * 示例 12 - LangGraph Entrypoint Agent
 * 学习目标：使用 LangGraph Functional API 拆分工具、模型、模型节点、工具节点，并用 entrypoint 组装 Agent
 * 运行：npm run 12:langgraph-entrypoint
 */
import "dotenv/config";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { agent } from "./agent";
import { sanitizeOllamaOutput } from "../lib/ollama";

// 运行 Agent
const prompt = "请使用工具计算 3 和 5 的和。";

async function main() {
  const messages = await agent.invoke([
    new HumanMessage(prompt),
  ]);

  // 最终消息列表
  for (const message of messages) {
    if (AIMessage.isInstance(message)) {
      const content =
        typeof message.content === "string"
          ? sanitizeOllamaOutput(message.content)
          : JSON.stringify(message.content);

      if (content) {
        console.log(`[AI] ${content}`);
      }
      if (message.tool_calls?.length) {
        console.log(
          `[AI tool_calls] ${message.tool_calls.map((toolCall) => toolCall.name).join(", ")}`
        );
      }
      continue;
    }

    const content = Array.isArray(message.content)
      ? JSON.stringify(message.content)
      : String(message.content);

    console.log(`[${message.constructor.name}] ${content}`);
  }

  const lastMessage = messages.at(-1);
  if (lastMessage && AIMessage.isInstance(lastMessage)) {
    console.log("=== 最终答案 ===");
    console.log(sanitizeOllamaOutput(lastMessage.content));
  }
}

main().catch(console.error);
