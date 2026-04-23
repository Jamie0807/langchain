/**
 * 示例 02 - Prompt 模板
 * 学习目标：使用 PromptTemplate 构建可复用的提示词，理解 LCEL 管道语法
 * 运行：npm run 02:prompt
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });

  // -------- 基础 Prompt 模板 --------
  console.log("=== 基础 Prompt 模板 ===");

  // ChatPromptTemplate：创建“带变量占位符”的聊天提示词模板
  // 这里的 {language}、{text} 会在 invoke({ ... }) 时被替换为真实值
  // 可以理解为：先定义固定话术，再在运行时填空（变量注入）
  const translatePrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个专业翻译，将用户输入翻译成{language}，只输出翻译结果"],
    ["human", "{text}"],
  ]);

  // LCEL 管道：prompt → model → 解析器
  // StringOutputParser：把模型返回的 AIMessage 解析成纯字符串（等价于取 .content）
  const translateChain = translatePrompt.pipe(model).pipe(new StringOutputParser());

  const r1 = await translateChain.invoke({ 
    language: "英文",
    text: "今天天气真不错"
});
  console.log("中→英:", r1);

  const r2 = await translateChain.invoke({ 
    language: "日文", 
    text: "我喜欢编程" 
  });
  console.log("中→日:", r2);

  // -------- 多轮对话模板 --------
  console.log("\n=== 带历史记录的对话 ===");

  // ChatPromptTemplate 也适合做可复用“角色化”模板：
  // 通过 {role}、{style}、{question} 组合出不同场景的提示词
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个 {role}，风格：{style}"],
    ["human", "{question}"],
  ]);

  // 这里同样使用 StringOutputParser，保证 chatChain.invoke() 直接得到 string
  const chatChain = chatPrompt.pipe(model).pipe(new StringOutputParser());

  const answer = await chatChain.invoke({
    role: "资深 TypeScript 讲师",
    style: "简洁、举例丰富",
    question: "interface 和 type 的核心区别是什么？",
  });
  console.log(answer);

  // -------- 批量调用（parallel）--------
  console.log("\n=== 批量调用 ===");

  const subjects = ["React", "Vue", "Angular"];
  // batch() 是 LangChain Runnable 的批量调用 API（不是 JS 语法）
  // 作用：一次传入多条输入并并发执行，返回结果数组（顺序与输入一致）
  const batchResults = await chatChain.batch(
    subjects.map((s) => ({
      role: "前端工程师",
      style: "一句话总结",
      question: `${s} 最大的优点是什么？`,
    }))
  );

  subjects.forEach((s, i) => {
    console.log(`${s}: ${batchResults[i]}`);
  });
}

main().catch(console.error);
