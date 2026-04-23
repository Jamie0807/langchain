# LangChain.js 入门学习项目

从零开始学习 LangChain.js 的 4 个由浅到深的示例，涵盖核心概念。

## 环境准备

**1. 安装依赖**
```bash
npm install
```

**2. 配置 API Key**

复制 `.env.example` 为 `.env`，填入你的 Key：
```bash
cp .env.example .env
```

```dotenv
OPENAI_API_KEY=你的 Key
OPENAI_BASE_URL=https://openrouter.ai/api/v1   # 使用 OpenRouter 免费模型
OPENAI_MODEL=openai/gpt-oss-20b:free
```

> 推荐使用 [OpenRouter](https://openrouter.ai) 申请免费 Key，无需信用卡。

---

## 运行示例

```bash
node_modules/.bin/tsx src/01_basic_call.ts
node_modules/.bin/tsx src/02_prompt_template.ts
node_modules/.bin/tsx src/03_structured_output.ts
node_modules/.bin/tsx src/04_rag_qa.ts
```

---

## 示例说明

### 01 - 基础模型调用 `01_basic_call.ts`
**学习目标**：初始化模型、发送 prompt、获取响应

| 知识点 | 说明 |
|--------|------|
| `ChatOpenAI` | 初始化模型，设置 temperature |
| `invoke(string)` | 最简单的调用方式，传字符串 |
| `invoke([messages])` | 传消息数组，用 SystemMessage 设定角色 |
| `stream()` | 流式输出，每生成一个 token 立即返回 |

---

### 02 - Prompt 模板 `02_prompt_template.ts`
**学习目标**：用模板构建可复用 prompt，理解 LCEL 管道语法

| 知识点 | 说明 |
|--------|------|
| `ChatPromptTemplate` | 定义带变量占位符的 prompt 模板 |
| `.pipe()` | LCEL 管道，将组件串联：`prompt → model → parser` |
| `StringOutputParser` | 将模型输出解析为纯字符串 |
| `.batch()` | 批量并行调用，一次处理多条输入 |

---

### 03 - 结构化输出 `03_structured_output.ts`
**学习目标**：让模型返回 JSON 格式，方便程序处理

| 知识点 | 说明 |
|--------|------|
| `JsonOutputParser` | 将模型输出解析为 JSON 对象 |
| Prompt 工程 | 在 system prompt 中指定 JSON 格式，兼容所有模型 |

---

### 04 - RAG 问答 `04_rag_qa.ts`
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

### 基础调用（`src/01_basic_call.ts` / `src/01_basic_call_ollama.ts`）
- `ChatOpenAI`
- `ChatOllama`
- `SystemMessage`
- `HumanMessage`
- `model.invoke()`
- `model.stream()`

### Prompt 模板 + LCEL（`src/02_prompt_template.ts`）
- `ChatPromptTemplate.fromMessages()`
- `StringOutputParser`
- `runnable.pipe()`
- `chain.invoke()`
- `chain.batch()`

### 结构化输出（`src/03_structured_output.ts`）
- `JsonOutputParser`
- `ChatPromptTemplate.fromMessages()`
- `runnable.pipe()`
- `chain.invoke()`

### RAG（`src/04_rag_qa.ts`）
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
