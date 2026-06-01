/**
 * 示例 08 - ReAct 智能体
 * 学习目标：使用 ReAct 提示模板 + 工具 创建一个最基础的 Agent
 * 运行：npm run 08:react-agent
 */
import "dotenv/config";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { AgentExecutor, createReactAgent } from "@langchain/classic/agents";
import { createOllamaChatModel, getOllamaModelName } from "../lib/ollama";

const getWeather = tool(
  async (location) => {
    if (location.includes("北京")) {
      return "北京天气晴朗，温度 26 度，适合出门。";
    }

    if (location.includes("上海")) {
      return "上海多云，温度 28 度，体感稍热。";
    }

    return `${location}天气未知，但可以认为是晴天。`;
  },
  {
    name: "get_weather",
    description: "查询某个城市的天气情况，输入应为城市名",
    schema: z.string().describe("需要查询天气的城市名"),
  }
);

const reactPrompt = PromptTemplate.fromTemplate(`你是一个会使用工具的智能体。

你可以使用下面这些工具：

{tools}

请严格按照下面格式思考和输出：

Question: 用户问题
Thought: 你对下一步的思考
Action: 要调用的工具名，必须是 [{tool_names}] 之一
Action Input: 工具输入
Observation: 工具返回结果
...（Thought/Action/Action Input/Observation 可以重复多轮）
Thought: 我已经得到最终答案
Final Answer: 给用户的最终回答

开始！

Question: {input}
Thought:{agent_scratchpad}`);

async function main() {
  const model = createOllamaChatModel({
    temperature: 0,
    think: false,
  });
  console.log(`当前模型: ${getOllamaModelName()}`);

  const tools = [getWeather];
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt: reactPrompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const result = await agentExecutor.invoke({
    input: "北京天气怎么样？请顺便告诉我适不适合出门。",
  });

  console.log("Agent 输出:", result.output);
}

main().catch(console.error);
