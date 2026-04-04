/**
 * Lite 프로필 도구 통합 등록
 *
 * 7개 도구를 등록합니다:
 * - search_members (의원 검색+상세)
 * - search_bills (의안 검색+상세+상태필터)
 * - search_records (일정+회의록+표결)
 * - analyze_legislator (의원 종합분석 체인)
 * - track_legislation (주제별 법안 추적 체인)
 * - discover_apis (276개 API 탐색, 기존 재사용)
 * - query_assembly (범용 API 호출, 기존 재사용)
 */

import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppConfig } from "../../config.js";
import { registerLiteMemberTools } from "./members.js";
import { registerLiteBillTools } from "./bills.js";
import { registerLiteRecordTools } from "./records.js";
import { registerLiteChainTools } from "./chains.js";
import { registerDiscoverTools } from "../discover.js";
import { registerQueryTools } from "../query.js";

export function registerLiteTools(
  server: McpServer,
  config: AppConfig,
): void {
  // Lite 전용 도구 (5개)
  registerLiteMemberTools(server, config);
  registerLiteBillTools(server, config);
  registerLiteRecordTools(server, config);
  registerLiteChainTools(server, config);

  // 범용 도구 (2개, 기존 재사용)
  registerDiscoverTools(server, config);
  registerQueryTools(server, config);
}
