import { describe, expect, it } from "vitest";
import { buildVercelDeployChecklist } from "../../src/newsletter/vercel-deploy-checklist.js";

describe("newsletter/vercel-deploy-checklist", () => {
  it("현재 배포 주소와 누락 환경 변수를 포함한 점검표를 만든다", () => {
    const result = buildVercelDeployChecklist({
      VERCEL: "1",
    }, {
      origin: "https://assembly-news.vercel.app",
    });

    expect(result.filename).toBe("vercel-deploy-checklist.md");
    expect(result.template).toContain("https://assembly-news.vercel.app/newsletter");
    expect(result.template).toContain("https://assembly-news.vercel.app/health");
    expect(result.template).toContain("https://assembly-news.vercel.app/cron/newsletter");
    expect(result.template).toContain("- [ ] ASSEMBLY_API_KEY");
    expect(result.template).toContain("- [ ] CRON_SECRET");
    expect(result.template).toContain("Vercel 환경 변수 보기");
    expect(result.template).toContain("GitHub Actions cron 보기");
  });

  it("준비가 끝난 환경에서는 다음 조치에 테스트 발송만 남긴다", () => {
    const result = buildVercelDeployChecklist({
      VERCEL: "1",
      ASSEMBLY_API_KEY: "sample",
      BLOB_READ_WRITE_TOKEN: "token",
      NEWSLETTER_STORAGE_BACKEND: "vercel-blob",
      NEWSLETTER_SMTP_HOST: "smtp.example.com",
      NEWSLETTER_SMTP_PORT: "465",
      NEWSLETTER_SMTP_USER: "user",
      NEWSLETTER_SMTP_PASS: "pass",
      NEWSLETTER_SMTP_FROM_EMAIL: "sender@example.com",
      CRON_SECRET: "secret",
    });

    expect(result.template).not.toContain("- [ ] ASSEMBLY_API_KEY");
    expect(result.template).toContain("테스트 발송");
    expect(result.template).toContain("저장된 수신자/검색 preset/구독 템플릿");
  });
});
