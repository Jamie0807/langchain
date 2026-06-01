/**
 * 示例 16 - Subgraph Agent
 * 学习目标：使用 StateGraph 在主图中嵌套并调用子图
 * 运行：npm run 16:subgraph-agent
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
    "LangGraph JavaScript 文档重点介绍了 StateGraph、节点、边、状态 reducer、循环、并行执行和子图嵌套。",
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
  mainSummary: Annotation<string>,
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

// 子图工具节点：执行抓取工具，并推进循环计数。
async function fetchToolNode(state: typeof StateAnnotation.State) {
  const fetchIndex = (state.fetchCount ?? 0) + 1;
  const content = await fetchTool.invoke({ url: state.url });
  const normalizedContent = typeof content === "string" ? content : String(content);

  console.log(`subGraph.fetchToolNode executed -> 第 ${fetchIndex} 次抓取`);

  return {
    lastFetchedContent: `第 ${fetchIndex} 次抓取结果：${normalizedContent}`,
    times: Math.max(0, state.times - 1),
    steps: ["fetchTool"],
    fetchCount: 1,
  };
}

// 子图模型节点：根据当前抓取结果生成阶段性总结。
async function subModelNode(state: typeof StateAnnotation.State) {
  const prompt = state.lastFetchedContent
    ? [
        "你正在一个 SubGraph 中工作。",
        `目标 URL：${state.url}`,
        `剩余抓取次数：${state.times}`,
        `最新抓取内容：${state.lastFetchedContent}`,
        "请用一句中文总结当前信息，并说明是否继续抓取。",
      ].join("\n")
    : [
        "你正在一个 SubGraph 中工作。",
        `目标 URL：${state.url}`,
        `剩余抓取次数：${state.times}`,
        "目前还没有抓取结果，请用一句中文说明将进入工具抓取阶段。",
      ].join("\n");

  const response = await llm.invoke(prompt);
  const summary = sanitizeOllamaOutput(response.content).trim();
  const nextStep = state.times > 0 ? "继续抓取" : "结束子图";
  const normalizedSummary = `${summary}\n调度判断：${nextStep}`;

  console.log("subGraph.modelNode executed");

  return {
    currentSummary: normalizedSummary,
    modelNotes: [normalizedSummary],
    steps: ["subModelNode"],
  };
}

function shouldContinue(state: typeof StateAnnotation.State) {
  console.log(`subGraph.shouldContinue -> remaining times: ${state.times}`);
  return state.times > 0 ? "continue" : "stop";
}

// 子图：内部包含自己的循环结构。
export const subAgent = new StateGraph(StateAnnotation)
  .addNode("modelNode", subModelNode)
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

// 主图模型节点：负责主图入口的说明和调度。
async function mainModelNode(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    [
      "你正在主图 Main Agent 中工作。",
      `目标 URL：${state.url}`,
      `计划把剩余抓取次数 ${state.times} 交给子图处理。`,
      "请用一句中文说明主图会把任务交给子图执行。",
    ].join("\n")
  );

  const summary = sanitizeOllamaOutput(response.content).trim();
  console.log("mainModelNode executed");

  return {
    mainSummary: summary,
    steps: ["mainModelNode"],
    modelNotes: [summary],
  };
}

// 主图子图节点：在主图节点中调用子图，并把子图结果汇总回主图状态。
async function subAgentNode(state: typeof StateAnnotation.State) {
  console.log("subAgent node invoked from main graph");

  const subgraphOutput = await subAgent.invoke({
    url: state.url,
    times: state.times,
    lastFetchedContent: state.lastFetchedContent,
    currentSummary: "",
    mainSummary: state.mainSummary,
    steps: [],
    modelNotes: [],
    fetchCount: 0,
  });

  return {
    times: subgraphOutput.times,
    lastFetchedContent: subgraphOutput.lastFetchedContent,
    currentSummary: subgraphOutput.currentSummary,
    steps: ["subAgent"].concat(subgraphOutput.steps ?? []),
    modelNotes: subgraphOutput.modelNotes ?? [],
    fetchCount: subgraphOutput.fetchCount ?? 0,
  };
}

export const agent = new StateGraph(StateAnnotation)
  .addNode("modelNode", mainModelNode)
  .addNode("subAgent", subAgentNode)
  .addEdge(START, "modelNode")
  .addEdge("modelNode", "subAgent")
  .addEdge("subAgent", END)
  .compile({
    store,
  });

async function main() {
  const result = await agent.invoke({
    url: "https://langchain.com/langgraph",
    times: 2,
    lastFetchedContent: "",
    currentSummary: "",
    mainSummary: "",
  });

  console.log("=== Subgraph Agent 结果 ===");
  console.log(`url: ${result.url}`);
  console.log(`remainingTimes: ${result.times}`);
  console.log(`fetchCount: ${result.fetchCount ?? 0}`);
  console.log(`mainSummary: ${result.mainSummary ?? "(未生成)"}`);
  console.log(`currentSummary: ${result.currentSummary ?? "(未生成)"}`);
  console.log(`lastFetchedContent: ${result.lastFetchedContent ?? "(未抓取)"}`);
  console.log(`steps: ${JSON.stringify(result.steps ?? [])}`);
  console.log(`modelNotes: ${JSON.stringify(result.modelNotes ?? [])}`);
}

main().catch(console.error);
