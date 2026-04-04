/**
 * 국회 일정 도구
 *
 * - get_schedule: 본회의/위원회 일정 조회
 */

import { z } from "zod";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppConfig } from "../config.js";
import { createApiClient } from "../api/client.js";
import { API_CODES } from "../api/codes.js";

export function registerScheduleTools(
  server: McpServer,
  config: AppConfig,
): void {
  const api = createApiClient(config);

  server.tool(
    "get_schedule",
    "국회 일정을 조회합니다. 본회의, 위원회, 소위원회 일정을 날짜별/위원회별로 검색할 수 있습니다.",
    {
      date_from: z.string().optional().describe("시작 날짜 (YYYY-MM-DD 형식)"),
      date_to: z.string().optional().describe("종료 날짜 (YYYY-MM-DD 형식)"),
      committee: z.string().optional().describe("위원회명"),
      meeting_type: z
        .enum(["본회의", "전체회의", "소위원회", "공청회", "청문회"])
        .optional()
        .describe("회의 종류"),
      page: z.number().optional().describe("페이지 번호 (기본: 1)"),
      page_size: z.number().optional().describe("페이지 크기 (기본: 20, 최대: 100)"),
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {};
        if (params.date_from) queryParams.SCH_DT = params.date_from.replace(/-/g, "");
        if (params.committee) queryParams.CMIT_NM = params.committee;
        if (params.page) queryParams.pIndex = params.page;
        if (params.page_size) queryParams.pSize = Math.min(params.page_size, config.apiResponse.maxPageSize);

        // 통합 일정 API 사용 (90,201건, 모든 일정 포함)
        const apiCode = API_CODES.SCHEDULE_ALL;

        const result = await api.fetchOpenAssembly(apiCode, queryParams);

        const formatted = result.rows.map((row) => ({
          일정종류: row.SCH_KIND,
          일자: row.SCH_DT,
          시간: row.SCH_TM,
          위원회: row.CMIT_NM,
          내용: row.SCH_CN,
          장소: row.EV_PLC,
          회기: row.CONF_SESS,
          차수: row.CONF_DGR,
        }));

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ total: result.totalCount, items: formatted }),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const code = message.includes('API_KEY') ? 'AUTH_ERROR'
          : message.includes('rate') ? 'RATE_LIMIT'
          : message.includes('timeout') ? 'TIMEOUT'
          : 'UNKNOWN';
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: message, code }) }],
          isError: true,
        };
      }
    },
  );
}
