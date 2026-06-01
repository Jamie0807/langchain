import { entrypoint } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { callLlm } from "./3.model-node";
import { judgeIntent } from "./5.intent-node";
import { executeIntent } from "./6.execute-intent";

// 定义 Agent
export const agent = entrypoint(
  { name: "langgraph-entrypoint-agent" },
  // 执行流程：
  // 1. 执行大模型
  // 2. 意图判断
  // 3. 执行意图
  // 4. 返回结果
  async (messages: BaseMessage[]) => {
    while (true) {
      // 执行大模型
      const modelResponse = await callLlm(messages);
      // 意图判断
      const intent = judgeIntent(modelResponse);
      // 执行意图
      const result = await executeIntent(messages, modelResponse, intent);
      // 返回结果
      messages = result.messages;
      if (result.done) {
        return messages;
      }
    }
  }
);
