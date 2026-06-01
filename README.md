# LangChain.js 入门学习项目

从零开始学习 LangChain.js 的本地 Ollama 示例，涵盖核心概念。

## 环境准备

**1. 安装依赖**
```bash
npm install
```

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

## LangChain API 总结（按文件）

### 基础调用（`src/01_basic_call/index.ts` / `src/01_basic_call_ollama/index.ts`）
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
01 基础调用  →  02 Prompt 模板  →  03 结构化输出  →  04 RAG
     ↓                ↓                  ↓               ↓
  理解模型        LCEL 管道语法        JSON 解析      检索增强生成
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
