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

---

## LangChain 面试高频问答（参考答案）

### 一、基础概念

1. **LangChain 是什么？解决什么问题？**  
  LangChain 是面向 LLM 应用的工程化框架，核心是把“提示词、模型调用、检索、工具调用、流程编排”抽象成统一接口。它解决的不是“模型能力”本身，而是应用落地中的重复工程问题：数据流串联、可复用性、可观测性、错误处理和可维护性。简单说，LangChain 让你更快从“会调用模型”走到“可上线系统”。

2. **Prompt / Chain / Agent / Tool 分别是什么？**  
  Prompt 负责定义任务目标和输出约束，是模型行为的第一控制层；Chain 是固定步骤的流水线，强调确定性和可复现；Tool 是外部能力接口（如搜索、数据库、内部 API）；Agent 则是在运行时让模型动态决策“是否调用工具、调用哪个工具、调用几次”。面试里常见追问是“何时用 Chain，何时用 Agent”：确定性流程优先 Chain，开放问题和复杂决策优先 Agent。

3. **`invoke`、`stream`、`batch` 的区别？**  
  `invoke` 是单次同步式调用，适合后端流程和一次性结果；`stream` 是增量输出，适合聊天 UI，用户等待体验更好；`batch` 是批量并发执行，适合高吞吐场景。工程上通常是“用户前台用 stream，后台批处理用 batch，普通任务用 invoke”。

4. **LCEL 是什么？为什么更好？**  
  LCEL（LangChain Expression Language）是 `pipe` 风格的数据流编排方式，核心思想是“上一步输出直接喂给下一步”。相比手写多段调用，LCEL 的优势是：表达更清晰、组件更可复用、天然支持 `invoke/stream/batch`，并且更容易接入 tracing 进行调试。面试里可以强调：LCEL 提升的是“复杂链路的可维护性”。

5. **`SystemMessage`、`HumanMessage`、`AIMessage` 区别？**  
  `SystemMessage` 是最高优先级的行为约束，通常放角色定义、安全边界、输出格式规则；`HumanMessage` 是用户自然输入；`AIMessage` 是模型返回内容。生产实践里常把“禁止编造、无答案时拒答、JSON 输出格式”写入 System，这比只在用户问题里要求更稳定。

### 二、工程实践

6. **如何设计可复用 Prompt 模板？**  
  推荐结构是“角色 + 任务 + 约束 + 输出格式 + 失败策略”，其中变化部分全部参数化（如 `{language}`、`{question}`）。模板应与业务数据解耦，便于复用和版本管理；同一任务保留多个模板版本做 A/B 测试，基于准确率和稳定性迭代。高质量模板的关键是“边界清晰”，而不是“文字越长越好”。

7. **如何做结构化输出？为什么要做？**  
  常见做法是 `JsonOutputParser` + 明确字段定义，或 schema 驱动的强约束输出。结构化输出的价值是把“可读文本”变成“可计算数据”：可直接入库、可规则校验、可接自动化流程，避免后续用脆弱的正则解析。对于生产系统，结构化输出几乎是必选项。

8. **如何应对输出格式漂移？**  
  实战建议用三层防护：第一层 Prompt 明确字段、类型和示例；第二层解析器/Schema 校验；第三层失败重试与自动修复（如二次提示“仅返回合法 JSON”）。如果仍失败，降级到兜底策略（规则提取或安全默认值），保证主流程不崩。

9. **如何做重试、超时、限流？**  
  需区分错误类型：网络抖动/5xx 可重试，4xx 参数错误应快速失败；429 走退避和排队。配置层面要有超时、指数退避、最大重试次数、并发上限；系统层面再加熔断和降级模型，避免雪崩。面试答题时可补一句：重试要“幂等”，避免副作用重复执行。

10. **如何做可观测性？**  
  可观测性至少覆盖四类指标：质量（命中率/正确率）、性能（延迟/吞吐）、成本（token）、稳定性（错误码/超时率）。同时记录 Prompt 版本、模型版本、检索片段和最终答案，支持链路级 tracing（如 LangSmith）做问题复盘。没有可观测性，LLM 系统很难稳定迭代。

### 三、RAG（重点）

