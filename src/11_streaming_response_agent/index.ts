/**
 * 示例 11 - Agent 流式结构化输出
 * 学习目标：使用 createAgent.stream() 流式读取消息，并在结束时拿到 structuredResponse
 * 运行：npm run 11:streaming-agent
 */
import "dotenv/config";
import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";
import { ChatOllama } from "@langchain/ollama";
import { AIMessage } from "@langchain/core/messages";

const personSchema = z.object({
  name: z.string().describe("人物姓名"),
  age: z.number().describe("人物年龄"),
});

async function main() {
  const agent = createAgent({
    model: new ChatOllama({
      model: process.env.OLLAMA_MODEL || "qwen3:0.6b",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      temperature: 0,
      think: false,
    }),
    tools: [],
    systemPrompt: "你是一个信息提取助手，只负责输出结构化人物信息。",
    responseFormat: toolStrategy(personSchema),
  });

  const stream = await agent.stream(
    {
      messages: [{ role: "user", content: "我是合一，我今年18岁" }],
    },
    {
      // 流式模式：每次返回一个 chunk（模型吐出的一小段文字）
      // 可以在 for await...of 循环中处理每个 chunk
      streamMode: "values",
    }
  );

  let finalStructuredResponse: unknown;
  let lastMessages: unknown[] = [];

  for await (const chunk of stream) {
    const latestMessage = chunk.messages.at(-1);
    lastMessages = chunk.messages;

    if (latestMessage && "content" in latestMessage && latestMessage.content) {
      console.log("Agent:", latestMessage.content);
    }

    if (
      latestMessage &&
      "tool_calls" in latestMessage &&
      Array.isArray(latestMessage.tool_calls) &&
      latestMessage.tool_calls.length > 0
    ) {
      const toolCallNames = latestMessage.tool_calls.map((toolCall) => toolCall.name);
      console.log(`Calling tools: ${toolCallNames.join(", ")}`);
    }

    if ("structuredResponse" in chunk && chunk.structuredResponse) {
      finalStructuredResponse = chunk.structuredResponse;
    }
  }

  if (!finalStructuredResponse) {
    const aiMessages = lastMessages.filter((message) => AIMessage.isInstance(message));
    const lastAIMessage = aiMessages.at(-1);
    const finalToolCall = lastAIMessage?.tool_calls?.[0];

    if (finalToolCall?.args) {
      finalStructuredResponse = finalToolCall.args;
    } else if (typeof lastAIMessage?.content === "string") {
      try {
        finalStructuredResponse = JSON.parse(lastAIMessage.content);
      } catch {
        // Some local models stream JSON text instead of filling structuredResponse/tool_calls.
      }
    }
  }

  console.log("structuredResponse ===>");
  console.log(finalStructuredResponse);
}

main().catch(console.error);
