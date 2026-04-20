import { describe, expect, it, vi } from "vitest";
import { API_CODES } from "../../src/api/codes.js";
import {
  buildLegislationItemFromDetail,
  LegislationDetailService,
} from "../../src/newsletter/legislation-detail.js";

describe("newsletter/detail", () => {
  it("법안 상세, 심사 이력, 접수 이력을 합쳐 상세 결과를 만든다", async () => {
    const fetchOpenAssembly = vi.fn(async (apiCode: string) => {
      if (apiCode === API_CODES.BILL_DETAIL) {
        return {
          totalCount: 1,
          rows: [
            {
              BILL_ID: "BILL_001",
              BILL_NO: "2200001",
              BILL_NAME: "인공지능 산업 진흥법 일부개정법률안",
              PROPOSER: "홍길동",
              CURR_COMMITTEE: "과학기술정보방송통신위원회",
              NOTI_ED_DT: "2099-04-28",
              LINK_URL: "https://open.assembly.go.kr/example",
              RSN: "산업 기반을 정비하기 위한 제안이유",
              DETAIL_CONTENT: "지원 근거를 명확히 하고 위험도 평가 체계를 신설합니다.",
              PPSL_DT: "2099-04-15",
            },
          ],
        };
      }

      if (apiCode === API_CODES.BILL_REVIEW) {
        return {
          totalCount: 1,
          rows: [
            {
              BILL_ID: "BILL_001",
              CMIT_NM: "과학기술정보방송통신위원회",
              PROC_DT: "2099-04-16",
              PROC_RESULT: "심사중",
            },
          ],
        };
      }

      if (apiCode === API_CODES.BILL_RECEIVED) {
        return {
          totalCount: 1,
          rows: [
            {
              BILL_NO: "2200001",
              PPSL_DT: "2099-04-15",
              PROC_RSLT: "접수",
              BILL_KIND: "법률안",
            },
          ],
        };
      }

      return { totalCount: 0, rows: [] };
    });

    const service = new LegislationDetailService({ fetchOpenAssembly });
    const detail = await service.getByBillId("BILL_001", new Date("2099-04-20T00:00:00Z"));

    expect(detail).toBeTruthy();
    expect(detail?.item).toMatchObject({
      billId: "BILL_001",
      billNo: "2200001",
      billName: "인공지능 산업 진흥법 일부개정법률안",
      proposer: "홍길동",
      committee: "과학기술정보방송통신위원회",
      noticeStatus: "active",
      stageLabel: "입법예고 진행중 / 소관위 심사",
    });
    expect(detail?.preview).toMatchObject({
      billNo: "2200001",
      proposalDate: "2099-04-15",
      noticeStatusLabel: "입법예고 진행중",
      proposalReason: "산업 기반을 정비하기 위한 제안이유",
      mainContent: "지원 근거를 명확히 하고 위험도 평가 체계를 신설합니다.",
    });
    expect(detail?.reviewEvents).toEqual([
      {
        label: "과학기술정보방송통신위원회",
        date: "2099-04-16",
        detail: "심사중",
      },
    ]);
    expect(detail?.historyEvents).toEqual([
      {
        label: "접수",
        date: "2099-04-15",
        detail: "법률안",
      },
    ]);
  });

  it("상세 row가 없으면 null을 반환한다", async () => {
    const service = new LegislationDetailService({
      fetchOpenAssembly: vi.fn(async () => ({ totalCount: 0, rows: [] })),
    });

    await expect(service.getByBillId("BILL_404")).resolves.toBeNull();
  });

  it("상세 row에서 공고 종료 여부를 계산한다", () => {
    const item = buildLegislationItemFromDetail(
      {
        BILL_ID: "BILL_002",
        BILL_NO: "2200002",
        BILL_NAME: "데이터 산업 육성법 일부개정법률안",
        NOTI_ED_DT: "2099-04-10",
      },
      new Date("2099-04-20T00:00:00Z"),
    );

    expect(item.noticeStatus).toBe("closed");
    expect(item.stageLabel).toBe("입법예고 종료");
  });
});
