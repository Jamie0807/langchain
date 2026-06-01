import type { AIMessage, BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";
import { callTool, getToolCalls } from "./4.tool-node";
import type { AgentIntent } from "./5.intent-node";

// 执行意图：根据意图决定是调用工具，还是结束本轮流程
export async function executeIntent(
  messages: BaseMessage[],
  modelResponse: AIMessage,
  intent: AgentIntent
) {
  if (intent.type === "call_tool") {
    const [firstToolCall] = getToolCalls(modelResponse);
    const toolResult = firstToolCall
      ? await callTool(firstToolCall)
      : undefined;

    return {
      done: false,
      messages: addMessages(
        messages,
        toolResult ? [modelResponse, toolResult] : [modelResponse]
      ),
    };
  }

  return {
    done: true,
    messages: addMessages(messages, [modelResponse]),
  };
}
