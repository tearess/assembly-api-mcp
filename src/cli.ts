#!/usr/bin/env node
/**
 * 국회 API CLI — MCP 서버 없이 터미널에서 직접 국회 데이터를 조회합니다.
 *
 * 사용법:
 *   npx tsx src/cli.ts members                    # 전체 의원 목록
 *   npx tsx src/cli.ts members --name 이재명       # 이름으로 검색
 *   npx tsx src/cli.ts members --party 국민의힘     # 정당으로 검색
 *   npx tsx src/cli.ts bills                       # 의안 목록
 *   npx tsx src/cli.ts bills --name 교육            # 의안명 검색
 *   npx tsx src/cli.ts bill-detail <BILL_ID>       # 의안 상세
 *   npx tsx src/cli.ts votes                       # 표결 목록
 *   npx tsx src/cli.ts pending                     # 계류 의안
 *   npx tsx src/cli.ts processed                   # 처리 의안
 *   npx tsx src/cli.ts recent                      # 최근 본회의 처리
 *   npx tsx src/cli.ts plenary                     # 본회의부의안건
 *   npx tsx src/cli.ts meta                        # 전체 API 목록
 *   npx tsx src/cli.ts test                        # 전체 API 작동 테스트
 */

import "dotenv/config";
import { loadConfig, type AppConfig } from "./config.js";
import { createApiClient } from "./api/client.js";
import { API_CODES, CURRENT_AGE } from "./api/codes.js";

// config와 api는 실제 명령 실행 시에만 초기화 (--help 시 불필요)
let _config: AppConfig | undefined;
let _api: ReturnType<typeof createApiClient> | undefined;

function getConfig(): AppConfig {
  if (!_config) _config = loadConfig();
  return _config;
}

function getApi(): ReturnType<typeof createApiClient> {
  if (!_api) _api = createApiClient(getConfig());
  return _api;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(args: string[]): { command: string; flags: Record<string, string> } {
  const command = args[0] ?? "help";
  const flags: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i]?.startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      flags[args[i].slice(2)] = args[i + 1]!;
      i++;
    } else if (!args[i]?.startsWith("--")) {
      flags._positional = args[i]!;
    }
  }
  return { command, flags };
}

