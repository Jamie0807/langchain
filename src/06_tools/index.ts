/**
 * 示例 06 - 工具调用
 * 学习目标：让模型学会选择工具，并手动执行 tool call
 * 运行：npm run 06:tools
 */
import "dotenv/config";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createOllamaChatModel } from "../lib/ollama";

const getWeather = tool(
  async ({ location }) => {
    return `${location}天气很好，是晴天。`;
  },
  {
    name: "get_weather",
    description: "获取指定地点的天气",
    schema: z.object({
      location: z.string().describe("要获取天气的地点"),
    }),
  }
);

async function main() {
  const modelName = "qwen3-vl:2b";
  const model = createOllamaChatModel({
    model: modelName,
    temperature: 0,
    think: false,
  });
  console.log(`当前模型: ${modelName}`);

  // bindTools() 会把工具定义传给模型，模型可以决定是否调用工具
  const modelWithTools = model.bindTools([getWeather]);

  //=== 工具调用 ===
  const prompt = "北京天气怎么样？";
  const res = await modelWithTools.invoke(prompt);

  console.log("模型原始返回:", res.content);
  console.log("工具调用:", JSON.stringify(res.tool_calls ?? [], null, 2));

  const weather = await getWeather.invoke({ location: "北京" });
  console.log("工具执行结果:", weather);
}

main().catch(console.error);
