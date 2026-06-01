/**
 * 示例 15 - Loop Agent
 * 学习目标：使用 StateGraph + 条件边实现带循环的 Agent
 * 运行：npm run 15:loop-agent
 */
import "dotenv/config";
import { tool } from "langchain";
import { Annotation, END, InMemoryStore, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { createOllamaChatModel, sanitizeOllamaOutput } from "../lib/ollama";

const llm = createOllamaChatModel({
  temperature: 0.2,
  think: false,
});

const store = new InMemoryStore();

const MOCK_PAGES: Record<string, string> = {
  "https://langchain.com": "LangChain 是一个用于构建 LLM 应用的框架，支持模型、工具、检索和 Agent 编排。",
  "https://langchain.com/langgraph":
    "LangGraph 适合构建带状态、可循环、可分支、支持工具调用的多步骤 Agent 工作流。",
  "https://docs.langchain.com/oss/javascript/langgraph/overview":
    "LangGraph JavaScript 文档重点介绍了 StateGraph、节点、边、状态 reducer、循环和并行执行。",
};

const fetchTool = tool(
  async ({ url }) => {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      return text.replace(/\s+/g, " ").trim().slice(0, 400);
    } catch {
      return (
        MOCK_PAGES[url] ??
        `未命中本地页面内容：${url}。这是一个演示工具返回，表示工具节点已执行。`
      );
    }
  },
  {
    name: "fetch",
    description: "读取指定 URL 的页面内容，返回文本结果。",
    schema: z.object({
      url: z.string().describe("要获取内容的 URL"),
    }),
  }
);

const StateAnnotation = Annotation.Root({
  url: Annotation<string>,
  times: Annotation<number>,
  lastFetchedContent: Annotation<string>,
  currentSummary: Annotation<string>,
  steps: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  modelNotes: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  fetchCount: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});

// 工具节点：执行抓取工具，并递减剩余循环次数。
async function fetchToolNode(state: typeof StateAnnotation.State) {
  const fetchIndex = (state.fetchCount ?? 0) + 1;
  const content = await fetchTool.invoke({ url: state.url });
  const normalizedContent = typeof content === "string" ? content : String(content);

  console.log(`fetchToolNode executed -> 第 ${fetchIndex} 次抓取`);

  return {
    lastFetchedContent: `第 ${fetchIndex} 次抓取结果：${normalizedContent}`,
    times: Math.max(0, state.times - 1),
    steps: ["fetchTool"],
    fetchCount: 1,
  };
}

// 模型节点：读取当前状态，给出阶段性总结。
async function modelNode(state: typeof StateAnnotation.State) {
  const prompt = state.lastFetchedContent
    ? [
        "你正在一个带循环的 LangGraph Agent 中工作。",
        `目标 URL：${state.url}`,
        `剩余抓取次数：${state.times}`,
        `最新抓取内容：${state.lastFetchedContent}`,
        "请用一句中文总结当前信息，并说明是否还需要继续抓取。",
      ].join("\n")
    : [
        "你正在一个带循环的 LangGraph Agent 中工作。",
        `目标 URL：${state.url}`,
        `剩余抓取次数：${state.times}`,
        "目前还没有抓取内容，请用一句中文说明接下来会进入工具抓取阶段。",
      ].join("\n");

  const response = await llm.invoke(prompt);
  const summary = sanitizeOllamaOutput(response.content).trim();

  console.log("modelNode executed");

  return {
    currentSummary: summary,
    modelNotes: [summary],
    steps: ["modelNode"],
  };
}

// 条件节点：如果还有剩余次数，则继续走工具节点；否则结束。
function shouldContinue(state: typeof StateAnnotation.State) {
  console.log(`shouldContinue -> remaining times: ${state.times}`);
  return state.times > 0 ? "continue" : "stop";
}

export const agent = new StateGraph(StateAnnotation)
  .addNode("modelNode", modelNode)
  .addNode("fetchTool", fetchToolNode)
  .addEdge(START, "modelNode")
  .addConditionalEdges("modelNode", shouldContinue, {
    continue: "fetchTool",
    stop: END,
  })
  .addEdge("fetchTool", "modelNode")
  .compile({
    store,
  });

async function main() {
  const result = await agent.invoke({
    url: "https://langchain.com/langgraph",
    times: 2,
  });

  console.log("=== Loop Agent 结果 ===");
  console.log(`url: ${result.url}`);
  console.log(`remainingTimes: ${result.times}`);
  console.log(`fetchCount: ${result.fetchCount ?? 0}`);
  console.log(`lastFetchedContent: ${result.lastFetchedContent ?? "(未抓取)"}`);
  console.log(`currentSummary: ${result.currentSummary ?? "(未生成)"}`);
  console.log(`steps: ${JSON.stringify(result.steps ?? [])}`);
  console.log(`modelNotes: ${JSON.stringify(result.modelNotes ?? [])}`);
}

main().catch(console.error);
