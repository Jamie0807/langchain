/**
 * 示例 25 - MCP Client
 * 学习目标：使用 MultiServerMCPClient 连接 MCP Server，并把 MCP 工具交给 LangChain Agent 调用
 * 运行：npm run 25:mcp-client
 */
import "dotenv/config";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";
import {
  createOllamaChatModel,
  sanitizeOllamaOutput,
} from "../lib/ollama";

const WEATHER_PORT = 8000;

function getMathServerPath() {
  return path.resolve(process.cwd(), "src/24_mcp_stdio/index.ts");
}

function getWeatherServerPath() {
  return path.resolve(process.cwd(), "src/26_mcp_weather_http/index.ts");
}

async function waitForServer(url: string, timeoutMs = 10_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`等待服务启动超时: ${url}`);
}

// 启动天气服务进程
function startWeatherServer() {
  const weatherServerPath = getWeatherServerPath();
  const child = spawn("npx", ["tsx", weatherServerPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      MCP_WEATHER_PORT: String(WEATHER_PORT),
    },
    stdio: "inherit",
  });

  return child;
}

function stopChildProcess(child: ChildProcess | undefined) {
  if (!child || child.killed) {
    return;
  }

  child.kill("SIGINT");
}

async function main() {
  const mathServerPath = getMathServerPath();
  const weatherServerPath = getWeatherServerPath();
  const weatherServerProcess = startWeatherServer();
  await waitForServer(`http://127.0.0.1:${WEATHER_PORT}/health`);

  // 创建 MCP 客户端
  const client = new MultiServerMCPClient({
    math: {
      transport: "stdio", //通过子进程方式通信 ，与 math-server 通信
      command: "npx",
      args: ["tsx", mathServerPath],
      cwd: process.cwd(),
      stderr: "inherit",
    },
    weather: {
      transport: "http",
      url: `http://127.0.0.1:${WEATHER_PORT}/mcp`,
    },
  });

  try {
    // 初始化连接
    await client.initializeConnections();

    const tools = await client.getTools();
    console.log("=== MCP Client 已连接 ===");
    console.log(`math server: ${mathServerPath}`);
    console.log(`weather server: ${weatherServerPath}`);
    console.log(`已加载工具数量: ${tools.length}`);
    console.log(`工具列表: ${tools.map((tool) => tool.name).join(", ")}`);
    console.log("");

    const agent = createAgent({
      model: createOllamaChatModel({
        temperature: 0,
        think: false,
      }),
      tools,
      systemPrompt:
        "你是一个助手。涉及数学计算时，必须优先调用数学工具；涉及天气查询时，必须优先调用天气工具；不要凭空猜测。",
    });

    // 调用数学工具
    const mathResponse = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "计算 (3 + 5) x 12 等于多少？请直接给出结果。",
        },
      ],
    });
    console.log("=== Math Response ===");
    console.log(sanitizeOllamaOutput(mathResponse.messages.at(-1)?.content ?? ""));
    console.log("");

    // 调用天气工具
    const weatherResponse = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "我的城市是北京，请获取天气。",
        },
      ],
    });
    console.log("=== Weather Response ===");
    console.log(
      sanitizeOllamaOutput(weatherResponse.messages.at(-1)?.content ?? "")
    );

  } finally {
    await client.close();
    stopChildProcess(weatherServerProcess);
  }
}

main().catch((error) => {
  console.error("MCP client failed:", error);
  process.exit(1);
});
