/**
 * 示例 20 - Embedding
 * 学习目标：使用 OllamaEmbeddings 对切分后的文档和查询进行向量化
 * 运行：npm run 20:embedding
 */
import "dotenv/config";
import path from "node:path";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import type { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
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

async function loadChunks() {
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();
  const chunks = await splitter.splitDocuments(docs);

  return {
    docs,
    chunks,
  };
}

async function embedDocuments(chunks: Document[]) {
  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent)
  );

  console.log("=== 文档向量化结果 ===");
  console.log(`chunk 数量: ${chunks.length}`);
  console.log(`vector 数量: ${vectors.length}`);
  console.log(`vector 维度: ${vectors[0]?.length ?? 0}`);
  console.log("");

  if (chunks[0] && vectors[0]) {
    console.log("--- 第一个 chunk ---");
    console.log(chunks[0].pageContent);
    console.log("metadata:", chunks[0].metadata);
    console.log("vector 前 8 维:", vectors[0].slice(0, 8));
    console.log("");
  }

  return vectors;
}

async function embedQuery() {
  const query = "会 LangChain 的学生是谁？";
  const queryVector = await embeddings.embedQuery(query);

  console.log("=== 查询向量化结果 ===");
  console.log(`query: ${query}`);
  console.log(`vector 维度: ${queryVector.length}`);
  console.log("vector 前 8 维:", queryVector.slice(0, 8));
}

async function main() {
  const { docs, chunks } = await loadChunks();

  console.log("=== Embedding 示例 ===");
  console.log(`CSV 文件: ${csvPath}`);
  console.log(`原始文档数量: ${docs.length}`);
  console.log(`分块数量: ${chunks.length}`);
  console.log(`Embedding 模型: ${embeddingModel}`);
  console.log(`Ollama Base URL: ${getOllamaBaseUrl()}`);
  console.log("");

  await embedDocuments(chunks);
  await embedQuery();
}

main().catch(console.error);
