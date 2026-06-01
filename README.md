# LangChain.js / LangGraph.js

从零开始学习 `LangChain.js` 的本地 Ollama 示例，内容既覆盖 `LangChain` 基础能力，也覆盖基于它继续向上搭建的 `Agent / LangGraph` 与 `RAG` 实践。

本仓库包含两条学习路线：

- `Agent / LangGraph` 主线：覆盖基础调用、结构化输出、工具调用、Agent、LangGraph 状态图，以及并行、子图与中断恢复工作流
- `RAG` 专项主线：覆盖从 `04_rag_qa` 的最小闭环入门，到 `18-23` 的 CSV 加载、文本切分、Embedding、向量检索、`PGVector` 持久化和完整 RAG 问答落地

## 环境准备

**1. 安装依赖**
```bash
npm install
```

> 当前项目已升级到 `LangChain v1`，建议使用 `Node.js 20+`。

**2. 启动 Ollama 并准备模型**

先安装并启动 [Ollama](https://ollama.com)，然后下载一个本地模型：

```bash
ollama pull qwen3:0.6b
```

**3. 配置 `.env`**

复制 `.env.example` 为 `.env`，填入本地 Ollama 配置：
```bash
cp .env.example .env
```

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:0.6b
```

> 默认使用本地 `Ollama`，无需 API Key。

---

## 常用命令

**环境准备**

```bash
# 查看本地 Ollama 已下载模型
node check_models.mjs
```

**运行示例**

```bash
npm run 01:basic
npm run 01:ollama
npm run 02:prompt
npm run 03:structured
npm run 04:rag
npm run 05:ollama
npm run 06:tools
npm run 07:messages
npm run 08:react-agent
npm run 09:create-agent
npm run 10:structured-agent
npm run 11:streaming-agent
npm run 12:langgraph-entrypoint
npm run 13:stategraph
npm run 14:parallel-stategraph
npm run 15:loop-agent
npm run 16:subgraph-agent
npm run 17:interrupt-checkpoint
npm run 18:csv-loader
npm run 19:text-splitter
npm run 20:embedding
npm run 21:memory-store
npm run 22:pgvector-store
npm run 23:full-rag
```

**编译产物**

```bash
# 使用 tsup 编译到 dist
npm run compile

# 监听源码变化并自动重新编译
npm run compile:watch

# 编译后可直接使用 node 运行产物
node dist/01_basic_call/index.mjs
```

---

## 示例说明

### 01 - 基础模型调用 `01_basic_call/index.ts`
**学习目标**：初始化模型、发送 prompt、获取响应

| 知识点 | 说明 |
|--------|------|
| `ChatOllama` | 初始化本地模型，设置 temperature |
| `invoke(string)` | 最简单的调用方式，传字符串 |
| `invoke([messages])` | 传消息数组，用 SystemMessage 设定角色 |
| `stream()` | 流式输出，每生成一个 token 立即返回 |

---

### 02 - Prompt 模板 `02_prompt_template/index.ts`
**学习目标**：用模板构建可复用 prompt，理解 LCEL 管道语法

| 知识点 | 说明 |
|--------|------|
| `ChatPromptTemplate` | 定义带变量占位符的 prompt 模板 |
| `.pipe()` | LCEL 管道，将组件串联：`prompt → model → parser` |
| `StringOutputParser` | 将模型输出解析为纯字符串 |
| `.batch()` | 批量并行调用，一次处理多条输入 |

---

### 03 - 结构化输出 `03_structured_output/index.ts`
**学习目标**：使用 `zod` 定义输出 schema，让模型直接返回结构化对象

| 知识点 | 说明 |
|--------|------|
| `z.object()` | 定义结构化输出 schema，并约束字段类型 |
| `withStructuredOutput()` | 让模型按 schema 直接返回结构化对象 |

---

### 04 - RAG 问答 `04_rag_qa/index.ts`
**学习目标**：文档切分 → 向量化 → 检索 → 基于上下文回答

| 知识点 | 说明 |
|--------|------|
| `RecursiveCharacterTextSplitter` | 将长文档切分为小块，避免超出 token 限制 |
| `MemoryVectorStore` | 内存向量库，开发阶段无需搭建数据库 |
| `LocalHashEmbeddings` | 本地向量化，零费用（教学用） |
| `createRetrievalChain` | 完整 RAG 链：检索 + 生成答案 |
| `asRetriever({ k: 2 })` | 每次检索最相关的 k 个片段 |

---

### 05 - Ollama 本地模型 `05_ollama/index.ts`
**学习目标**：掌握 Ollama 本地模型的基础调用、流式输出和 LCEL 用法

| 知识点 | 说明 |
|--------|------|
| `createOllamaChatModel()` | 统一初始化本地 Ollama 模型 |
| `getOllamaBaseUrl()` | 读取本地 Ollama 服务地址 |
| `getOllamaModelName()` | 读取当前使用的模型名 |
| `sanitizeOllamaOutput()` | 清洗模型输出中的标签或多余内容 |

---

### 06 - 工具调用 `06_tools/index.ts`
**学习目标**：让模型感知工具定义，并由应用代码手动执行工具

| 知识点 | 说明 |
|--------|------|
| `tool()` | 定义带 `zod` schema 的工具 |
| `model.bindTools()` | 把工具绑定到模型，允许模型选择调用 |
| `tool_calls` | 读取模型返回的工具调用信息 |
| `tool.invoke()` | 在应用层真正执行工具逻辑 |

---

### 07 - 消息系统 `07_messages/index.ts`
**学习目标**：理解 `SystemMessage`、`HumanMessage` 等消息类型，并用消息数组调用模型

| 知识点 | 说明 |
|--------|------|
| `SystemMessage` | 定义系统级提示，约束角色和输出风格 |
| `HumanMessage` | 表示用户真实输入的问题 |
| `model.invoke(messages)` | 直接传入消息数组调用模型 |
| `sanitizeOllamaOutput()` | 清洗返回内容，方便终端输出 |

---

### 08 - ReAct 智能体 `08_react_agent/index.ts`
**学习目标**：理解经典 ReAct 提示模板如何驱动 Agent 循环，并通过工具逐步推理得到答案

| 知识点 | 说明 |
|--------|------|
| `createReactAgent()` | 创建经典 ReAct Agent |
| `AgentExecutor` | 负责执行 Agent 与工具循环 |
| `PromptTemplate` | 手动定义 ReAct 提示模板 |
| `@langchain/classic` | 在 LangChain v1 中承载旧版 Agent API |

---

### 09 - createAgent `09_create_agent/index.ts`
**学习目标**：使用 LangChain v1 的 `createAgent()` 快速创建生产可用的 Agent

| 知识点 | 说明 |
|--------|------|
| `createAgent()` | LangChain v1 推荐的 Agent 创建方式 |
| `tool()` | 从根模块定义工具，直接交给 Agent 使用 |
| `systemPrompt` | 用系统提示约束 Agent 的行为 |
| `messages` | 用标准消息数组调用 Agent |

---

### 10 - 结构化响应 Agent `10_structured_response_agent/index.ts`
**学习目标**：使用 `createAgent()` 的 `responseFormat` 返回结构化数据，并读取 `structuredResponse`

| 知识点 | 说明 |
|--------|------|
| `responseFormat` | 指定 Agent 最终输出的结构化 schema |
| `toolStrategy()` | 显式指定用工具调用策略返回结构化结果 |
| `structuredResponse` | 从 Agent 最终结果中读取结构化对象 |
| `z.object()` | 定义结构化输出字段与类型约束 |

---

### 11 - 流式结构化响应 Agent `11_streaming_response_agent/index.ts`
**学习目标**：使用 `agent.stream()` 流式消费消息，并在结束时得到结构化结果

| 知识点 | 说明 |
|--------|------|
| `agent.stream()` | 以流式方式执行 Agent |
| `streamMode: "values"` | 按状态快照持续返回执行过程 |
| `for await...of` | 逐步消费流中的每个 chunk |
| `structuredResponse` | 在流结束后提取最终结构化结果 |

---

### 12 - LangGraph Entrypoint Agent `12_langgraph_entrypoint/index.ts`
**学习目标**：使用 LangGraph Functional API 拆分工具定义、模型绑定、模型节点、工具节点，并通过 `entrypoint()` 组装 Agent

| 知识点 | 说明 |
|--------|------|
| `entrypoint()` | 定义 LangGraph Functional API 的工作流入口 |
| `addMessages()` | 把模型消息和工具结果追加回消息历史 |
| `model.bindTools()` | 将工具绑定到模型，让模型可以发起 `tool_calls` |
| `judgeIntent()` | 显式判断当前该走工具调用还是直接返回结果 |
| `executeIntent()` | 根据意图执行具体动作，例如调用工具或结束流程 |
| `tool()` | 定义带 schema 的工具能力 |
| `ToolMessage` | 表示工具执行完成后返回给模型的结果消息 |

**目录结构说明**

- `1.tools.ts`：定义工具本身，例如 `add`、`multiply`、`divide`
- `2.model.ts`：初始化 `ChatOllama`，并通过 `bindTools()` 把工具绑定到模型
- `3.model-node.ts`：定义模型节点，负责调用 LLM 并生成下一步消息或 `tool_calls`
- `4.tool-node.ts`：定义工具节点，负责根据 `tool_call` 执行对应工具
- `5.intent-node.ts`：定义意图判断节点，判断当前是调用工具还是直接响应
- `6.execute-intent.ts`：定义意图执行节点，按意图执行工具或结束流程
- `agent.ts`：使用 `entrypoint()` 把模型节点、工具节点、意图节点串起来，形成完整 Agent 循环
- `index.ts`：运行入口，负责发起一次调用并打印最终消息结果

**运行结果示例**

```txt
用户问题 -> 模型节点 -> 意图判断
如果有 tool_calls -> 工具节点 -> 回到模型节点
如果无 tool_calls -> 返回最终 AIMessage
```

---

### 13 - StateGraph 状态图 `13_stategraph/index.ts`
**学习目标**：使用 `StateGraph` 和 `Annotation.Root` 定义状态、reducer 和条件边，构建可编排的多步骤工作流

| 知识点 | 说明 |
|--------|------|
| `StateGraph` | 用状态驱动的方式组织多节点工作流 |
| `Annotation.Root` | 定义整个状态对象的结构 |
| `Annotation<string>` | 为状态字段声明类型 |
| `default: () => []` | 为 reducer 字段提供默认初始值 |
| `reducer: (a, b) => ...` | 定义状态更新时的合并策略 |
| `addConditionalEdges()` | 根据条件函数动态决定后续节点 |
| `START` | 状态图起点 |
| `END` | 状态图终点 |

**文件结构说明**

- `index.ts`：定义状态、节点、条件边和最终编译后的 `StateGraph`

**概念说明**

- 状态图是一种用于描述复杂流程的图，每个节点表示一个状态，每条边表示状态之间的转换
- 节点是状态图的基本单位，状态图的执行流程就是从一个节点流转到另一个节点
- 边是状态图的连接线，用于描述状态之间如何衔接
- 条件边会根据当前状态判断下一步应该走哪条路径

**状态定义说明**

- `topic / joke / improvedJoke / finalJoke`：基础字段，保存当前阶段结果
- `jokeHistory`：数组 reducer，累计保存每个阶段生成的笑话版本
- `steps`：数组 reducer，累计保存执行过的节点名称
- `llmCalls`：数值 reducer，累计统计模型调用次数

**运行结果示例**

```txt
START
  -> generateJoke
  -> checkPunchline
     -> Pass: improveJoke -> polishJoke -> END
     -> Fail: END
```

---

### 14 - Parallel StateGraph `14_parallel_stategraph/index.ts`
**学习目标**：使用 `StateGraph` 实现并行节点执行，理解 `Fan-out / Fan-in`、`aggregator` 以及并行状态聚合方式

| 知识点 | 说明 |
|--------|------|
| `Fan-out / Fan-in` | 从 `START` 并行分发到多个节点，再汇总到同一个聚合节点 |
| `aggregator` | 在所有并行分支完成后统一拼装最终输出 |
| `branches` reducer | 用数组聚合每个并行节点的执行轨迹 |
| `llmCalls` reducer | 用数值累加统计并行分支中的模型调用次数 |
| `START / END` | 明确并行工作流的起点和终点 |

**文件结构说明**

- `index.ts`：定义并行状态、三个并行节点、`aggregator` 聚合节点以及最终编译后的 `StateGraph`

**并行状态聚合说明**

- `topic`：共享输入，作为三个并行节点共同读取的主题
- `joke / story / poem`：各并行节点分别写入自己的结果字段，互不覆盖
- `branches`：使用数组 reducer 聚合每个节点返回的节点名，最终可看到完整执行路径
- `llmCalls`：使用数值 reducer 聚合每个分支的调用次数，最终统计总共调用了几次模型
- `combinedOutput`：由 `aggregator` 节点统一读取前面各分支结果后生成最终汇总文本

**运行结果示例**

```txt
START
  -> callLlm1 ----\
  -> callLlm2 -----+-> aggregator -> END
  -> callLlm3 ----/

branches: ["callLlm1", "callLlm2", "callLlm3", "aggregator"]
llmCalls: 3
```

---

### 15 - Loop Agent `15_loop_agent/index.ts`
**学习目标**：使用 `StateGraph`、条件边和循环边实现带循环的 Agent，理解 `modelNode -> shouldContinue -> fetchTool -> modelNode` 的执行方式

| 知识点 | 说明 |
|--------|------|
| `StateGraph` | 用状态驱动方式组织循环型 Agent 工作流 |
| `tool()` | 定义 `fetch` 工具，供工具节点执行 |
| `addConditionalEdges()` | 根据 `shouldContinue()` 的结果决定继续循环还是结束 |
| `InMemoryStore` | 为编译后的图提供内存存储能力 |
| `START / END` | 明确循环图的起点与终点 |

**文件结构说明**

- `index.ts`：定义状态、`fetch` 工具、模型节点、工具节点、条件函数和带循环边的 `StateGraph`

**状态定义说明**

- `url`：当前要抓取的目标地址
- `times`：剩余循环次数，每次工具执行后递减
- `lastFetchedContent`：保存最近一次工具抓取到的页面内容
- `currentSummary`：保存模型节点对当前状态的阶段性总结
- `steps`：数组 reducer，累计记录 `modelNode` 和 `fetchTool` 的执行顺序
- `modelNotes`：数组 reducer，累计保存每一轮模型节点的输出摘要
- `fetchCount`：数值 reducer，累计统计工具节点实际执行次数

**运行结果示例**

```txt
START
  -> modelNode
  -> shouldContinue
     -> continue: fetchTool -> modelNode
     -> stop: END

steps: ["modelNode", "fetchTool", "modelNode", "fetchTool", "modelNode"]
fetchCount: 2
remainingTimes: 0
```

---

### 16 - Subgraph Agent `16_subgraph_agent/index.ts`
**学习目标**：使用 `StateGraph` 在主图中嵌套子图，理解“主图调度 + 子图内部循环”的执行方式

| 知识点 | 说明 |
|--------|------|
| `StateGraph` | 同时定义主图和子图的工作流结构 |
| `subAgent.invoke()` | 在主图节点中显式调用子图 |
| `tool()` | 定义 `fetch` 工具，供子图工具节点执行 |
| `addConditionalEdges()` | 在子图内部根据条件继续循环或结束 |
| `InMemoryStore` | 为主图和子图编译结果提供内存存储能力 |

**文件结构说明**

- `index.ts`：定义共享状态、`fetch` 工具、子图节点、主图节点，以及“主图调用子图”的 `StateGraph`

**状态定义说明**

- `url`：当前要抓取的目标地址
- `times`：剩余抓取次数，由子图内部循环逐步递减
- `lastFetchedContent`：保存子图最近一次工具抓取内容
- `currentSummary`：保存子图模型节点的阶段性总结
- `mainSummary`：保存主图模型节点的调度说明
- `steps`：数组 reducer，累计记录主图节点、子图节点和工具节点的执行顺序
- `modelNotes`：数组 reducer，累计保存主图和子图模型节点的输出摘要
- `fetchCount`：数值 reducer，累计统计子图工具节点执行次数

**运行结果示例**

```txt
Main Graph:
START -> modelNode -> subAgent -> END

Sub Graph:
START -> subModelNode
       -> shouldContinue
          -> continue: fetchTool -> subModelNode
          -> stop: END

steps: ["mainModelNode", "subAgent", "subModelNode", "fetchTool", "subModelNode", "fetchTool", "subModelNode"]
fetchCount: 2
remainingTimes: 0
```

---

### 17 - Interrupt And Checkpoint `17_interrupt_checkpoint/index.ts`
**学习目标**：使用 `interrupt()`、`MemorySaver` 和 `thread_id` 实现中断、检查点保存与恢复执行

| 知识点 | 说明 |
|--------|------|
| `interrupt()` | 在节点中主动暂停执行并等待恢复输入 |
| `MemorySaver` | 保存当前线程的检查点，支持后续恢复 |
| `Command({ resume })` | 恢复被中断的线程，继续执行后续节点 |
| `configurable.thread_id` | 标识同一条执行线程，用于读取和恢复检查点 |
| `getState()` | 获取当前检查点快照，查看 `next`、任务和状态值 |

**文件结构说明**

- `index.ts`：定义状态、`fetch` 工具、模型节点、中断节点、工具节点，以及“中断后恢复”的完整示例

**状态定义说明**

- `url`：当前要抓取的目标地址
- `times`：剩余抓取次数，在工具执行后递减
- `approved`：恢复执行时通过 `Command({ resume })` 传回的审批结果
- `modelSummary`：模型节点生成的中断前阶段总结
- `fetchedContent`：工具节点抓取到的页面内容
- `steps`：数组 reducer，累计记录 `modelNode`、`interruptNode`、`fetchTool` 的执行轨迹

**运行结果示例**

```txt
第一次执行:
START -> modelNode -> interruptNode
interrupt() -> 保存检查点 -> 暂停执行

第二次执行:
使用相同 thread_id + Command({ resume: "批准继续抓取" })
interruptNode -> fetchTool -> END

steps: ["modelNode", "interruptNode", "fetchTool"]
times: 0
```

---

### 18 - 23 RAG 学习链路概览
这一段示例是一条从“原始数据”到“可问答系统”的完整 RAG 学习链路：

```txt
18 CSV 加载
  -> 19 文本切分
  -> 20 Embedding 向量化
  -> 21 MemoryVectorStore 内存检索
  -> 22 PGVectorStore 持久化检索
  -> 23 Full RAG 检索增强问答
```

数据源统一使用 `rag-document/student.csv`，内容是学生基础信息，适合用来观察每一步的输入输出变化。

### `04_rag_qa` 和 `18-23` 的关系：RAG 从入门到完整落地

`04_rag_qa` 可以理解为“RAG 最小可运行版本”，它把文档切分、向量化、向量存储、检索、回答这些步骤一次性串起来，适合第一次建立对 RAG 的整体认知。

`18-23` 则是在这个基础上，把同一条链路拆成更细的学习阶段，帮助你看清楚每一步到底输入了什么、输出了什么、为什么这样设计。

| 对比项 | `04_rag_qa` | `18-23` |
|--------|-------------|----------|
| 学习定位 | 快速入门 RAG 全流程 | 拆解 RAG 并逐步落地 |
| 组织方式 | 一个示例直接跑通 | 六个示例分步骤展开 |
| 数据入口 | 直接围绕文档切分和检索链展开 | 从 `CSVLoader` 读取原始数据开始 |
| Embedding | 使用 `LocalHashEmbeddings` 做教学演示 | 使用 `OllamaEmbeddings` 接近真实环境 |
| 向量存储 | `MemoryVectorStore` | 先 `MemoryVectorStore`，再过渡到 `PGVectorStore` |
| 检索结果处理 | 直接交给检索链回答 | 先召回，再做简单词法补强，再交给 LLM |
| 工程视角 | 先理解“RAG 是什么” | 进一步理解“RAG 怎么拆、怎么扩展、怎么上线” |

**推荐学习顺序**

1. 先看 `04_rag_qa`，建立 RAG 的最小心智模型
2. 再看 `18` 到 `22`，把加载、切分、向量化、检索、持久化逐步拆开理解
3. 最后看 `23_full_rag`，理解如何把这些步骤重新组装成可追溯的完整问答流程

**可以把它们理解成下面这层关系**

```txt
04_rag_qa
  = RAG 最小闭环示例

18_csv_loader
  -> 19_text_splitter
  -> 20_embedding
  -> 21_memory_store
  -> 22_pgvector_store
  -> 23_full_rag
  = RAG 拆解学习版 + 更接近真实落地版
```

如果你只想快速知道 RAG 是怎么工作的，看 `04` 就够了；如果你想把 RAG 真正做成一个能扩展、能替换组件、能接数据库的工程化流程，就继续顺着 `18-23` 往下学。

---

### 18 - CSV Loader `18_csv_loader/index.ts`
**学习目标**：使用 `CSVLoader` 把 CSV 文件转换成 LangChain `Document` 列表，作为后续 RAG 流程的输入

| 知识点 | 说明 |
|--------|------|
| `CSVLoader` | 读取本地 CSV 文件，并按行生成 `Document` |
| `loader.load()` | 执行加载，返回文档数组 |
| `Document.pageContent` | 保存当前行的文本内容 |
| `Document.metadata` | 保存来源路径、行号等元信息 |
| `path.resolve()` | 生成跨平台可用的绝对路径 |

**这一节产出什么**

- 看到 CSV 每一行如何被转成一个 `Document`
- 理解后续切分、向量化、检索都不是直接操作原始文件，而是操作 `Document[]`

---

### 19 - Text Splitter `19_text_splitter/index.ts`
**学习目标**：使用 `RecursiveCharacterTextSplitter` 把加载后的文档切成更适合 Embedding 和检索的小块

| 知识点 | 说明 |
|--------|------|
| `RecursiveCharacterTextSplitter` | 按字符长度递归切分文本 |
| `chunkSize` | 每个 chunk 的目标大小 |
| `chunkOverlap` | 相邻 chunk 的重叠长度，降低语义断裂 |
| `splitDocuments()` | 对 `Document[]` 执行批量切分 |
| `chunk.metadata` | 保留原始来源信息，便于后续回溯来源 |

**为什么要切分**

- 原始文档过长时，不适合直接向量化和检索
- chunk 太大容易引入无关信息，chunk 太小又可能损失语义
- `19` 这一节就是在观察 RAG 中最基础的分块策略

---

### 20 - Embedding `20_embedding/index.ts`
**学习目标**：使用 `OllamaEmbeddings` 把文本 chunk 和用户查询转换成向量

| 知识点 | 说明 |
|--------|------|
| `OllamaEmbeddings` | 调用本地 Ollama Embedding 模型生成向量 |
| `embedDocuments()` | 批量把文档内容转成向量 |
| `embedQuery()` | 把查询问题转成向量 |
| `mxbai-embed-large:335m` | 当前示例使用的本地 Embedding 模型 |
| `vector.length` | 向量维度，后续建库时需要一致 |

**这一节核心理解**

- 文档和查询必须落到同一向量空间，才能做相似度检索
- `20` 这一节把“文本”正式变成了“可计算距离的数值表示”

---

### 21 - Memory Vector Store `21_memory_store/index.ts`
**学习目标**：使用 `MemoryVectorStore` 在内存里保存向量，并完成最基础的相似度检索

| 知识点 | 说明 |
|--------|------|
| `MemoryVectorStore.fromDocuments()` | 直接从文档和 embeddings 构建内存向量库 |
| `similaritySearchWithScore()` | 传入文本查询，返回最相似文档和分数 |
| `similaritySearchVectorWithScore()` | 传入向量查询，返回最相似文档和分数 |
| `memoryVectors.length` | 查看当前内存中保存了多少条向量 |
| `Document + score` | 检索结果不只是文本，还带相似度信息 |

**这一节适合做什么**

- 本地验证 RAG 检索效果
- 不依赖数据库，先把“切分 + 向量化 + 检索”最小闭环跑通

---

### 22 - PGVector Store `22_pgvector_store/index.ts`
**学习目标**：把向量从内存迁移到 PostgreSQL + `pgvector`，实现可持久化的向量检索

| 知识点 | 说明 |
|--------|------|
| `PGVectorStore.initialize()` | 初始化 pgvector 向量表和检索能力 |
| `postgresConnectionOptions` | 配置 PostgreSQL 连接参数 |
| `tableName` | 指定向量表名，避免和其他项目冲突 |
| `distanceStrategy: "cosine"` | 使用余弦距离做相似度检索 |
| `dimensions: 1024` | 明确向量维度，需与 Embedding 模型输出一致 |
| `addDocuments()` | 把文档 chunk 写入数据库向量表 |
| `vectorStore.end()` | 关闭数据库连接，避免进程挂住 |

**运行前提**

- 已启动 PostgreSQL
- 已在目标数据库执行 `CREATE EXTENSION IF NOT EXISTS vector;`
- 已正确配置 `PGVECTOR_HOST`、`PGVECTOR_PORT`、`PGVECTOR_USER`、`PGVECTOR_PASSWORD`、`PGVECTOR_DATABASE`

**这一节的意义**

- `21` 解决“能检索”，`22` 解决“能持久化、可扩展”
- 是从教学 demo 迈向真实生产 RAG 的关键一步

---

### 23 - Full RAG `23_full_rag/index.ts`
**学习目标**：把 CSV 加载、切分、Embedding、向量存储、检索、LLM 回答完整串起来，形成一个最小可用 RAG 问答流程

| 知识点 | 说明 |
|--------|------|
| `loadDocuments()` | 加载原始 CSV 文档 |
| `splitDocuments()` | 对文档做分块 |
| `buildVectorStore()` | 构建内存向量库 |
| `similaritySearchWithScore()` | 先召回候选 chunk |
| `lexicalScore()` | 在向量召回后做一层词法排序补强 |
| `formatContext()` | 把检索结果拼成可注入 prompt 的上下文 |
| `llm.invoke()` | 让模型基于检索上下文生成答案 |
| `formatSources()` | 输出来源片段，便于核对答案是否可追溯 |

**完整执行链路**

```txt
CSVLoader
  -> splitDocuments
  -> OllamaEmbeddings
  -> MemoryVectorStore
  -> similaritySearchWithScore
  -> lexical rerank
  -> LLM answer
  -> sources
```

**这一节的重点**

- 不只是“查到内容”，而是把“召回结果 + 提示词约束 + 答案生成 + 来源展示”一起串起来
- 是 `18` 到 `22` 的综合落地版本

---

## LangChain API 总结（按文件）

### 基础调用（`src/01_basic_call/index.ts`）
- `ChatOllama`
- `SystemMessage`
- `HumanMessage`
- `model.invoke()`
- `model.stream()`

### Prompt 模板 + LCEL（`src/02_prompt_template/index.ts`）
- `ChatPromptTemplate.fromMessages()`
- `StringOutputParser`
- `runnable.pipe()`
- `chain.invoke()`
- `chain.batch()`

### 结构化输出（`src/03_structured_output/index.ts`）
- `z.object()`
- `ChatPromptTemplate.fromMessages()`
- `model.withStructuredOutput()`
- `runnable.pipe()`
- `chain.invoke()`

### RAG（`src/04_rag_qa/index.ts`）
- `RecursiveCharacterTextSplitter`
- `splitter.splitDocuments()`
- `Document`
- `Embeddings`（基类）
- `MemoryVectorStore.fromDocuments()`
- `vectorStore.asRetriever()`
- `ChatPromptTemplate.fromMessages()`
- `createStuffDocumentsChain()`
- `createRetrievalChain()`
- `ragChain.invoke()`

### Ollama 本地模型（`src/05_ollama/index.ts`）
- `createOllamaChatModel()`
- `getOllamaBaseUrl()`
- `getOllamaModelName()`
- `sanitizeOllamaOutput()`
- `StringOutputParser`

### 工具调用（`src/06_tools/index.ts`）
- `tool()`
- `z.object()`
- `model.bindTools()`
- `tool.invoke()`
- `AIMessage.tool_calls`

### 消息系统（`src/07_messages/index.ts`）
- `SystemMessage`
- `HumanMessage`
- `model.invoke(messages)`
- `AIMessage`

### 经典 ReAct Agent（`src/08_react_agent/index.ts`）
- `createReactAgent()`
- `AgentExecutor`
- `PromptTemplate`
- `tool()`
- `@langchain/classic/agents`

### createAgent（`src/09_create_agent/index.ts`）
- `createAgent()`
- `tool()`
- `ChatOllama`
- `systemPrompt`
- `messages`

### 结构化响应 Agent（`src/10_structured_response_agent/index.ts`）
- `createAgent()`
- `responseFormat`
- `toolStrategy()`
- `structuredResponse`
- `z.object()`

### 流式结构化响应 Agent（`src/11_streaming_response_agent/index.ts`）
- `agent.stream()`
- `streamMode: "values"`
- `for await...of`
- `AIMessage`
- `structuredResponse`

### LangGraph Entrypoint Agent（`src/12_langgraph_entrypoint/index.ts`）
- `entrypoint()`
- `addMessages()`
- `judgeIntent()`
- `executeIntent()`
- `tool()`
- `model.bindTools()`
- `ToolMessage`

### StateGraph 状态图（`src/13_stategraph/index.ts`）
- `StateGraph`
- `Annotation.Root`
- `Annotation<string>`
- `addConditionalEdges()`
- `START`
- `END`
- `default: () => []`
- `reducer: (a, b) => ...`

### Parallel StateGraph（`src/14_parallel_stategraph/index.ts`）
- `StateGraph`
- `START`
- `END`
- `aggregator`
- `Fan-out / Fan-in`
- `default: () => []`
- `reducer: (a, b) => ...`

### Loop Agent（`src/15_loop_agent/index.ts`）
- `StateGraph`
- `tool()`
- `addConditionalEdges()`
- `InMemoryStore`
- `START`
- `END`
- `reducer: (a, b) => ...`

### Subgraph Agent（`src/16_subgraph_agent/index.ts`）
- `StateGraph`
- `subAgent.invoke()`
- `tool()`
- `addConditionalEdges()`
- `InMemoryStore`
- `START`
- `END`

### Interrupt And Checkpoint（`src/17_interrupt_checkpoint/index.ts`）
- `interrupt()`
- `MemorySaver`
- `Command({ resume })`
- `getState()`
- `configurable.thread_id`
- `StateGraph`
- `InMemoryStore`

### CSV Loader（`src/18_csv_loader/index.ts`）
- `CSVLoader`
- `loader.load()`
- `Document.pageContent`
- `Document.metadata`

### Text Splitter（`src/19_text_splitter/index.ts`）
- `RecursiveCharacterTextSplitter`
- `splitter.splitDocuments()`
- `chunkSize`
- `chunkOverlap`
- `Document`

### Embedding（`src/20_embedding/index.ts`）
- `OllamaEmbeddings`
- `embedDocuments()`
- `embedQuery()`
- `getOllamaBaseUrl()`

### Memory Vector Store（`src/21_memory_store/index.ts`）
- `MemoryVectorStore.fromDocuments()`
- `similaritySearchWithScore()`
- `similaritySearchVectorWithScore()`
- `memoryVectors`

### PGVector Store（`src/22_pgvector_store/index.ts`）
- `PGVectorStore.initialize()`
- `addDocuments()`
- `similaritySearchWithScore()`
- `similaritySearchVectorWithScore()`
- `distanceStrategy`
- `dimensions`

### Full RAG（`src/23_full_rag/index.ts`）
- `CSVLoader`
- `RecursiveCharacterTextSplitter`
- `OllamaEmbeddings`
- `MemoryVectorStore.fromDocuments()`
- `similaritySearchWithScore()`
- `llm.invoke()`
- `Document.metadata`

### 容易混淆：这些不是 LangChain API
- `async/await`
- `for await...of`
- `Array.map()`
- `console.log()`
- `process.stdout.write()`
- `dotenv/config`

---

## 学习路径

**主线一：01-17 Agent / LangGraph**

```txt
01 基础调用
  -> 02 Prompt 模板
  -> 03 结构化输出
  -> 05 Ollama
  -> 06 工具调用
  -> 07 消息系统
  -> 08 ReAct
  -> 09 createAgent
  -> 10 结构化响应 Agent
  -> 11 流式结构化响应
  -> 12 LangGraph Entrypoint
  -> 13 StateGraph 状态图
  -> 14 Parallel StateGraph
  -> 15 Loop Agent
  -> 16 Subgraph Agent
  -> 17 Interrupt And Checkpoint
```

- 从模型调用、Prompt、结构化输出开始，逐步进入工具调用、Agent 和 LangGraph 编排
- 这一条线更适合建立 LangChain / LangGraph 的整体能力地图

**主线二：04 + 18-23 RAG 专项**

```txt
04 RAG 问答
  -> 18 CSV Loader
  -> 19 Text Splitter
  -> 20 Embedding
  -> 21 Memory Store
  -> 22 PGVector Store
  -> 23 Full RAG
```

- `04` 先帮助你快速理解 RAG 最小闭环：切分、向量化、检索、回答
- `18-23` 再把这条链路拆开，补齐数据加载、向量持久化和完整问答落地

**怎么学更顺**

- 想先搭整体框架：按主线一学习，再专项补主线二
- 想专攻 RAG：先看 `04`，再顺着 `18 -> 23` 走完整条 RAG 专项线


---
