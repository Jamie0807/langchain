import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 定义工具
export const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "计算两个数的和",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

// 定义工具
export const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "计算两个数的积",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

// 定义工具
export const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "计算两个数相除的结果",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

export const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};

export const tools = Object.values(toolsByName);
