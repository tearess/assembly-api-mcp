import { describe, expect, it } from "vitest";
import { buildVercelCronTemplate } from "../../src/newsletter/vercel-cron-template.js";

describe("newsletter/vercel-cron-template", () => {
  it("Vercel cron 스니펫 예시를 만든다", () => {
    const result = buildVercelCronTemplate();

    expect(result.filename).toBe("vercel-cron-snippets.txt");
    expect(result.template).toContain("\"path\": \"/cron/newsletter\"");
    expect(result.template).toContain("\"schedule\": \"*/15 * * * *\"");
    expect(result.template).toContain("\"schedule\": \"* * * * *\"");
    expect(result.template).toContain("\"schedule\": \"0 0 * * *\"");
    expect(result.template).toContain("Hobby");
  });
});
