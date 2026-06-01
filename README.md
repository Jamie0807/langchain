# LangChain.js 入门学习项目

从零开始学习 LangChain.js 的本地 Ollama 示例，涵盖核心概念。

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

### 容易混淆：这些不是 LangChain API
- `async/await`
- `for await...of`
- `Array.map()`
- `console.log()`
- `process.stdout.write()`
- `dotenv/config`

---

## 学习路径

```
01 基础调用  →  02 Prompt 模板  →  03 结构化输出  →  04 RAG  →  05 Ollama  →  06 工具调用  →  07 消息系统  →  08 ReAct  →  09 createAgent  →  10 结构化响应 Agent  →  11 流式结构化响应
     ↓                ↓                  ↓               ↓            ↓             ↓               ↓               ↓             ↓                    ↓                         ↓
 理解模型        LCEL 管道语法      Schema 约束输出   检索增强生成   本地模型封装   Tool Calling     消息抽象        经典 Agent     v1 Agent             最终结构化结果               流式状态消费
```

## 进阶方向

- **对话记忆（Memory）**：让模型记住多轮对话上下文
- **Tool 调用 Agent**：让模型能调用外部工具（搜索、计算等）
- **LangGraph**：用图结构控制复杂多步骤 AI 工作流
- **真实 RAG**：读取本地 PDF/TXT/Markdown 文件

---

## 面试资料

- 面试相关内容已拆分到独立文件：[`INTERVIEW.md`](./INTERVIEW.md)
- 包含内容：高频问答、口语化速答模板
