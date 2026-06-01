/**
 * 示例 14 - Parallel StateGraph
 * 学习目标：使用 StateGraph 实现 Fan-out / Fan-in 并行执行
 * 运行：npm run 14:parallel-stategraph
 */
import "dotenv/config";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { createOllamaChatModel, sanitizeOllamaOutput } from "../lib/ollama";

const llm = createOllamaChatModel({
  temperature: 0.3,
  think: false,
});

// 定义状态图状态 - 包含主题、笑话、故事、诗歌、聚合输出、分支路径、调用次数
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  story: Annotation<string>,
  poem: Annotation<string>,
  combinedOutput: Annotation<string>,
  branches: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  llmCalls: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});

// 定义节点 - 调用 LLM 生成笑话
async function callLlm1(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    `写一个关于“${state.topic}”主题的简短笑话，只返回正文。`
  );

  return {
    joke: sanitizeOllamaOutput(response.content).trim(),
    branches: ["callLlm1"],
    llmCalls: 1,
  };
}

// 定义节点 - 调用 LLM 生成故事
async function callLlm2(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    `写一个关于“${state.topic}”主题的超短故事，只返回正文。`
  );

  return {
    story: sanitizeOllamaOutput(response.content).trim(),
    branches: ["callLlm2"],
    llmCalls: 1,
  };
}

// 定义节点 - 调用 LLM 生成诗歌
async function callLlm3(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    `写一个关于“${state.topic}”主题的短诗，只返回正文。`
  );

  return {
    poem: sanitizeOllamaOutput(response.content).trim(),
    branches: ["callLlm3"],
    llmCalls: 1,
  };
}

// 定义节点 - 聚合节点 - 合并笑话、故事、诗歌
async function aggregator(state: typeof StateAnnotation.State) {
  const combined = [
    `这里有一个关于“${state.topic}”的并行生成结果：`,
    "",
    `笑话：${state.joke ?? "(未生成)"}`,
    `故事：${state.story ?? "(未生成)"}`,
    `诗歌：${state.poem ?? "(未生成)"}`,
  ].join("\n");

  return {
    combinedOutput: combined,
    branches: ["aggregator"],
  };
}

// 定义状态图 - 包含节点、边、初始状态、结束状态
export const agent = new StateGraph(StateAnnotation)
  .addNode("callLlm1", callLlm1)
  .addNode("callLlm2", callLlm2)
  .addNode("callLlm3", callLlm3)
  .addNode("aggregator", aggregator)
  .addEdge(START, "callLlm1")
  .addEdge(START, "callLlm2")
  .addEdge(START, "callLlm3")
  .addEdge("callLlm1", "aggregator")
  .addEdge("callLlm2", "aggregator")
  .addEdge("callLlm3", "aggregator")
  .addEdge("aggregator", END)
  .compile();

async function main() {
  const result = await agent.invoke({
    topic: "程序员",
  });

  console.log("=== Parallel StateGraph 结果 ===");
  console.log(`topic: ${result.topic}`);
  console.log(`joke: ${result.joke ?? "(未生成)"}`);
  console.log(`story: ${result.story ?? "(未生成)"}`);
  console.log(`poem: ${result.poem ?? "(未生成)"}`);
  console.log(`branches: ${JSON.stringify(result.branches ?? [])}`);
  console.log(`llmCalls: ${result.llmCalls ?? 0}`);
  console.log("=== 聚合结果 ===");
  console.log(result.combinedOutput ?? "(未生成)");
}

main().catch(console.error);
