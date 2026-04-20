import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiClient, getSharedApiClient } from "../../src/api/client.js";
import { type AppConfig } from "../../src/config.js";

function createTestConfig(
  apiKeyOverrides: Partial<AppConfig["apiKeys"]> = {},
  overrides: Partial<AppConfig> = {},
): AppConfig {
  const base: AppConfig = {
    apiKeys: {
      assemblyApiKey: "test-assembly-key",
      dataGoKrServiceKey: "test-data-go-kr-key",
      nanetApiKey: undefined,
      naboApiKey: undefined,
    },
    server: { transport: "stdio", port: 3000, logLevel: "info" },
    cache: { enabled: false, ttlStatic: 86400, ttlDynamic: 3600 },
    apiResponse: { defaultType: "json", defaultPageSize: 20, maxPageSize: 100 },
    profile: "lite",
  };

  return {
    ...base,
    ...overrides,
    apiKeys: {
      ...base.apiKeys,
      ...apiKeyOverrides,
      ...overrides.apiKeys,
    },
  };
}

describe("createApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchOpenAssembly", () => {
    it("성공적인 API 응답을 파싱한다", async () => {
      const mockResponse = {
        TEST_API: [
          {
            head: [
              { list_total_count: 2 },
              { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } },
            ],
          },
          {
            row: [
              { NAME: "홍길동", PARTY: "테스트당" },
              { NAME: "김철수", PARTY: "테스트당" },
            ],
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const client = createApiClient(createTestConfig());
      const result = await client.fetchOpenAssembly("TEST_API");

      expect(result.totalCount).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveProperty("NAME", "홍길동");
    });

    it("API 에러코드를 올바르게 처리한다", async () => {
      const mockResponse = {
        TEST_API: [
          {
            head: [
              { list_total_count: 0 },
              { RESULT: { CODE: "INFO-200", MESSAGE: "인증키 오류" } },
            ],
          },
          { row: [] },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const client = createApiClient(createTestConfig());
      await expect(client.fetchOpenAssembly("TEST_API")).rejects.toThrow(
        "INFO-200",
      );
    });

    it("네트워크 오류를 처리한다", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("Connection refused"),
      );

      const client = createApiClient(createTestConfig());
      await expect(client.fetchOpenAssembly("TEST_API")).rejects.toThrow(
        "네트워크 오류",
      );
    });

    it("XML 응답을 에러로 처리한다", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          '<?xml version="1.0"?><RESULT><CODE>INFO-200</CODE><MESSAGE>인증키 오류</MESSAGE></RESULT>',
          { status: 200 },
        ),
      );

      const client = createApiClient(createTestConfig());
      await expect(client.fetchOpenAssembly("TEST_API")).rejects.toThrow(
        "INFO-200",
      );
    });

    it("KEY를 URL에 raw string으로 append한다 (이중 인코딩 방지)", async () => {
      const keyWithSpecialChars = "abc+def/ghi=";
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ TEST: [{ head: [{ list_total_count: 0 }, { RESULT: { CODE: "INFO-000", MESSAGE: "OK" } }] }, { row: [] }] }), { status: 200 }),
      );

      const client = createApiClient(
        createTestConfig({ assemblyApiKey: keyWithSpecialChars }),
      );
      await client.fetchOpenAssembly("TEST");

      const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      // KEY가 URL에 raw로 들어감 (encodeURIComponent 적용 안 됨)
      expect(calledUrl).toContain(`&KEY=${keyWithSpecialChars}`);
      expect(calledUrl).not.toContain("KEY=abc%2Bdef");
    });

    it("빈 응답을 graceful하게 처리한다", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      const client = createApiClient(createTestConfig());
      const result = await client.fetchOpenAssembly("EMPTY_API");
      expect(result.totalCount).toBe(0);
      expect(result.rows).toHaveLength(0);
    });

    it("cacheByBillId 옵션이 있으면 BILL_ID 상세 조회도 캐시한다", async () => {
      const mockResponse = {
        TEST_API: [
          {
            head: [
              { list_total_count: 1 },
              { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } },
            ],
          },
          {
            row: [{ BILL_ID: "BILL_001", BILL_NAME: "테스트 법안" }],
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const client = createApiClient(
        createTestConfig({}, {
          cache: { enabled: true, ttlStatic: 86400, ttlDynamic: 3600 },
        }),
        { cacheByBillId: true },
      );

      await client.fetchOpenAssembly("TEST_API", { BILL_ID: "BILL_001" });
      await client.fetchOpenAssembly("TEST_API", { BILL_ID: "BILL_001" });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSharedApiClient", () => {
    it("같은 설정과 옵션이면 공유 client와 캐시를 재사용한다", async () => {
      const mockResponse = {
        TEST_API: [
          {
            head: [
              { list_total_count: 1 },
              { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } },
            ],
          },
          {
            row: [{ BILL_NAME: "공유 캐시 테스트 법안" }],
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const config = createTestConfig({}, {
        cache: { enabled: true, ttlStatic: 86400, ttlDynamic: 3600 },
      });

      const first = getSharedApiClient(config, { cacheByBillId: true });
      const second = getSharedApiClient(config, { cacheByBillId: true });

      expect(second).toBe(first);

      await first.fetchOpenAssembly("TEST_API", { BILL_NAME: "공유 캐시" });
      await second.fetchOpenAssembly("TEST_API", { BILL_NAME: "공유 캐시" });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchDataGoKr", () => {
    it("ServiceKey가 없으면 에러를 던진다", async () => {
      const client = createApiClient(
        createTestConfig({ dataGoKrServiceKey: undefined }),
      );
      await expect(client.fetchDataGoKr("test/path")).rejects.toThrow(
        "DATA_GO_KR_SERVICE_KEY",
      );
    });
  });
});
