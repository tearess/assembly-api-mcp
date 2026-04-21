import { describe, expect, it } from "vitest";
import { buildVercelEnvTemplate } from "../../src/newsletter/vercel-env-template.js";

describe("newsletter/vercel-env-template", () => {
  it("복붙 가능한 Vercel env 템플릿을 만든다", () => {
    const result = buildVercelEnvTemplate({
      MCP_PROFILE: "lite",
      NEWSLETTER_BLOB_PREFIX: "custom-newsletter",
    }, {
      origin: "https://assembly-news.vercel.app",
    });

    expect(result.filename).toBe("vercel-newsletter.env");
    expect(result.template).toContain("ASSEMBLY_API_KEY=<YOUR_ASSEMBLY_API_KEY>");
    expect(result.template).toContain("MCP_PROFILE=lite");
    expect(result.template).toContain("NEWSLETTER_STORAGE_BACKEND=vercel-blob");
    expect(result.template).toContain("NEWSLETTER_BLOB_PREFIX=custom-newsletter");
    expect(result.template).toContain("BLOB_READ_WRITE_TOKEN=<YOUR_BLOB_READ_WRITE_TOKEN>");
    expect(result.template).toContain("# Newsletter URL: https://assembly-news.vercel.app/newsletter");
    expect(result.template).toContain("# Health URL: https://assembly-news.vercel.app/health");
    expect(result.template).toContain("Markdown/HWPX");
  });
});
