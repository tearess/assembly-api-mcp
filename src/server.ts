/**
 * MCP 서버 초기화 및 도구 등록
 *
 * McpServer 인스턴스를 생성하고, 모든 국회 API 도구를 등록합니다.
 * config.server.transport 설정에 따라 stdio 또는 HTTP 전송을 사용합니다.
 */

import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { type AppConfig } from "./config.js";
import { registerLiteTools } from "./tools/lite/index.js";
import { registerMemberTools } from "./tools/members.js";
import { registerBillTools } from "./tools/bills.js";
import { registerScheduleTools } from "./tools/schedule.js";
import { registerMeetingTools } from "./tools/meetings.js";
import { registerCommitteeTools } from "./tools/committees.js";
import { registerVoteTools } from "./tools/votes.js";
import { registerPetitionTools } from "./tools/petitions.js";
import { registerLegislationTools } from "./tools/legislation.js";
import { registerLibraryTools } from "./tools/library.js";
import { registerBudgetTools } from "./tools/budget.js";
import { registerResearchTools } from "./tools/research.js";
import { registerSpeechTools } from "./tools/speeches.js";
import { registerBillExtraTools } from "./tools/bill-extras.js";
import { registerDiscoverTools } from "./tools/discover.js";
import { registerQueryTools } from "./tools/query.js";
import { registerResources } from "./resources/static-data.js";
import { registerPrompts } from "./prompts/templates.js";

// ---------------------------------------------------------------------------
// MCP Server factory (transport-agnostic)
// ---------------------------------------------------------------------------

function buildMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: "assembly-api-mcp",
    version: "0.2.0",
  });

  // 도구 등록 — 프로필에 따라 분기
  if (config.profile === "full") {
    // Full 프로필: 기존 23개 도구 전부
    registerMemberTools(server, config);
    registerBillTools(server, config);
    registerScheduleTools(server, config);
    registerMeetingTools(server, config);
    registerCommitteeTools(server, config);
    registerVoteTools(server, config);
    registerPetitionTools(server, config);
    registerLegislationTools(server, config);
    registerLibraryTools(server, config);
    registerBudgetTools(server, config);
    registerResearchTools(server, config);
    registerSpeechTools(server, config);
    registerBillExtraTools(server, config);
    registerDiscoverTools(server, config);
    registerQueryTools(server, config);
  } else {
    // Lite 프로필 (기본): 7개 도구
    registerLiteTools(server, config);
  }

  // 리소스 등록
  registerResources(server, config);

  // 프롬프트 등록
  registerPrompts(server);

  return server;
}

// ---------------------------------------------------------------------------
// Stdio transport
// ---------------------------------------------------------------------------

async function startStdioTransport(config: AppConfig): Promise<McpServer> {
  const server = buildMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

// ---------------------------------------------------------------------------
// Streamable HTTP transport
// ---------------------------------------------------------------------------

const MCP_ENDPOINT = "/mcp";

async function startHttpTransport(config: AppConfig): Promise<McpServer> {
  const server = buildMcpServer(config);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const httpServer = createHttpServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "/";

      // Health-check endpoint
      if (url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // MCP endpoint — delegate to StreamableHTTPServerTransport
      if (url === MCP_ENDPOINT) {
        transport.handleRequest(req, res);
        return;
      }

      // Everything else → 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    },
  );

  const { port } = config.server;

  await new Promise<void>((resolve, reject) => {
    httpServer.on("error", reject);
    httpServer.listen(port, () => {
      process.stderr.write(
        `[assembly-api-mcp] HTTP 서버가 포트 ${String(port)}에서 시작되었습니다. (엔드포인트: ${MCP_ENDPOINT})\n`,
      );
      resolve();
    });
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    process.stderr.write("[assembly-api-mcp] 서버를 종료합니다...\n");
    await transport.close();
    httpServer.close();
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });

  return server;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function createServer(config: AppConfig): Promise<McpServer> {
  if (config.server.transport === "http") {
    return startHttpTransport(config);
  }
  return startStdioTransport(config);
}