function printTable(rows: readonly Record<string, unknown>[], columns: string[]): void {
  if (rows.length === 0) {
    console.log("  (데이터 없음)");
    return;
  }

  // Column widths
  const widths: Record<string, number> = {};
  for (const col of columns) {
    widths[col] = col.length;
    for (const row of rows) {
      const val = String(row[col] ?? "");
      widths[col] = Math.max(widths[col]!, val.length > 40 ? 40 : val.length);
    }
  }

  // Header
  const header = columns.map((c) => c.padEnd(widths[c]!)).join(" | ");
  console.log(header);
  console.log(columns.map((c) => "-".repeat(widths[c]!)).join("-+-"));

  // Rows
  for (const row of rows) {
    const line = columns
      .map((c) => {
        const val = String(row[c] ?? "");
        return (val.length > 40 ? val.slice(0, 37) + "..." : val).padEnd(widths[c]!);
      })
      .join(" | ");
    console.log(line);
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdMembers(flags: Record<string, string>): Promise<void> {
  const params: Record<string, string | number> = {
    pSize: Number(flags.size ?? 20),
  };
  if (flags.name) params.HG_NM = flags.name;
  if (flags.party) params.POLY_NM = flags.party;
  if (flags.district) params.ORIG_NM = flags.district;

  const result = await getApi().fetchOpenAssembly(API_CODES.MEMBER_INFO, params);
  console.log(`\n국회의원 검색 결과 (총 ${result.totalCount}명)\n`);
  printTable(result.rows, ["HG_NM", "POLY_NM", "ORIG_NM", "REELE_GBN_NM", "CMITS", "TEL_NO"]);
}

async function cmdBills(flags: Record<string, string>): Promise<void> {
  const params: Record<string, string | number> = {
    AGE: Number(flags.age ?? CURRENT_AGE),
    pSize: Number(flags.size ?? 20),
  };
  if (flags.name) params.BILL_NAME = flags.name;
  if (flags.proposer) params.PROPOSER = flags.proposer;

  const result = await getApi().fetchOpenAssembly(API_CODES.MEMBER_BILLS, params);
  console.log(`\n의안 검색 결과 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "COMMITTEE", "PROPOSE_DT", "PROC_RESULT"]);
}

async function cmdBillDetail(flags: Record<string, string>): Promise<void> {
  const billId = flags._positional;
  if (!billId) {
    console.error("사용법: cli bill-detail <BILL_ID>");
    process.exit(1);
  }
  const result = await getApi().fetchOpenAssembly(API_CODES.BILL_DETAIL, { BILL_ID: billId });
  if (result.rows.length === 0) {
    console.log(`의안 ID "${billId}"를 찾을 수 없습니다.`);
    return;
  }
  console.log(`\n의안 상세정보\n`);
  for (const [k, v] of Object.entries(result.rows[0]!)) {
    console.log(`  ${k}: ${v}`);
  }
}

async function cmdVotes(flags: Record<string, string>): Promise<void> {
  const params: Record<string, string | number> = {
    AGE: Number(flags.age ?? CURRENT_AGE),
    pSize: Number(flags.size ?? 20),
  };
  const result = await getApi().fetchOpenAssembly(API_CODES.VOTE_BY_BILL, params);
  console.log(`\n의안별 표결 현황 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "PROC_DT", "CURR_COMMITTEE"]);
}

async function cmdPending(flags: Record<string, string>): Promise<void> {
  const result = await getApi().fetchOpenAssembly(API_CODES.BILL_PENDING, {
    pSize: Number(flags.size ?? 20),
  });
  console.log(`\n계류 의안 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "PROPOSER", "PROPOSER_KIND"]);
}

async function cmdProcessed(flags: Record<string, string>): Promise<void> {
  const result = await getApi().fetchOpenAssembly(API_CODES.BILL_PROCESSED, {
    AGE: Number(flags.age ?? CURRENT_AGE),
    pSize: Number(flags.size ?? 20),
  });
  console.log(`\n처리 의안 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "PROPOSER", "PROPOSER_KIND"]);
}

