/**
 * 범용 국회 API 호출 도구
 *
 * - query_assembly: API 코드와 파라미터를 지정하여 어떤 국회 데이터든 조회
 */

import { z } from "zod";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppConfig } from "../config.js";
import { createApiClient } from "../api/client.js";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerQueryTools(
  server: McpServer,
  config: AppConfig,
): void {
  const api = createApiClient(config);

  server.tool(
    "query_assembly",
    "국회 API를 직접 호출합니다. API 코드와 파라미터를 지정하여 어떤 국회 데이터든 조회할 수 있습니다. API 코드는 discover_apis나 docs/discovered-codes.md에서 확인할 수 있습니다.",
    {
      api_code: z
        .string()
        .describe(
          "API 코드 (예: ALLSCHEDULE, nwvrqwxyaytdsfvhu, BILLRCP)",
        ),
      params: z
        .record(z.string(), z.union([z.string(), z.number()]))
        .optional()
        .describe("API 파라미터 (예: {AGE: 22, BILL_NAME: '교육'})"),
      page: z.number().optional().describe("페이지 번호 (기본: 1)"),
      page_size: z
        .number()
        .optional()
        .describe("페이지 크기 (기본: 20)"),
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {
          ...(params.params ?? {}),
        };

        if (params.page !== undefined) {
          queryParams.pIndex = params.page;
        }
        if (params.page_size !== undefined) {
          queryParams.pSize = Math.min(
            params.page_size,
            config.apiResponse.maxPageSize,
          );
        }

        const result = await api.fetchOpenAssembly(
          params.api_code,
          queryParams,
        );

        // Return raw rows with field names for maximum flexibility
        const fieldNames =
          result.rows.length > 0
            ? Object.keys(result.rows[0])
            : [];

        const summary = [
          `API: ${params.api_code}`,
          `총 건수: ${result.totalCount}`,
          `반환 건수: ${result.rows.length}`,
          `필드: ${fieldNames.join(", ")}`,
        ].join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `${summary}\n\n${JSON.stringify(result.rows, null, 2)}`,
            },
          ],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        const helpText =
          message.includes("오류") || message.includes("ERROR")
            ? "\n\n💡 API 코드가 올바른지 확인하세요. " +
              "discover_apis 도구로 사용 가능한 API를 검색하거나, " +
              "src/api/codes.ts에 정의된 검증된 코드를 사용해 보세요."
            : "";

        return {
          content: [
            {
              type: "text" as const,
              text: `오류: ${message}${helpText}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
