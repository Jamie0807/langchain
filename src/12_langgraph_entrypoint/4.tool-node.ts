import { AIMessage, ToolMessage } from "@langchain/core/messages";
import type { ToolCall } from "@langchain/core/messages/tool";
import { toolsByName } from "./1.tools";

// 调用工具
export async function callTool(toolCall: ToolCall) {
  const tool = toolsByName[toolCall.name as keyof typeof toolsByName];
  if (!tool) {
    return undefined;
  }

  return tool.invoke(toolCall) as Promise<ToolMessage>;
}

// 从消息中提取工具调用
export function getToolCalls(message: unknown) {
  if (!message || !AIMessage.isInstance(message)) {
    return [];
  }

  return message.tool_calls ?? [];
}
