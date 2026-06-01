/**
 * 示例 19 - Text Splitter
 * 学习目标：使用 RecursiveCharacterTextSplitter 对加载后的文档进行文本分割
 * 运行：npm run 19:text-splitter
 */
import "dotenv/config";
import path from "node:path";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import type { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const csvPath = path.resolve(process.cwd(), "rag-document/student.csv");

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 40,
  chunkOverlap: 10,
});

async function splitText() {
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();
  const chunks = await splitter.splitDocuments(docs);

  console.log("=== Text Splitter 结果 ===");
  console.log(`文件路径: ${csvPath}`);
  console.log(`原始文档数量: ${docs.length}`);
  console.log(`分块数量: ${chunks.length}`);
  console.log(`chunkSize: 40`);
  console.log(`chunkOverlap: 10`);
  console.log("");

  chunks.forEach((chunk: Document, index: number) => {
    console.log(`--- Chunk ${index + 1} ---`);
    console.log("pageContent:");
    console.log(chunk.pageContent);
    console.log("metadata:");
    console.log(chunk.metadata);
    console.log("");
  });

  return chunks;
}

splitText().catch(console.error);
