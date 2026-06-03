/**
 * 示例 24 - MCP Stdio Math Server
 * 学习目标：使用 MCP SDK 基于 stdio 传输实现一个最小可运行的工具服务
 * 运行：npm run 24:mcp-stdio
 *
 * 说明：
 * - 这个服务会通过 stdin / stdout 与 MCP Client 通信
 * - 由于 stdout 要用于协议消息，运行日志请写到 stderr
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 创建服务器
const server = new Server(
  {
    name: "math-server",
    version: "0.1.0",
  },
  // 配置服务器能力
  {
    capabilities: {
      tools: {},
    },
  }
);

// 处理列出工具请求 setRequestHandler 方法
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add",
        description: "求两个数的和",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "第一个数",
            },
            b: {
              type: "number",
              description: "第二个数",
            },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "multiply",
        description: "求两个数的积",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "第一个数",
            },
            b: {
              type: "number",
              description: "第二个数",
            },
          },
          required: ["a", "b"],
        },
      },
    ],
  };
});

// 处理工具调用
function getNumberArgs(args: Record<string, unknown> | undefined) {
  const a = args?.a;
  const b = args?.b;

  if (typeof a !== "number" || typeof b !== "number") {
    throw new Error("工具参数 a 和 b 必须都是 number");
  }

  return { a, b };
}

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "add": {
      const { a, b } = getNumberArgs(request.params.arguments);

      return {
        content: [
          {
            type: "text",
            text: String(a + b),
          },
        ],
      };
    }

    case "multiply": {
      const { a, b } = getNumberArgs(request.params.arguments);

      return {
        content: [
          {
            type: "text",
            text: String(a * b),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

async function main() {
  // 创建传输层
  const transport = new StdioServerTransport();
  // 连接传输层
  await server.connect(transport);

  // stdout 用于 MCP 协议，启动日志写到 stderr 更安全。
  console.error("Math MCP server running over stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