async function cmdRecent(flags: Record<string, string>): Promise<void> {
  const result = await getApi().fetchOpenAssembly("nxjuyqnxadtotdrbw", {
    AGE: Number(flags.age ?? CURRENT_AGE),
    pSize: Number(flags.size ?? 20),
  });
  console.log(`\n최근 본회의 처리 의안 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "PROPOSER", "PROPOSER_KIND"]);
}

async function cmdPlenary(flags: Record<string, string>): Promise<void> {
  const result = await getApi().fetchOpenAssembly(API_CODES.PLENARY_AGENDA, {
    pSize: Number(flags.size ?? 20),
  });
  console.log(`\n본회의 부의안건 (총 ${result.totalCount}건)\n`);
  printTable(result.rows, ["BILL_NO", "BILL_NAME", "CURR_COMMITTEE"]);
}

async function cmdActivity(flags: Record<string, string>): Promise<void> {
  const name = flags.name ?? flags._positional;
  if (!name) {
    console.error("사용법: cli activity --name <의원이름>");
    process.exit(1);
  }

  // 의원 기본정보
  const member = await getApi().fetchOpenAssembly(API_CODES.MEMBER_INFO, { HG_NM: name, pSize: 1 });
  if (member.rows.length === 0) {
    console.log(`"${name}" 의원을 찾을 수 없습니다.`);
    return;
  }
  const m = member.rows[0]!;
  console.log(`\n■ ${m.HG_NM} (${m.POLY_NM}, ${m.ORIG_NM})`);
  console.log(`  당선: ${m.REELE_GBN_NM} | 위원회: ${m.CMITS}\n`);

  // 발의 법안
  const bills = await getApi().fetchOpenAssembly(API_CODES.MEMBER_BILLS, {
    AGE: Number(flags.age ?? CURRENT_AGE),
    PROPOSER: name,
    pSize: Number(flags.size ?? 10),
  });
  console.log(`■ 발의 법안 (총 ${bills.totalCount}건)\n`);
  printTable(bills.rows, ["BILL_NO", "BILL_NAME", "COMMITTEE", "PROC_RESULT"]);
}

async function cmdMeta(): Promise<void> {
  const result = await getApi().fetchOpenAssembly(API_CODES.META_API_LIST, { pSize: 300 });
  console.log(`\n열린국회정보 전체 API 목록 (${result.totalCount}개)\n`);
  printTable(result.rows, ["INF_ID", "INF_NM", "CATE_NM", "ORG_NM"]);
}

async function cmdTest(): Promise<void> {
  console.log("\n=== 전체 API 작동 테스트 ===\n");

  const tests: [string, string, Record<string, string | number>][] = [
    [API_CODES.MEMBER_INFO, "의원 인적사항", {}],
    [API_CODES.MEMBER_BILLS, "의원 발의법률안", { AGE: CURRENT_AGE }],
    [API_CODES.BILL_SEARCH, "의안 통합검색", { AGE: CURRENT_AGE }],
    [API_CODES.BILL_RECEIVED, "의안 접수목록", {}],
    [API_CODES.BILL_REVIEW, "의안 심사정보", {}],
    [API_CODES.BILL_PENDING, "계류의안", {}],
    [API_CODES.BILL_PROCESSED, "처리의안", { AGE: CURRENT_AGE }],
    [API_CODES.PLENARY_AGENDA, "본회의부의안건", {}],
    [API_CODES.VOTE_BY_BILL, "의안별 표결", { AGE: CURRENT_AGE }],
    [API_CODES.VOTE_PLENARY, "본회의 표결", { AGE: CURRENT_AGE }],
    [API_CODES.META_API_LIST, "메타 API", {}],
  ];

  let ok = 0;
  for (const [code, name, params] of tests) {
    try {
      const r = await getApi().fetchOpenAssembly(code, { pSize: 1, ...params });
      const status = r.totalCount > 0 ? "✓" : "·";
      if (r.totalCount > 0) ok++;
      console.log(`${status} ${name.padEnd(18)} ${String(r.totalCount).padStart(8)}건`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`✗ ${name.padEnd(18)} ERR: ${msg.slice(0, 50)}`);
    }
  }
  console.log(`\n결과: ${ok}/${tests.length} API 정상 작동`);
}

function printHelp(): void {
  console.log(`
국회 API CLI — assembly-api-mcp

사용법:
  npx tsx src/cli.ts <command> [options]

명령어:
  members              국회의원 검색
    --name <이름>       의원 이름
    --party <정당>      정당명
    --district <선거구>  선거구

  bills                의안 검색
    --name <의안명>     의안명 검색
    --proposer <제안자>  제안자 이름
    --age <대수>        대수 (기본: 22)

  activity             의원 의정활동 검색
    --name <이름>       의원 이름 (필수)

  bill-detail <ID>     의안 상세 (BILL_ID 필요)
  votes                의안별 표결 현황
  pending              계류 의안
  processed            처리 의안
  recent               최근 본회의 처리
  plenary              본회의 부의안건
  meta                 전체 API 목록 (276개)
  test                 전체 API 작동 테스트

공통 옵션:
  --size <N>           결과 수 (기본: 20)
  --age <N>            대수 (기본: 22)
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "members":
        return cmdMembers(flags);
      case "bills":
        return cmdBills(flags);
      case "activity":
        return cmdActivity(flags);
      case "bill-detail":
        return cmdBillDetail(flags);
      case "votes":
        return cmdVotes(flags);
      case "pending":
        return cmdPending(flags);
      case "processed":
        return cmdProcessed(flags);
      case "recent":
        return cmdRecent(flags);
      case "plenary":
        return cmdPlenary(flags);
      case "meta":
        return cmdMeta();
      case "test":
        return cmdTest();
      case "help":
      case "--help":
      case "-h":
        return printHelp();
      default:
        console.error(`알 수 없는 명령어: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n오류: ${message}`);
    process.exit(1);
  }
}

main();
