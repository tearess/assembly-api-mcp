import { describe, expect, it } from "vitest";
import { buildLegislationPreview } from "../../src/newsletter/legislation-preview.js";
import { type LegislationItem } from "../../src/newsletter/types.js";

function createItem(overrides: Partial<LegislationItem> = {}): LegislationItem {
  return {
    billId: "BILL_001",
    billNo: "2200001",
    billName: "인공지능 산업 진흥법 일부개정법률안",
    proposer: "홍길동",
    committee: "과학기술정보방송통신위원회",
    noticeStatus: "active",
    billStage: "소관위 심사",
    stageLabel: "입법예고 진행중 / 소관위 심사",
    noticeEndDate: "2026-04-28",
    summary: "인공지능 산업의 안전성 기준과 지원 근거를 정비하는 내용",
    detailUrl: "https://open.assembly.go.kr/example",
    relevanceScore: 0.91,
    raw: {},
    ...overrides,
  };
}

describe("newsletter/preview", () => {
  it("제안이유와 주요내용, 제안일을 미리보기 구조로 정리한다", () => {
    const preview = buildLegislationPreview(createItem({
      raw: {
        RSN: "인공지능 산업의 기반 조성과 안전성 기준 마련이 필요합니다.",
        DETAIL_CONTENT: "지원 근거를 명확히 하고 위험도 평가 체계를 신설합니다.",
        PPSL_DT: "2026-04-15",
        PROC_RESULT: "소관위 회부",
      },
    }));

    expect(preview).toMatchObject({
      billNo: "2200001",
      proposalDate: "2026-04-15",
      noticeStatusLabel: "입법예고 진행중",
      relevanceLabel: "매우 높음 (0.91)",
      summary: "인공지능 산업의 안전성 기준과 지원 근거를 정비하는 내용",
    });
    expect(preview.sections).toEqual([
      {
        title: "제안이유",
        content: "인공지능 산업의 기반 조성과 안전성 기준 마련이 필요합니다.",
      },
      {
        title: "주요내용",
        content: "지원 근거를 명확히 하고 위험도 평가 체계를 신설합니다.",
      },
      {
        title: "심사 참고",
        content: "소관위 회부",
      },
    ]);
  });

  it("상세 필드가 부족하면 요약과 기본 라벨만 유지한다", () => {
    const preview = buildLegislationPreview(createItem({
      noticeStatus: "closed",
      relevanceScore: 0.38,
      summary: "",
      raw: {},
    }));

    expect(preview.summary).toBe("상세 요약 정보가 아직 수집되지 않았습니다.");
    expect(preview.noticeStatusLabel).toBe("입법예고 종료");
    expect(preview.relevanceLabel).toBe("낮음 (0.38)");
    expect(preview.sections).toEqual([]);
  });
});
