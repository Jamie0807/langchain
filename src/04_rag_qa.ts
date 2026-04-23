/**
 * 示例 04 - RAG（检索增强生成）
 * 学习目标：将文档切分、向量化存储，然后根据问题检索相关片段回答
 * 运行：npm run 04:rag
 *
 * 本示例使用内存向量库（MemoryVectorStore），无需额外搭建数据库
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

/**
 * 纯本地 Embeddings（零 API 费用）
 * 思路：把文本映射为固定长度向量（字符级哈希 + 归一化）
 * 注意：这只是教学版 Embedding，语义效果不如专业模型，但足够跑通 RAG 流程。
 */
// 本地向量化实现：字符级哈希 + L2 归一化
class LocalHashEmbeddings extends Embeddings {
  constructor(private readonly dimensions = 256) {
    super({});
  }
  // 将文本转换为固定长度的向量
  private embedText(text: string): number[] {
    const vec = new Array(this.dimensions).fill(0);
    const normalized = text.toLowerCase().replace(/\s+/g, " ");

    for (const ch of normalized) {
      // 简单稳定哈希：字符码映射到固定维度
      const idx = ch.codePointAt(0)! % this.dimensions;
      vec[idx] += 1;
    }

    // L2 归一化，避免长文本天然占优
    const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || 1;
    return vec.map((x) => x / norm);
  }
  // 把文档列表批量向量化，返回二维数组
  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map((doc) => this.embedText(doc));
  }
  // 把单个查询向量化，返回一维数组
  async embedQuery(document: string): Promise<number[]> {
    return this.embedText(document);
  }
}

// ---- 模拟"本地文档"内容 ----
const DOCUMENTS = [
  `
  LangChain 是一个用于构建 LLM 应用的框架。
  它提供了 Prompt 模板、链（Chain）、代理（Agent）、记忆（Memory）等核心模块。
  LangChain 支持 JavaScript/TypeScript 和 Python 两个版本。
  `,
  `
  LCEL（LangChain Expression Language）是 LangChain 的管道语法。
  使用 pipe() 方法可以将多个组件串联起来，例如：
  prompt.pipe(model).pipe(outputParser)
  LCEL 支持批量调用（batch）、流式输出（stream）和并行执行。
  `,
  `
  RAG（Retrieval-Augmented Generation，检索增强生成）是一种常用的 AI 应用架构。
  基本流程：1) 将文档切分并向量化存入向量库；2) 用户提问时，将问题向量化并检索相似文档；
  3) 将检索到的文档片段连同问题一起发给 LLM，让其基于上下文回答。
  RAG 解决了大模型"知识截止日期"和"幻觉"问题。
  `,
  `
  向量数据库（Vector Store）是 RAG 架构的核心组件。
  常见的向量数据库有：Pinecone、Weaviate、Chroma、Milvus、FAISS。
  在开发阶段，可以使用 LangChain 内置的 MemoryVectorStore（内存存储）快速验证。
  向量化模型（Embedding Model）负责将文本转换为高维向量，常用的有 OpenAI text-embedding-3-small。
  `,
  `
  LangGraph 是 LangChain 团队推出的新框架，专门用于构建复杂的多步骤 AI 工作流。
  它使用有向图（DAG）来描述任务流程，每个节点是一个处理步骤。
  LangGraph 适合构建需要条件判断、循环、多 Agent 协作的复杂应用。
  相比 LangChain 的 AgentExecutor，LangGraph 更加灵活和可控。
  `,
];
// 文档切分、向量化、存储的完整 RAG 流程示例
async function buildVectorStore() {
  console.log("📄 切分文档...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,  // 每块最多 200 字
    chunkOverlap: 20, // 块之间重叠 20 字，防止信息丢失
  });

  const docs = DOCUMENTS.map(
    (text, i) =>
      new Document({ pageContent: text.trim(), metadata: { source: `doc_${i + 1}` } })
  );

  const chunks = await splitter.splitDocuments(docs);
  console.log(`✅ 切分完成，共 ${chunks.length} 个片段`);

  console.log("🔢 使用本地 Embeddings 向量化并存入内存向量库...");
  const embeddings = new LocalHashEmbeddings(256);

  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  console.log("✅ 向量库构建完成\n");
  return vectorStore;
}

async function main() {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
  });

  const vectorStore = await buildVectorStore();
  const retriever = vectorStore.asRetriever({ k: 2 }); // 每次检索最相关的 2 个片段

  // 构建 RAG 提示词
  const ragPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `你是一个专业的 LangChain 助手。
请根据以下检索到的上下文回答用户问题。
如果上下文中没有相关信息，请如实说"我在文档中没有找到相关信息"，不要编造答案。

上下文：
{context}`,
    ],
    ["human", "{input}"],
  ]);

  // 创建 RAG 链
  const documentChain = await createStuffDocumentsChain({
    llm: model,
    prompt: ragPrompt,
    outputParser: new StringOutputParser(),
  });

  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain: documentChain,
  });

  // 测试问题
  const questions = [
    "什么是 LCEL？它有什么特点？",
    "RAG 的基本流程是什么？",
    "LangGraph 和 LangChain 有什么区别？",
    "常见的向量数据库有哪些？",
  ];

  for (const question of questions) {
    console.log(`\n❓ 问题: ${question}`);
    const result = await ragChain.invoke({ input: question });
    console.log(`💡 回答: ${result.answer}`);
    console.log(
      `📚 来源: ${result.context.map((d: Document) => d.metadata.source).join(", ")}`
    );
    console.log("─".repeat(60));
  }
}

main().catch(console.error);
