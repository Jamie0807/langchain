/**
 * 示例 03 - 结构化输出
 * 学习目标：使用 Zod 定义结构化输出 schema，让模型直接返回类型安全的对象
 * 运行：npm run 03:structured
 */
import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { createOllamaChatModel, getOllamaModelName } from "../lib/ollama";

const resumeSchema = z.object({
  name: z.string().describe("候选人姓名"),
  years_of_experience: z.number().describe("工作年限，返回数字"),
  skills: z.array(z.string()).describe("技能列表"),
  summary: z.string().describe("一句话简介"),
});

const sentimentSchema = z.object({
  sentiment: z.enum(["正面", "负面", "中性"]).describe("评论情感倾向"),
  score: z.number().int().min(0).max(10).describe("0 到 10 的情感分数"),
  keywords: z.array(z.string()).describe("评论关键词"),
  reason: z.string().describe("判断理由"),
});

async function main() {
  const modelName = "qwen3-vl:2b";
  const model = createOllamaChatModel({
    model: modelName,
    temperature: 0,
    think: false,
  });
  console.log(`当前模型: ${modelName}`);

  // -------- 示例1：结构化提取简历信息 --------

  const resumePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是一个 HR 助手，从简历文本中提取结构化信息，并严格按给定 schema 返回结果。",
    ],
    ["human", "简历内容：{resume}"],
  ]);

  const resumeChain = resumePrompt.pipe(
    model.withStructuredOutput(resumeSchema, { method: "functionCalling" })
  );

  const resumeText = `
    张三，前端工程师，有 5 年工作经验。
    熟练掌握 React、Vue、TypeScript、Node.js。
    曾就职于阿里巴巴，负责中台系统建设。
  `;

  const parsed = await resumeChain.invoke({ resume: resumeText });
  console.log("提取结果:", JSON.stringify(parsed, null, 2));

  // -------- 示例2：结构化提取情感分析 --------

  // const sentimentPrompt = ChatPromptTemplate.fromMessages([
  //   [
  //     "system",
  //     "你是情感分析助手，分析用户评论情感，并严格按给定 schema 返回结果。",
  //   ],
  //   ["human", "评论：{review}"],
  // ]);

  // const sentimentChain = sentimentPrompt.pipe(
  //   model.withStructuredOutput(sentimentSchema)
  // );

  // const reviews = [
  //   "这个产品真的太棒了！用了之后效率提升了好几倍，强烈推荐！",
  //   "一般吧，没什么特别的，凑合能用。",
  //   "完全是浪费钱，质量太差，客服态度也很差，非常失望！",
  // ];

  // for (const review of reviews) {
  //   const result = await sentimentChain.invoke({ review });
  //   console.log(`\n评论: "${review.substring(0, 20)}..."`);
  //   console.log(`情感: ${result.sentiment} (${result.score}分)`);
  //   console.log(`关键词: ${result.keywords.join(", ")}`);
  //   console.log(`理由: ${result.reason}`);
  // }
}

main().catch(console.error);
