/**
 * 示例 17 - Interrupt And Checkpoint
 * 学习目标：使用 interrupt() 和 MemorySaver 实现中断、检查点与恢复执行
 * 运行：npm run 17:interrupt-checkpoint
 */
import "dotenv/config";
import { tool } from "langchain";
import {
  Annotation,
  Command,
  END,
  InMemoryStore,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
  isGraphInterrupt,
} from "@langchain/langgraph";
import { z } from "zod";
import { createOllamaChatModel, sanitizeOllamaOutput } from "../lib/ollama";

const llm = createOllamaChatModel({
  temperature: 0.2,
  think: false,
});

const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const MOCK_PAGES: Record<string, string> = {
  "https://langchain.com/langgraph":
    "LangGraph 支持状态图、循环、并行、子图嵌套，以及人类介入的中断恢复模式。",
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
  approved: Annotation<string>,
  modelSummary: Annotation<string>,
  fetchedContent: Annotation<string>,
  steps: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});

async function modelNode(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    [
      "你正在一个带中断与检查点的 LangGraph 工作流中工作。",
      `目标 URL：${state.url}`,
      `剩余抓取次数：${state.times}`,
      "请用一句中文说明接下来会进入人工确认节点。",
    ].join("\n")
  );

  const summary = sanitizeOllamaOutput(response.content).trim();
  console.log("modelNode executed");

  return {
    modelSummary: summary,
    steps: ["modelNode"],
  };
}

function interruptNode(state: typeof StateAnnotation.State) {
  console.log("interruptNode executed -> about to interrupt");

  // 不要在节点内部 try/catch interrupt()，让 LangGraph 正常保存检查点并暂停执行。
  const approved = interrupt<string, string>(
    [
      "你想要暂停，稍后继续吗？",
      `目标 URL：${state.url}`,
      `当前模型总结：${state.modelSummary ?? "(未生成)"}`,
      "请返回一段审批意见，例如：批准继续抓取。"
    ].join("\n")
  );

  return {
    approved,
    steps: ["interruptNode"],
  };
}

// 定义节点 - 工具节点 - 读取页面内容
async function fetchToolNode(state: typeof StateAnnotation.State) {
  const content = await fetchTool.invoke({ url: state.url });
  const normalizedContent = typeof content === "string" ? content : String(content);

  console.log("fetchToolNode executed");

  return {
    fetchedContent: normalizedContent,
    times: Math.max(0, state.times - 1),
    steps: ["fetchTool"],
  };
}

export const agent = new StateGraph(StateAnnotation)
  .addNode("modelNode", modelNode)
  .addNode("interruptNode", interruptNode)
  .addNode("fetchTool", fetchToolNode)
  .addEdge(START, "modelNode")
  .addEdge("modelNode", "interruptNode")
  .addEdge("interruptNode", "fetchTool")
  .addEdge("fetchTool", END)
  .compile({
    store,
    checkpointer,
  });

async function printCheckpointState(label: string, threadConfig: { configurable: { thread_id: string } }) {
  const snapshot = await agent.getState(threadConfig);
  const interrupts = snapshot.tasks.flatMap((task) => task.interrupts ?? []);

  console.log(`=== ${label} ===`);
  console.log(`next: ${JSON.stringify(snapshot.next ?? [])}`);
  console.log(`interrupts: ${JSON.stringify(interrupts)}`);
  console.log(`values: ${JSON.stringify(snapshot.values ?? {}, null, 2)}`);
}

async function main() {
  const config = {
    configurable: {
      thread_id: "interrupt-demo-thread",
    },
  };

  console.log("=== 第一次执行：触发中断并保存检查点 ===");

  try {
    await agent.invoke(
      {
        url: "https://langchain.com/langgraph",
        times: 1,
        approved: "",
        modelSummary: "",
        fetchedContent: "",
      },
      config
    );
  } catch (error) {
    if (!isGraphInterrupt(error)) {
      throw error;
    }

    console.log("已触发 GraphInterrupt，执行已暂停。");
  }

  await printCheckpointState("检查点状态（中断后）", config);

  console.log("");
  console.log("=== 第二次执行：基于相同 thread_id 恢复 ===");

  const resumedResult = await agent.invoke(
    new Command({
      resume: "批准继续抓取",
    }),
    config
  );

  console.log("=== 恢复后的最终结果 ===");
  console.log(`url: ${resumedResult.url}`);
  console.log(`approved: ${resumedResult.approved ?? "(未审批)"}`);
  console.log(`modelSummary: ${resumedResult.modelSummary ?? "(未生成)"}`);
  console.log(`fetchedContent: ${resumedResult.fetchedContent ?? "(未抓取)"}`);
  console.log(`times: ${resumedResult.times ?? 0}`);
  console.log(`steps: ${JSON.stringify(resumedResult.steps ?? [])}`);

  await printCheckpointState("检查点状态（恢复后）", config);
}

main().catch(console.error);
