import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../../src/config.js";

describe("Lite 프로필 설정", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ASSEMBLY_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("기본 프로필은 lite이다", () => {
    delete process.env.MCP_PROFILE;
    const config = loadConfig();
    expect(config.profile).toBe("lite");
  });

  it("MCP_PROFILE=full로 전환할 수 있다", () => {
    process.env.MCP_PROFILE = "full";
    const config = loadConfig();
    expect(config.profile).toBe("full");
  });

  it("MCP_PROFILE=lite를 명시할 수 있다", () => {
    process.env.MCP_PROFILE = "lite";
    const config = loadConfig();
    expect(config.profile).toBe("lite");
  });
});

describe("Lite 도구 모듈 import", () => {
  it("registerLiteTools를 export한다", async () => {
    const mod = await import("../../src/tools/lite/index.js");
    expect(mod.registerLiteTools).toBeDefined();
    expect(typeof mod.registerLiteTools).toBe("function");
  });

  it("registerLiteMemberTools를 export한다", async () => {
    const mod = await import("../../src/tools/lite/members.js");
    expect(mod.registerLiteMemberTools).toBeDefined();
  });

  it("registerLiteBillTools를 export한다", async () => {
    const mod = await import("../../src/tools/lite/bills.js");
    expect(mod.registerLiteBillTools).toBeDefined();
  });

  it("registerLiteRecordTools를 export한다", async () => {
    const mod = await import("../../src/tools/lite/records.js");
    expect(mod.registerLiteRecordTools).toBeDefined();
  });

  it("registerLiteChainTools를 export한다", async () => {
    const mod = await import("../../src/tools/lite/chains.js");
    expect(mod.registerLiteChainTools).toBeDefined();
  });
});

describe("Lite 도구 등록 검증", () => {
  it("registerLiteTools는 server.tool을 7번 호출한다", async () => {
    const { registerLiteTools } = await import("../../src/tools/lite/index.js");

    const toolCalls: string[] = [];
    const mockServer = {
      tool: (name: string, ..._args: unknown[]) => {
        toolCalls.push(name);
      },
    };

    const mockConfig = {
      apiKeys: { assemblyApiKey: "test", dataGoKrServiceKey: undefined, nanetApiKey: undefined, naboApiKey: undefined },
      server: { transport: "stdio" as const, port: 3000, logLevel: "info" as const },
      cache: { enabled: false, ttlStatic: 0, ttlDynamic: 0 },
      apiResponse: { defaultType: "json" as const, defaultPageSize: 20, maxPageSize: 100 },
      profile: "lite" as const,
    };

    registerLiteTools(mockServer as any, mockConfig);

    expect(toolCalls).toHaveLength(7);
    expect(toolCalls).toContain("search_members");
    expect(toolCalls).toContain("search_bills");
    expect(toolCalls).toContain("search_records");
    expect(toolCalls).toContain("analyze_legislator");
    expect(toolCalls).toContain("track_legislation");
    expect(toolCalls).toContain("discover_apis");
    expect(toolCalls).toContain("query_assembly");
  });
});
