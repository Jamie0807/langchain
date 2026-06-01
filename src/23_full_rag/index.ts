/**
 * 示例 23 - Full RAG
 * 学习目标：串起 CSV 加载、文本切分、向量化、内存存储、检索增强生成的完整流程
 * 运行：npm run 23:full-rag
 */
import "dotenv/config";
import path from "node:path";
import type { Document } from "@langchain/core/documents";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  createOllamaChatModel,
  getOllamaBaseUrl,
  getOllamaModelName,
  sanitizeOllamaOutput,
} from "../lib/ollama";

const csvPath = path.resolve(process.cwd(), "rag-document/student.csv");
const embeddingModel = "mxbai-embed-large:335m";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
});

const embeddings = new OllamaEmbeddings({
  baseUrl: getOllamaBaseUrl(),
  model: embeddingModel,
});

const llm = createOllamaChatModel({
  temperature: 0,
  think: false,
});

async function loadDocuments() {
  const loader = new CSVLoader(csvPath);
  return loader.load();
}

async function splitDocuments(docs: Document[]) {
  return splitter.splitDocuments(docs);
}

async function buildVectorStore(chunks: Document[]) {
  return MemoryVectorStore.fromDocuments(chunks, embeddings);
}

function formatContext(docs: Document[]) {
  return docs
    .map((doc, index) => {
      const source = String(doc.metadata.source ?? "unknown");
      const line = String(doc.metadata.line ?? "-");
      return [
        `[片段 ${index + 1}]`,
        `source: ${source}`,
        `line: ${line}`,
        doc.pageContent,
      ].join("\n");
    })
    .join("\n\n");
}

function formatSources(docs: Document[]) {
  return docs
    .map((doc, index) => {
      const source = String(doc.metadata.source ?? "unknown");
      const line = String(doc.metadata.line ?? "-");
      return `${index + 1}. ${source}#line=${line}`;
    })
    .join("\n");
}

function toBigrams(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}]+/gu, "");
  const grams: string[] = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.push(normalized.slice(index, index + 2));
  }

  return grams;
}

function lexicalScore(question: string, doc: Document) {
  const questionGrams = new Set(toBigrams(question));
  const docGrams = toBigrams(doc.pageContent);
  let score = 0;

  for (const gram of docGrams) {
    if (questionGrams.has(gram)) {
      score += 1;
    }
  }

  return score;
}

async function answerQuestion(
  vectorStore: MemoryVectorStore,
  question: string
) {
  const recalledDocs = await vectorStore.similaritySearchWithScore(question, 4);
  const retrievedDocs = recalledDocs
    .map(([doc, score]) => ({
      doc,
      score,
      lexical: lexicalScore(question, doc),
    }))
    .sort((left, right) => {
      if (right.lexical !== left.lexical) {
        return right.lexical - left.lexical;
      }

      return left.score - right.score;
    })
    .slice(0, 2)
    .map((item) => item.doc);
  const context = formatContext(retrievedDocs);

  const prompt = [
    "你是一个基于检索上下文回答问题的助手。",
    "请严格根据给定上下文回答问题，不要编造信息。",
    "如果问题是在问“谁”，优先回答对应学生的姓名。",
    "请直接给出简洁答案，不要补充多余解释，不要输出“答案：”前缀。",
    "如果上下文中没有答案，请直接回答：我在检索到的文档中没有找到答案。",
    "",
    "上下文：",
    context,
    "",
    `问题：${question}`,
    "答案：",
  ].join("\n");

  const response = await llm.invoke(prompt);

  return {
    answer: sanitizeOllamaOutput(response.content).trim(),
    retrievedDocs,
  };
}

async function main() {
  const docs = await loadDocuments();
  const chunks = await splitDocuments(docs);
  const vectorStore = await buildVectorStore(chunks);

  console.log("=== 完整 RAG 流程 ===");
  console.log(`CSV 文件: ${csvPath}`);
  console.log(`原始文档数量: ${docs.length}`);
  console.log(`分块数量: ${chunks.length}`);
  console.log(`Embedding 模型: ${embeddingModel}`);
  console.log(`Chat 模型: ${getOllamaModelName()}`);
  console.log("");

  const questions = [
    "谁正在学习 RAG？",
    "谁对向量数据库和文本检索很感兴趣？",
  ];

  for (const question of questions) {
    const { answer, retrievedDocs } = await answerQuestion(vectorStore, question);

    console.log(`=== 问题 ===`);
    console.log(question);
    console.log("");

    console.log("=== 检索到的上下文 ===");
    console.log(formatContext(retrievedDocs));
    console.log("");

    console.log("=== 最终答案 ===");
    console.log(answer);
    console.log("");

    console.log("=== 来源 ===");
    console.log(formatSources(retrievedDocs));
    console.log("");
    console.log("-".repeat(60));
  }
}

main().catch(console.error);
