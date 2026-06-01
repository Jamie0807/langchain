import { AIMessage } from "@langchain/core/messages";

export type AgentIntent =
  | { type: "call_tool"; toolName: string }
  | { type: "respond" }
  | { type: "unknown" };

// 意图判断：根据模型输出决定下一步是调用工具，还是直接返回结果
export function judgeIntent(message: unknown): AgentIntent {
  // 检查是否为 AIMessage
   if (!message || !AIMessage.isInstance(message)) {
    return { type: "unknown" };
  }
  // 检查是否有工具调用
  const [firstToolCall] = message.tool_calls ?? [];
  if (firstToolCall) {
    return {
      type: "call_tool",
      toolName: firstToolCall.name,
    };
  }

  return { type: "respond" };
}
