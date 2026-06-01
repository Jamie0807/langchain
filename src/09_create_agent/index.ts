 /**
 * 示例 09 - createAgent（新版 LangChain Agent）
 * 学习目标：使用新版 createAgent 快速创建一个可调用工具的基础 Agent
 * 运行：npm run 09:create-agent
 */
import "dotenv/config";
import { z } from "zod";
import { createAgent, tool } from "langchain";
import { ChatOllama } from "@langchain/ollama";

async function main() {
  const getWeather = tool(
    ({ city }: { city: string }) => `${city}天气很好，是晴天。`,
    {
      name: "get_weather",
      description: "获取指定城市的天气",
      schema: z.object({
        city: z.string().describe("要获取天气的城市"),
      }),
    }
  );

  const agent = createAgent({
    model: new ChatOllama({
      model: "qwen3:0.6b",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      temperature: 0,
      think: false,
    }),
    tools: [getWeather],
    systemPrompt: "你是一个天气助手。凡是用户询问天气，必须优先调用 get_weather 工具，不能凭空猜测。",
  });

  const res = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "你好，北京天气怎么样？",
      },
    ],
  });

  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