11. **RAG 完整流程是什么？**  
  标准流程分离线与在线：离线做文档清洗、切分、向量化、建立索引；在线做查询向量化、相似检索、上下文拼接、答案生成与来源返回。高质量 RAG 还会加入 rerank、阈值过滤、答案校验三步，提高准确率并降低幻觉。

12. **为什么要切分？`chunkSize/chunkOverlap` 怎么调？**  
  切分是为了平衡“语义完整性”和“检索精度”：块太大噪声多，块太小上下文断裂。`chunkOverlap` 用来减少边界信息丢失，常见起点是 `chunkSize` 的 10%~20%。最佳参数依赖语料类型，必须通过离线评估和线上反馈共同调优。

13. **Embedding 原理是什么？**  
  Embedding 把文本投影到高维向量空间，使语义相近文本在向量空间中距离更近。检索阶段通过相似度（常见余弦相似度）找到最相关片段。它本质是“语义检索底座”，决定了 RAG 的召回上限。

14. **向量库如何选型？**  
  选型先看规模和运维能力：Demo/开发期可用内存库或 FAISS，本地快速验证；中小规模可用 Chroma；生产通常看托管能力、过滤能力、水平扩展、延迟 SLA 与成本。不要只看“检索速度”，还要看多租户、权限控制和备份恢复能力。

15. **`k` 怎么选？召回过多/过少怎么办？**  
  `k` 是召回和噪声的平衡参数：小了漏信息，大了引入干扰。实践中常用“top-k + 相似度阈值 + rerank”组合，并按问题类型动态调整 k。若仍噪声高，可先做 query rewrite 再检索。

16. **如何评估 RAG 效果？**  
  评估要分两层：离线评估看 recall@k、MRR、answer accuracy；在线评估看点击率、满意度、人工复核通过率、平均响应时延。建议建立“标准问集 + 回归测试”，每次改参数都跑对比，避免线上质量回退。

17. **如何降低幻觉？**  
  降幻觉常用组合拳：提高召回质量、严格 system 约束、要求引用来源、无证据时拒答。对关键业务再加后验校验（规则校验或第二模型审查），将“看起来像对的错误答案”拦截在输出前。

### 四、Agent 与工作流

18. **Agent 和 Chain 的区别？**  
  Chain 是固定流程，路径可预测、可测试、稳定性高；Agent 是运行时动态决策，灵活但不可控因素更多。工程上可用“Chain 优先、Agent 补充”的策略：核心链路保持确定性，开放任务交给 Agent。

19. **Tool Calling 原理与场景？**  
  Tool Calling 本质是“模型只做决策，真实动作由系统执行”：模型输出结构化调用参数，框架执行工具，再把结果回填给模型。适合需要外部事实源或真实操作的任务，如查库存、下单、查询知识库。

20. **LangChain vs LangGraph？**  
  LangChain 适合快速搭建线性或轻分支流程；LangGraph 强在状态机能力，支持循环、分支、人工介入、持久化与恢复执行。面试可总结为：LangChain 偏“组件编排”，LangGraph 偏“状态驱动工作流”。

21. **多步骤任务如何做状态管理？**  
  要把状态从“隐式”变“显式”：每个节点都定义输入、输出、错误和中间结果，并支持 checkpoint 持久化。这样故障时可以从中断点恢复，而不是整条链重跑。再配合幂等设计，重试才安全。

### 五、模型与部署

22. **OpenAI / OpenRouter / Ollama 差异？**  
  OpenAI：稳定、生态成熟、接口标准；OpenRouter：多模型统一入口，便于路由与切换；Ollama：本地私有部署，隐私和离线能力强。取舍核心在“能力/成本/合规/运维”四维平衡。

23. **本地模型优缺点？**  
  优点是数据可控、离线可用、边际成本低；缺点是硬件门槛高、推理速度和模型上限受限。面试时可以补一句：本地模型适合私有场景与成本敏感场景，但对高质量复杂推理常需云端模型兜底。

24. **如何做模型切换与降级？**  
  建议做配置化路由：按任务复杂度、预算、延迟目标选择模型；失败时自动回退到备选模型。常见策略是“小模型优先，失败升级大模型”，并叠加健康检查和熔断。

