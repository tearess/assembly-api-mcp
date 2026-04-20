import { describe, expect, it } from "vitest";
import { resolveDateRange } from "../../src/newsletter/date-range.js";

describe("newsletter/date-range", () => {
  it("기본값은 최근 1개월 범위를 반환한다", () => {
    const range = resolveDateRange(
      {},
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(range).toMatchObject({
      datePreset: "1m",
      dateFrom: "2026-03-20",
      dateTo: "2026-04-20",
      timeZone: "Asia/Seoul",
    });
  });

  it("주간 프리셋을 날짜 범위로 변환한다", () => {
    const range = resolveDateRange(
      { datePreset: "2w" },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(range.dateFrom).toBe("2026-04-06");
    expect(range.dateTo).toBe("2026-04-20");
  });

  it("사용자 지정 기간을 그대로 반환한다", () => {
    const range = resolveDateRange({
      datePreset: "custom",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });

    expect(range).toMatchObject({
      datePreset: "custom",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
  });

  it("사용자 지정 기간이 불완전하면 에러를 던진다", () => {
    expect(() =>
      resolveDateRange({
        datePreset: "custom",
        dateFrom: "2026-02-01",
      }),
    ).toThrow("시작일과 종료일");
  });

  it("시작일이 종료일보다 늦으면 에러를 던진다", () => {
    expect(() =>
      resolveDateRange({
        dateFrom: "2026-02-10",
        dateTo: "2026-02-01",
      }),
    ).toThrow("시작일은 종료일보다 늦을 수 없습니다");
  });
});
