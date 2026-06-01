/**
 * 示例 18 - CSV Loader
 * 学习目标：使用 CSVLoader 读取 CSV 文档，为后续 RAG 文档切分和向量化做准备
 * 运行：npm run 18:csv-loader
 */
import "dotenv/config";
import path from "node:path";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

const csvPath = path.resolve(process.cwd(), "rag-document/student.csv");

async function loadDocument() {
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();

  console.log("=== CSVLoader 结果 ===");
  console.log(`文件路径: ${csvPath}`);
  console.log(`文档数量: ${docs.length}`);
  console.log("");

  docs.forEach((doc, index) => {
    console.log(`--- Document ${index + 1} ---`);
    console.log("pageContent:");
    console.log(doc.pageContent);
    console.log("metadata:");
    console.log(doc.metadata);
    console.log("");
  });

  if (docs[0]) {
    console.log("=== Document 结构说明 ===");
    console.log("pageContent:", docs[0].pageContent);
    console.log("metadata:", docs[0].metadata);
  }

  return docs;
}

loadDocument().catch(console.error);
