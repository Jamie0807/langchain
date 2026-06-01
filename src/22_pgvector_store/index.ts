/**
 * 示例 22 - PGVectorStore
 * 学习目标：使用 PostgreSQL + pgvector 持久化保存向量，并执行相似度检索
 * 运行：npm run 22:pgvector-store
 *
 * 可选环境变量：
 * - PGVECTOR_HOST
 * - PGVECTOR_PORT
 * - PGVECTOR_USER
 * - PGVECTOR_PASSWORD
 * - PGVECTOR_DATABASE
 * - PGVECTOR_TABLE
 */
import "dotenv/config";
import path from "node:path";
import type { Document } from "@langchain/core/documents";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import {
  type DistanceStrategy,
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { PoolConfig } from "pg";
import { getOllamaBaseUrl } from "../lib/ollama";

const csvPath = path.resolve(process.cwd(), "rag-document/student.csv");
const embeddingModel = "mxbai-embed-large:335m";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 40,
  chunkOverlap: 10,
});

const embeddings = new OllamaEmbeddings({
  baseUrl: getOllamaBaseUrl(),
  model: embeddingModel,
});

function getPgConfig() {
  const host = process.env.PGVECTOR_HOST ?? "127.0.0.1";
  const port = Number(process.env.PGVECTOR_PORT ?? "5432");
  const user = process.env.PGVECTOR_USER ?? "postgres";
  const password = process.env.PGVECTOR_PASSWORD ?? "postgres";
  const database = process.env.PGVECTOR_DATABASE ?? "embedding";
  const tableName = process.env.PGVECTOR_TABLE ?? "langchain_pgvector_students";

  const postgresConnectionOptions: PoolConfig = {
    host,
    port,
    user,
    password,
    database,
  };

  return {
    postgresConnectionOptions,
    tableName,
  };
}

async function loadChunks() {
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();
  const chunks = await splitter.splitDocuments(docs);
  return chunks;
}

async function buildPgVectorStore(chunks: Document[]) {
  const { postgresConnectionOptions, tableName } = getPgConfig();

  const vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions,
    tableName,
    columns: {
      idColumnName: "id",
      vectorColumnName: "vector",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    distanceStrategy: "cosine" as DistanceStrategy,
    dimensions: 1024,
  });

  await vectorStore.addDocuments(chunks);
  return vectorStore;
}

function printSearchResults(
  title: string,
  results: Array<[Document, number]>
) {
  console.log(`=== ${title} ===`);

  results.forEach(([doc, score], index) => {
    console.log(`--- Result ${index + 1} ---`);
    console.log(`score: ${score}`);
    console.log("pageContent:");
    console.log(doc.pageContent);
    console.log("metadata:");
    console.log(doc.metadata);
    console.log("");
  });
}

function printSetupHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("PGVectorStore 初始化失败。");
  console.error(message);
  console.error("");
  console.error("请确认以下条件：");
  console.error("1. PostgreSQL 服务已启动");
  console.error("2. 目标数据库已创建，例如 embedding");
  console.error("3. 已执行: CREATE EXTENSION IF NOT EXISTS vector;");
  console.error("4. 环境变量 PGVECTOR_HOST / PORT / USER / PASSWORD / DATABASE 配置正确");
}

async function main() {
  const chunks = await loadChunks();
  const { postgresConnectionOptions, tableName } = getPgConfig();

  console.log("=== PGVectorStore 示例 ===");
  console.log(`CSV 文件: ${csvPath}`);
  console.log(`分块数量: ${chunks.length}`);
  console.log(`Embedding 模型: ${embeddingModel}`);
  console.log(`PG Host: ${postgresConnectionOptions.host}`);
  console.log(`PG Port: ${postgresConnectionOptions.port}`);
  console.log(`PG Database: ${postgresConnectionOptions.database}`);
  console.log(`PG Table: ${tableName}`);
  console.log("");

  let vectorStore: PGVectorStore;
  try {
    vectorStore = await buildPgVectorStore(chunks);
  } catch (error) {
    printSetupHint(error);
    return;
  }

  try {
    const textQuery = "会 LangChain 的学生";
    const textResults = await vectorStore.similaritySearchWithScore(textQuery, 2);
    printSearchResults(`文本相似度检索: ${textQuery}`, textResults);

    const query = "数据科学";
    const queryVector = await embeddings.embedQuery(query);
    const vectorResults = await vectorStore.similaritySearchVectorWithScore(
      queryVector,
      2
    );
    printSearchResults(`向量相似度检索: ${query}`, vectorResults);
  } finally {
    await vectorStore.end();
  }
}

main().catch(console.error);
