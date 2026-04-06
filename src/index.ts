#!/usr/bin/env node
/**
 * 국회 API MCP 서버 진입점
 *
 * StdioServerTransport를 통해 MCP 클라이언트(Claude Desktop, VS Code 등)와 통신합니다.
 * 환경 변수 로드 → 설정 검증 → MCP 서버 시작 순으로 초기화됩니다.
 */

import "dotenv/config";
import { createServer } from "./server.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  // setup 명령 감지: npx assembly-api-mcp setup
  const command = process.argv[2];
  if (command === "setup") {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    return;
  }

  let config;
  try {
    config = loadConfig();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[assembly-api-mcp] 설정 오류: ${message}\n`);
    process.exit(1);
  }

  try {
    await createServer(config);
    process.stderr.write("[assembly-api-mcp] MCP 서버가 시작되었습니다.\n");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[assembly-api-mcp] 서버 시작 실패: ${message}\n`);
    process.exit(1);
  }
}

main();