25. **如何做成本优化？**  
  成本优化优先级通常是：减少无效 token（裁剪上下文）、提高缓存命中、按场景路由小模型、批量处理、减少重试浪费。所有优化都要结合监控：每路请求 token、成功率、单位成本。

### 六、安全与生产

26. **如何防 Prompt Injection？**  
  防注入要做多层防线：系统指令与用户输入隔离、输入清洗、工具白名单、最小权限执行、敏感操作二次确认。关键思路是“永远不直接相信模型输出可以执行”，执行前必须校验。

27. **API Key 泄露怎么处理？**  
  第一时间吊销并轮换密钥，然后审计调用日志判断影响范围。若已提交到仓库，需清理 git 历史并强推；后续应启用密钥托管、最小权限和异常告警，避免二次泄露。

28. **如何处理敏感数据与合规？**  
  先做数据分级，再决定脱敏、加密、留存策略；生产链路全程可审计可追踪。涉及跨境或第三方模型时，要明确数据边界、合规责任和 DPA 条款。

29. **线上事故排查思路？**  
  先按层分诊（网络、模型、检索、业务）快速定位故障域，再看关键指标（错误码、延迟、token、召回命中率）。处置上优先保障可用性：回滚、降级、限流；事后复盘并沉淀监控和演练机制，防止同类问题重复发生。

---

## 面试口语化速答模板（20~30 秒/题）

> 用法：先“定义一句话”，再“落地一句话”，最后“权衡一句话”。

1. **LangChain 是什么？**  
  「LangChain 是 LLM 应用框架，核心是把 Prompt、检索、工具调用和流程编排标准化。落地价值是从 Demo 到生产更快，尤其在可复用和可观测性上。它不提升模型智商，但显著提升工程效率。」

2. **Chain 和 Agent 怎么选？**  
  「确定性流程我优先用 Chain，因为稳定且好测试；开放任务才用 Agent，因为它能动态选工具。我的原则是核心链路尽量确定，动态能力放在边缘场景，便于控风险。」

3. **RAG 是什么？**  
  「RAG 就是先检索再生成：先从知识库找证据，再让模型基于证据回答。这样可以降低幻觉、支持私有知识，并且文档更新后不用重训模型。」

4. **为什么要文档切分？**  
  「切分是为了检索精度和上下文成本平衡。块太大噪声多，太小语义断裂。我通常从 `chunkSize` 中等、`overlap` 10%~20% 起步，再根据命中率和答案质量调参。」

5. **结构化输出有什么价值？**  
  「结构化输出把可读文本变成可计算数据。好处是可校验、可入库、可自动化，能显著减少后处理失败率。生产里我会加 schema 校验和失败重试兜底。」

6. **如何降低幻觉？**  
  「我用三件事：提升召回质量、加强 system 约束、要求引用来源。无证据时明确拒答，关键场景再加后验校验，这样比单纯改 Prompt 稳定得多。」

7. **如何处理 429/超时/失败重试？**  
  「先分错误类型：5xx/网络抖动可重试，4xx 快速失败。然后配超时、指数退避、并发上限和熔断；必要时自动降级模型，保证服务可用性优先。」

8. **如何做模型路由和降级？**  
  「我做配置化路由：简单任务走小模型，复杂任务走大模型。调用失败会自动回退，结合健康检查和成本监控，实现质量、延迟、成本三方平衡。」

9. **LangChain 和 LangGraph 区别？**  
  「LangChain 更适合快速搭链，LangGraph 更适合复杂状态机。需要分支、循环、人工介入、可恢复执行时，我会选 LangGraph。」

10. **上线后怎么做可观测性？**  
   「我会同时看质量、性能、成本、稳定性四类指标：命中率、延迟、token、错误码。并记录 Prompt/模型版本和检索片段，方便 tracing 和问题复盘。」

11. **本地模型（Ollama）何时用？**  
   「对隐私和离线要求高时优先本地模型，成本也可控。但复杂推理和吞吐通常不如云模型，所以常见方案是本地优先 + 云端兜底。」

12. **API Key 泄露怎么应急？**  
   「第一步立刻吊销轮换，第二步审计调用日志，第三步清理仓库历史并强推。后续用密钥托管、最小权限和异常告警，防止再次发生。」

