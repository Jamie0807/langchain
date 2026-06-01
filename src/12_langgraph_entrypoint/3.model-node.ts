import {
  AIMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { modelWithTools } from "./2.model";

// 调用模型
export async function callLlm(messages: BaseMessage[]) {
  const response = await modelWithTools.invoke([
    new SystemMessage(
      "你是一个计算助手。凡是涉及加减乘除，都必须调用工具，不能心算，也不能跳步。每次回复最多只能调用一个工具，必须等拿到上一步工具结果后，才能决定下一步。所有中间步骤都要通过工具完成，最后再给出简洁答案。"
    ),
    ...messages,
  ]);

  return response as AIMessage;
}
