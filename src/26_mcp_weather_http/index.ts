/**
 * 示例 26 - MCP Weather HTTP Server
 * 学习目标：使用高阶 McpServer + Streamable HTTP 传输实现远程天气服务
 * 运行：npm run 26:mcp-weather-http
 */
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";

const PORT = Number(process.env.MCP_WEATHER_PORT ?? "8000");

// 创建天气 MCP 服务器
function createWeatherMcpServer() {
  // 创建服务器
  const server = new McpServer({
    name: "weather-server",
    version: "1.0.0",
  });

  // 注册天气工具
  server.registerTool(
    "fetch-weather",
    {
      description: "获取城市的天气",
      inputSchema: {
        city: z.string().describe("城市名"),
      },
      outputSchema: {
        temperature: z.number(),
        conditions: z.string(),
      },
    },
    async ({ city }) => {
      const temperature = 25;
      const conditions = "晴朗";

      return {
        content: [
          {
            type: "text",
            text: `${city}的天气还不错，温度${temperature}度，${conditions}`,
          },
        ],
        structuredContent: {
          temperature,
          conditions,
        },
      };
    }
  );

  return server;
}

export async function main() {
  const app = express();
  app.use(express.json());

  const transports = {
    streamable: {} as Record<string, StreamableHTTPServerTransport>,
    sse: {} as Record<string, SSEServerTransport>,
  };

  const servers = {
    streamable: {} as Record<string, McpServer>,
    sse: {} as Record<string, McpServer>,
  };

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    try {
      if (sessionId && transports.streamable[sessionId]) {
        transport = transports.streamable[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        const server = createWeatherMcpServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (initializedSessionId) => {
            transports.streamable[initializedSessionId] = transport;
            servers.streamable[initializedSessionId] = server;
          },
        });

        transport.onclose = () => {
          const currentSessionId = transport.sessionId;
          if (currentSessionId) {
            delete transports.streamable[currentSessionId];
            delete servers.streamable[currentSessionId];
          }
        };

        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Weather MCP server error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/sse", async (_req: Request, res: Response) => {
    try {
      const server = createWeatherMcpServer();
      const transport = new SSEServerTransport("/messages", res);

      transports.sse[transport.sessionId] = transport;
      servers.sse[transport.sessionId] = server;

      res.on("close", () => {
        delete transports.sse[transport.sessionId];
        delete servers.sse[transport.sessionId];
      });

      await server.connect(transport);
    } catch (error) {
      console.error("Weather MCP SSE server error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId;
    const transport =
      typeof sessionId === "string" ? transports.sse[sessionId] : undefined;

    if (!transport) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "No transport found for sessionId",
        },
        id: null,
      });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error("Weather MCP /messages error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.listen(PORT, "127.0.0.1", () => {
    console.error(`Weather MCP server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start weather MCP server:", error);
  process.exit(1);
});
