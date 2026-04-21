/**
 * 示例 03 - 结构化输出
 * 学习目标：让模型返回 JSON 结构，使用 JsonOutputParser 解析
 * 运行：npm run 03:structured
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
  });

  const jsonParser = new JsonOutputParser();

  // -------- 示例1：提取简历信息 --------
  console.log("=== 示例1：结构化提取简历信息 ===");

  const resumePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `你是一个 HR 助手，从简历文本中提取结构化信息。
只输出如下格式的纯 JSON，不要有任何说明文字：
{{
  "name": "姓名",
  "years_of_experience": 工作年限数字,
  "skills": ["技能1", "技能2"],
  "summary": "一句话简介"
}}`,
    ],
    ["human", "简历内容：{resume}"],
  ]);

  const resumeChain = resumePrompt.pipe(model).pipe(jsonParser);

  const resumeText = `
    张三，前端工程师，有 5 年工作经验。
    熟练掌握 React、Vue、TypeScript、Node.js。
    曾就职于阿里巴巴，负责中台系统建设。
  `;

  const parsed = await resumeChain.invoke({ resume: resumeText });
  console.log("提取结果:", JSON.stringify(parsed, null, 2));

  // -------- 示例2：情感分析 --------
  console.log("\n=== 示例2：文章情感分析 ===");

  const sentimentPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `你是情感分析助手，分析用户评论的情感。
只输出如下格式的纯 JSON，不要有任何说明文字：
{{
  "sentiment": "正面 或 负面 或 中性",
  "score": 0到10的整数,
  "keywords": ["关键词1", "关键词2"],
  "reason": "判断理由"
}}`,
    ],
    ["human", "评论：{review}"],
  ]);

  const sentimentChain = sentimentPrompt.pipe(model).pipe(jsonParser);

  const reviews = [
    "这个产品真的太棒了！用了之后效率提升了好几倍，强烈推荐！",
    "一般吧，没什么特别的，凑合能用。",
    "完全是浪费钱，质量太差，客服态度也很差，非常失望！",
  ];

  for (const review of reviews) {
    const result = await sentimentChain.invoke({ review });
    console.log(`\n评论: "${review.substring(0, 20)}..."`);
    console.log(`情感: ${result.sentiment} (${result.score}分)`);
    console.log(`关键词: ${result.keywords.join(", ")}`);
    console.log(`理由: ${result.reason}`);
  }
}

main().catch(console.error);
