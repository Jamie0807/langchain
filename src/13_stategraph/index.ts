/**
 * 示例 13 - LangGraph StateGraph
 * 学习目标：使用 StateGraph + Annotation.Root 定义状态图、节点和条件边
 * 运行：npm run 13:stategraph
 */
import "dotenv/config";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { createOllamaChatModel, sanitizeOllamaOutput } from "../lib/ollama";

const llm = createOllamaChatModel({
  temperature: 0.3,
  think: false,
});

// 定义状态图状态
// 1. 基础字段：直接保存当前阶段的结果
// 2. reducer 字段：把每个节点返回的增量结果累积到数组或计数器中
// 3. default 字段：设置默认值，避免空指针异常
// 4. steps 字段：记录每个节点的执行顺序，方便调试
// 5. llmCalls 字段：记录调用模型的次数，方便统计

const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
  jokeHistory: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  steps: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  llmCalls: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});

// 定义节点 - 生成笑话
async function generateJoke(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(`写一个关于“${state.topic}”的冷笑话，只返回笑话内容。`);

  return {
    joke: sanitizeOllamaOutput(response.content).trim(),
    jokeHistory: [sanitizeOllamaOutput(response.content).trim()],
    steps: ["generateJoke"],
    llmCalls: 1,
  };
}

// 定义条件边 - 检查笑话是否符合要求
function checkPunchline(state: typeof StateAnnotation.State) {
  const joke = state.joke ?? "";
  if (/[!?！？。]/.test(joke) || joke.length >= 12) {
    return "Pass";
  }

  return "Fail";
}

// 定义节点 - 改进笑话
async function improveJoke(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(
    `请把这个笑话改得更自然一点，但仍然保持简短：${state.joke}`
  );

  return {
    improvedJoke: sanitizeOllamaOutput(response.content).trim(),
    jokeHistory: [sanitizeOllamaOutput(response.content).trim()],
    steps: ["improveJoke"],
    llmCalls: 1,
  };
}

// 定义节点 - 润色笑话
async function polishJoke(state: typeof StateAnnotation.State) {
  const source = state.improvedJoke || state.joke;
  const response = await llm.invoke(
    `请把这个笑话润色成最终版本，保留简洁和包袱：${source}`
  );

  return {
    finalJoke: sanitizeOllamaOutput(response.content).trim(),
    jokeHistory: [sanitizeOllamaOutput(response.content).trim()],
    steps: ["polishJoke"],
    llmCalls: 1,
  };
}

// 定义状态图 - 包含节点、边、初始状态、结束状态
export const agent = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge(START, "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: END,
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", END)
  .compile();

  // 执行状态图 - 生成笑话
async function main() {
  const result = await agent.invoke({
    topic: "程序员",
  });

  console.log("=== StateGraph 结果 ===");
  console.log(`topic: ${result.topic}`);
  console.log(`joke: ${result.joke ?? "(未生成)"}`);
  console.log(`improvedJoke: ${result.improvedJoke ?? "(未生成)"}`);
  console.log(`finalJoke: ${result.finalJoke ?? "(未生成)"}`);
  console.log(`jokeHistory: ${JSON.stringify(result.jokeHistory ?? [])}`);
  console.log(`steps: ${JSON.stringify(result.steps ?? [])}`);
  console.log(`llmCalls: ${result.llmCalls ?? 0}`);
}

main().catch(console.error);
