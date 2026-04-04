/**
 * 국회도서관 자료 검색 도구
 *
 * - search_library: 국회도서관 자료 검색
 */

import { z } from "zod";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppConfig } from "../config.js";
import { createApiClient } from "../api/client.js";

export function registerLibraryTools(
  server: McpServer,
  config: AppConfig,
): void {
  const api = createApiClient(config);

  server.tool(
    "search_library",
    "국회도서관 자료를 검색합니다. 키워드로 도서, 논문, 간행물 등을 검색할 수 있습니다.",
    {
      keyword: z.string().describe("검색 키워드 (필수)"),
      type: z.string().optional().describe("자료 유형 (예: 도서, 논문, 간행물)"),
      page: z.number().optional().describe("페이지 번호 (기본: 1)"),
      page_size: z.number().optional().describe("페이지 크기 (기본: 20, 최대: 100)"),
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {
          KEYWORD: params.keyword,
        };
        if (params.type) queryParams.TYPE = params.type;
        if (params.page) queryParams.pIndex = params.page;
        if (params.page_size) queryParams.pSize = Math.min(params.page_size, config.apiResponse.maxPageSize);

        const result = await api.fetchOpenAssembly(
          "nywrpgoaatcpoqbiy",
          queryParams,
        );

        const formatted = result.rows.map((row) => ({
          제목: row.TITLE,
          저자: row.AUTHOR,
          출판사: row.PUBLISHER,
          발행연도: row.PUB_YEAR,
          링크: row.LINK_URL,
        }));

        return {
          content: [{
            type: "text" as const,
            text: `국회도서관 자료 검색 결과 (총 ${result.totalCount}건)\n\n${JSON.stringify(formatted, null, 2)}`,
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `오류: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
