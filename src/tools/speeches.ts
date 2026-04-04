/**
 * 의원 발언/의정활동 도구
 *
 * - search_member_activity: 의원별 의정활동 검색 (발의 법안 + 본회의 표결)
 *
 * 참고: 회의록 기반 발언 검색 API 코드가 아직 확인되지 않아,
 * 검증된 API(발의법률안 + 본회의 표결)를 조합하여 의원별 활동을 제공합니다.
 */

import { z } from "zod";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppConfig } from "../config.js";
import { createApiClient } from "../api/client.js";
import { API_CODES, CURRENT_AGE } from "../api/codes.js";

export function registerSpeechTools(
  server: McpServer,
  config: AppConfig,
): void {
  const api = createApiClient(config);

  server.tool(
    "search_member_activity",
    "국회의원의 의정활동을 검색합니다. 발의 법안 목록과 본회의 표결 참여 정보를 조합하여 반환합니다.",
    {
      name: z.string().describe("의원 이름 (정확한 이름)"),
      age: z.number().optional().describe("대수 (기본: 22 = 제22대 국회)"),
      activity_type: z
        .enum(["all", "bills", "votes"])
        .optional()
        .describe("활동 유형 (all=전체, bills=발의법안, votes=표결참여, 기본: all)"),
      page_size: z.number().optional().describe("페이지 크기 (기본: 10)"),
    },
    async (params) => {
      try {
        const age = params.age ?? CURRENT_AGE;
        const activityType = params.activity_type ?? "all";
        const pageSize = Math.min(params.page_size ?? 10, config.apiResponse.maxPageSize);
        const sections: string[] = [];

        // 의원 기본 정보
        const memberResult = await api.fetchOpenAssembly(API_CODES.MEMBER_INFO, {
          HG_NM: params.name,
          pSize: 1,
        });

        if (memberResult.rows.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `"${params.name}" 의원을 찾을 수 없습니다.`,
            }],
          };
        }

        const member = memberResult.rows[0]!;
        sections.push(
          `■ ${member.HG_NM} 의원 (${member.POLY_NM}, ${member.ORIG_NM})`,
          `  당선: ${member.REELE_GBN_NM} | 소속위원회: ${member.CMITS}`,
          "",
        );

        // 발의 법안 + 본회의 표결을 병렬 조회 (Promise.all)
        const wantBills = activityType === "all" || activityType === "bills";
        const wantVotes = activityType === "all" || activityType === "votes";

        const [billResult, voteResult] = await Promise.all([
          wantBills
            ? api.fetchOpenAssembly(API_CODES.MEMBER_BILLS, { AGE: age, PROPOSER: params.name, pSize: pageSize })
            : Promise.resolve(null),
          wantVotes
            ? api.fetchOpenAssembly(API_CODES.VOTE_PLENARY, { AGE: age, pSize: pageSize })
            : Promise.resolve(null),
        ]);

        if (billResult) {
          sections.push(`■ 발의 법안 (총 ${billResult.totalCount}건)`);
          if (billResult.rows.length > 0) {
            for (const row of billResult.rows) {
              const status = row.PROC_RESULT ?? "계류";
              sections.push(`  - [${row.BILL_NO}] ${row.BILL_NAME} (${status})`);
            }
          } else {
            sections.push("  (발의 법안 없음)");
          }
          sections.push("");
        }

        if (voteResult) {
          sections.push(`■ 본회의 표결 현황 (제${age}대, 총 ${voteResult.totalCount}건)`);
          if (voteResult.rows.length > 0) {
            for (const row of voteResult.rows) {
              sections.push(`  - [${row.BILL_NO}] ${row.BILL_NM} (${row.PROC_RESULT_CD ?? row.BILL_KIND})`);
            }
          } else {
            sections.push("  (표결 정보 없음)");
          }
          sections.push("");
        }

        return {
          content: [{
            type: "text" as const,
            text: sections.join("\n"),
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
