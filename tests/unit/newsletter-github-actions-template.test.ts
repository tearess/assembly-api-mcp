import { describe, expect, it } from "vitest";
import { buildGithubActionsCronTemplate } from "../../src/newsletter/github-actions-template.js";

describe("newsletter/github-actions-template", () => {
  it("현재 배포 주소 기준 GitHub Actions cron 워크플로를 만든다", () => {
    const result = buildGithubActionsCronTemplate("https://assembly-news.vercel.app");

    expect(result.filename).toBe("github-actions-newsletter-cron.yml");
    expect(result.template).toContain("name: Trigger Newsletter Cron");
    expect(result.template).toContain("NEWSLETTER_CRON_URL: https://assembly-news.vercel.app/cron/newsletter");
    expect(result.template).toContain("NEWSLETTER_CRON_SECRET: ${{ secrets.NEWSLETTER_CRON_SECRET }}");
    expect(result.template).toContain("curl --fail --show-error --silent \\");
  });
});
