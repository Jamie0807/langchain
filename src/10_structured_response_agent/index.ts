/**
 * 示例 10 - Agent 结构化输出
 * 学习目标：使用 createAgent 的 responseFormat，并打印 structuredResponse
 * 运行：npm run 10:structured-agent
 */
import "dotenv/config";
import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";
import { ChatOllama } from "@langchain/ollama";

const personSchema = z.object({
  name: z.string().describe("姓名"),
  age: z.number().describe("年龄"),
  city: z.string().describe("所在城市"),
  summary: z.string().describe("一句话总结"),
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
    systemPrompt: "你是一个信息提取助手，只负责从文本中提取结构化信息。",
    responseFormat: toolStrategy(personSchema),
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "请提取这段文本中的人物信息：张三，28岁，现居北京，是一名前端工程师，擅长 React 和 TypeScript。",
      },
    ],
  });

  console.log("structuredResponse:");
  console.log(result.structuredResponse);
}

main().catch(console.error);
