import { describe, expect, it } from "vitest";
import { buildNewsletterRuntimeStatus } from "../../src/newsletter/runtime-status.js";

describe("newsletter/runtime-status", () => {
  it("API 키가 없으면 검색 불가 경고를 준다", () => {
    const status = buildNewsletterRuntimeStatus({}, new Date("2026-04-21T00:00:00.000Z"));

    expect(status.apiKeyConfigured).toBe(false);
    expect(status.missingEnvKeys).toContain("ASSEMBLY_API_KEY");
    expect(status.warnings.some((item) => item.includes("ASSEMBLY_API_KEY"))).toBe(true);
    expect(status.recommendedActions.some((item) => item.includes("ASSEMBLY_API_KEY"))).toBe(true);
  });

  it("로컬 환경에서는 파일 저장과 내부 예약 처리를 안내한다", () => {
    const status = buildNewsletterRuntimeStatus({
      ASSEMBLY_API_KEY: "sample",
    }, new Date("2026-04-21T00:00:00.000Z"));

    expect(status.platform).toBe("local");
    expect(status.apiKeyConfigured).toBe(true);
    expect(status.storageMode).toBe("local");
    expect(status.persistentStorage).toBe(true);
    expect(status.missingEnvKeys).not.toContain("NEWSLETTER_SMTP_HOST");
    expect(status.notes.some((item) => item.includes("HWPX"))).toBe(true);
  });

  it("Vercel에서 Blob이 없으면 임시 저장 경고를 준다", () => {
    const status = buildNewsletterRuntimeStatus({
      VERCEL: "1",
      ASSEMBLY_API_KEY: "sample",
    }, new Date("2026-04-21T00:00:00.000Z"));

    expect(status.platform).toBe("vercel");
    expect(status.apiKeyConfigured).toBe(true);
    expect(status.storageMode).toBe("local-tmp");
    expect(status.persistentStorage).toBe(false);
    expect(status.missingEnvKeys).toContain("NEWSLETTER_STORAGE_BACKEND");
    expect(status.missingEnvKeys).toContain("BLOB_READ_WRITE_TOKEN");
    expect(status.warnings.some((item) => item.includes("임시 저장"))).toBe(true);
    expect(status.recommendedActions.some((item) => item.includes("vercel-blob"))).toBe(true);
    expect(status.notes.some((item) => item.includes("HWPX"))).toBe(true);
  });

  it("Vercel Blob이 있으면 다운로드 중심 준비 완료 상태가 된다", () => {
    const status = buildNewsletterRuntimeStatus({
      VERCEL: "1",
      ASSEMBLY_API_KEY: "sample",
      BLOB_READ_WRITE_TOKEN: "token",
      NEWSLETTER_STORAGE_BACKEND: "vercel-blob",
    }, new Date("2026-04-21T00:00:00.000Z"));

    expect(status.apiKeyConfigured).toBe(true);
    expect(status.storageMode).toBe("vercel-blob");
    expect(status.persistentStorage).toBe(true);
    expect(status.missingEnvKeys).toHaveLength(0);
    expect(status.warnings).toHaveLength(0);
  });
});
