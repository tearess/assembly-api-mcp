import { describe, expect, it, vi } from "vitest";
import {
  buildStageLabel,
  inferBillStage,
  LegislationStageService,
} from "../../src/newsletter/legislation-stage.js";
import { type LegislationItem } from "../../src/newsletter/types.js";

function createItem(overrides?: Partial<LegislationItem>): LegislationItem {
  return {
    billId: "BILL_001",
    billNo: "2200001",
    billName: "인공지능 산업 진흥법 일부개정법률안",
    proposer: "홍길동",
    committee: "과학기술정보방송통신위원회",
    noticeStatus: "active",
    billStage: null,
    stageLabel: "입법예고 진행중",
    noticeEndDate: "2026-04-28",
    summary: "",
    detailUrl: "https://open.assembly.go.kr/example",
    relevanceScore: 1,
    raw: {},
    ...overrides,
  };
}

describe("newsletter/legislation-stage", () => {
  it("공포 정보가 있으면 최종 단계를 공포로 판정한다", () => {
    expect(
      inferBillStage({
        detail: {
          RGS_PROC_DT: "2026-04-15",
          PROC_RESULT: "원안가결",
        },
      }),
    ).toBe("공포");
  });

  it("접수/처리 이력의 가결 결과를 본회의 의결로 판정한다", () => {
    expect(
      inferBillStage({
        historyRows: [
          {
            BILL_NO: "2200001",
            PROC_RSLT: "가결",
            PROC_DT: "2026-04-11",
          },
        ],
      }),
    ).toBe("본회의 의결");
  });

  it("법사위 심사 행이 있으면 법사위 심사로 판정한다", () => {
    expect(
      inferBillStage({
        reviewRows: [
          {
            BILL_NO: "2200001",
            CMIT_NM: "법제사법위원회",
            PROC_RESULT_CD: "심사중",
            PROC_DT: "2026-04-10",
          },
        ],
      }),
    ).toBe("법사위 심사");
  });

  it("소관위 심사 행이 있으면 소관위 심사로 판정한다", () => {
    expect(
      inferBillStage({
        reviewRows: [
          {
            BILL_NO: "2200001",
            CMIT_NM: "교육위원회",
            PROC_RESULT_CD: "심사중",
            PROC_DT: "2026-04-10",
          },
        ],
      }),
    ).toBe("소관위 심사");
  });

  it("입법예고 상태와 의안 단계를 함께 라벨링한다", () => {
    expect(buildStageLabel("active", "법사위 심사")).toBe("입법예고 진행중 / 법사위 심사");
    expect(buildStageLabel("closed", null)).toBe("입법예고 종료");
  });

  it("서비스는 관련 없는 응답 행을 걸러내고 매칭된 단계만 사용한다", async () => {
    const fetchOpenAssembly = vi.fn(async (apiCode: string) => {
      if (apiCode === "BILLJUDGE") {
        return {
          totalCount: 2,
          rows: [
            {
              BILL_NO: "2200999",
              CMIT_NM: "교육위원회",
              PROC_RESULT_CD: "심사중",
              PROC_DT: "2026-04-08",
            },
            {
              BILL_NO: "2200001",
              CMIT_NM: "법제사법위원회",
              PROC_RESULT_CD: "심사중",
              PROC_DT: "2026-04-10",
            },
          ],
        };
      }

      if (apiCode === "BILLRCP") {
        return {
          totalCount: 0,
          rows: [],
        };
      }

      throw new Error(`unexpected apiCode: ${apiCode}`);
    });

    const service = new LegislationStageService({ fetchOpenAssembly });
    const result = await service.resolveStage(
      createItem(),
      { PROPOSE_DT: "2026-03-01" },
    );

    expect(result.billStage).toBe("법사위 심사");
    expect(result.stageLabel).toBe("입법예고 진행중 / 법사위 심사");
  });
});
