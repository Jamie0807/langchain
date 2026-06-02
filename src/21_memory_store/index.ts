/**
 * 示例 21 - Memory Vector Store
 * 学习目标：使用 MemoryVectorStore 在内存中保存向量，并进行相似度检索
 * 运行：npm run 21:memory-store
 */
import "dotenv/config";
import path from "node:path";
import type { Document } from "@langchain/core/documents";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
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

// 加载文档并切分
async function loadChunks() {
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();
  const chunks = await splitter.splitDocuments(docs);
  return chunks;
}

// 构建内存向量存储
async function buildMemoryStore(chunks: Document[]) {
  return MemoryVectorStore.fromDocuments(chunks, embeddings);
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
  });
}

async function main() {
  const chunks = await loadChunks();
  const vectorStore = await buildMemoryStore(chunks);

  console.log("=== MemoryVectorStore 示例 ===");
  console.log(`CSV 文件: ${csvPath}`);
  console.log(`分块数量: ${chunks.length}`);
  console.log(`Embedding 模型: ${embeddingModel}`);
  console.log(`内存向量数量: ${vectorStore.memoryVectors.length}`);

  const textQuery = "会 LangChain 的学生";
  
  // 文本相似度检索
  const textResults = await vectorStore.similaritySearchWithScore(textQuery, 2);
  printSearchResults(`文本相似度检索: ${textQuery}`, textResults);

  const query = "数据科学";
  const queryVector = await embeddings.embedQuery(query);
  const vectorResults = await vectorStore.similaritySearchVectorWithScore(queryVector, 2);
  printSearchResults(`向量相似度检索: ${query}`, vectorResults);
}

main().catch(console.error);
