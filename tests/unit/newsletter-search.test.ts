import { describe, expect, it, vi } from "vitest";
import {
  buildClosedLegislationSearchParams,
  buildLegislationSearchParams,
  LegislationSearchService,
} from "../../src/newsletter/legislation-search.js";
import { type ResolvedDateRange } from "../../src/newsletter/types.js";

describe("newsletter/legislation-search", () => {
  it("검색 파라미터를 입법예고 API 형식으로 변환한다", () => {
    const range: ResolvedDateRange = {
      datePreset: "1m",
      dateFrom: "2026-03-20",
      dateTo: "2026-04-20",
      timeZone: "Asia/Seoul",
    };

    expect(
      buildLegislationSearchParams("인공지능", range, 2, 50),
    ).toEqual({
      BILL_NAME: "인공지능",
      START_DT: "2026-03-20",
      END_DT: "2026-04-20",
      pIndex: 2,
      pSize: 50,
    });
  });

  it("종료된 입법예고 검색 파라미터를 생성한다", () => {
    expect(
      buildClosedLegislationSearchParams("인공지능", 1, 20),
    ).toEqual({
      AGE: 22,
      BILL_NAME: "인공지능",
      pIndex: 1,
      pSize: 20,
    });
  });

  it("진행중/종료 입법예고를 병합하고 날짜 범위에 맞게 필터링한다", async () => {
    const fetchOpenAssembly = vi.fn(async (apiCode: string) => {
      if (apiCode === "nknalejkafmvgzmpt") {
        return {
          totalCount: 2,
          rows: [
            {
              BILL_ID: "BILL_001",
              BILL_NO: "2200001",
              BILL_NAME: "인공지능 산업 진흥법 일부개정법률안",
              PROPOSER: "홍길동",
              CURR_COMMITTEE: "과학기술정보방송통신위원회",
              NOTI_ED_DT: "2026-04-18",
              LINK_URL: "https://open.assembly.go.kr/example-active",
            },
            {
              BILL_ID: "BILL_OLD",
              BILL_NO: "2200009",
              BILL_NAME: "오래된 인공지능법",
              PROPOSER: "김의원",
              CURR_COMMITTEE: "과방위",
              NOTI_ED_DT: "2026-01-01",
              LINK_URL: "https://open.assembly.go.kr/example-old",
            },
          ],
        };
      }

      if (apiCode === "nohgwtzsamojdozky") {
        return {
          totalCount: 2,
          rows: [
            {
              BILL_ID: "BILL_002",
              BILL_NO: "2200002",
              BILL_NAME: "인공지능 윤리법안",
              PROPOSER: "이의원",
              CURR_COMMITTEE: "과학기술정보방송통신위원회",
              NOTI_ED_DT: "2026-04-05",
              LINK_URL: "https://open.assembly.go.kr/example-closed",
            },
            {
              BILL_ID: "BILL_OFFTOPIC",
              BILL_NO: "2200030",
              BILL_NAME: "주택법 일부개정법률안",
              PROPOSER: "박의원",
              CURR_COMMITTEE: "국토교통위원회",
              NOTI_ED_DT: "2026-04-10",
              LINK_URL: "https://open.assembly.go.kr/example-home",
            },
          ],
        };
      }

      throw new Error(`unexpected apiCode: ${apiCode}`);
    });

    const service = new LegislationSearchService({ fetchOpenAssembly }, 100);
    const result = await service.search(
      {
        keyword: "인공지능",
        page: 1,
        pageSize: 20,
      },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(fetchOpenAssembly).toHaveBeenCalledTimes(2);
    expect(fetchOpenAssembly).toHaveBeenNthCalledWith(
      1,
      "nknalejkafmvgzmpt",
      expect.objectContaining({
        BILL_NAME: "인공지능",
        START_DT: "2026-03-20",
        END_DT: "2026-04-20",
        pIndex: 1,
        pSize: 20,
      }),
    );
    expect(fetchOpenAssembly).toHaveBeenNthCalledWith(
      2,
      "nohgwtzsamojdozky",
      expect.objectContaining({
        AGE: 22,
        BILL_NAME: "인공지능",
        pIndex: 1,
        pSize: 20,
      }),
    );

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.query.proposerFilter).toBeNull();
    expect(result.query.committeeFilter).toBeNull();
    expect(result.items[0]).toMatchObject({
      billId: "BILL_001",
      billNo: "2200001",
      billName: "인공지능 산업 진흥법 일부개정법률안",
      proposer: "홍길동",
      committee: "과학기술정보방송통신위원회",
      noticeStatus: "active",
      stageLabel: "입법예고 진행중",
      noticeEndDate: "2026-04-18",
      detailUrl: "https://open.assembly.go.kr/example-active",
    });
    expect(result.items[0]?.relevanceScore).toBe(0.7);
    expect(result.items[1]).toMatchObject({
      billId: "BILL_002",
      noticeStatus: "closed",
      stageLabel: "입법예고 종료",
      noticeEndDate: "2026-04-05",
    });
  });

  it("발의 의원과 상임위 추가 필터를 함께 적용한다", async () => {
    const fetchOpenAssembly = vi.fn().mockResolvedValue({
      totalCount: 3,
      rows: [
        {
          BILL_ID: "BILL_201",
          BILL_NO: "2200201",
          BILL_NAME: "인공지능 기본법안",
          PROPOSER: "홍길동",
          CURR_COMMITTEE: "과학기술정보방송통신위원회",
          NOTI_ED_DT: "2026-04-18",
        },
        {
          BILL_ID: "BILL_202",
          BILL_NO: "2200202",
          BILL_NAME: "인공지능 데이터법안",
          PROPOSER: "홍길동",
          CURR_COMMITTEE: "정무위원회",
          NOTI_ED_DT: "2026-04-17",
        },
        {
          BILL_ID: "BILL_203",
          BILL_NO: "2200203",
          BILL_NAME: "인공지능 안전법안",
          PROPOSER: "김철수",
          CURR_COMMITTEE: "과학기술정보방송통신위원회",
          NOTI_ED_DT: "2026-04-16",
        },
      ],
    });

    const service = new LegislationSearchService({ fetchOpenAssembly }, 100);
    const result = await service.search(
      {
        keyword: "인공지능",
        proposerFilter: "홍길동",
        committeeFilter: "과학기술정보",
        noticeScope: "active_only",
        page: 1,
        pageSize: 20,
      },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(result.query.proposerFilter).toBe("홍길동");
    expect(result.query.committeeFilter).toBe("과학기술정보");
    expect(result.items.map((item) => item.billId)).toEqual(["BILL_201"]);
  });

  it("active_only면 진행중 입법예고만 조회한다", async () => {
    const fetchOpenAssembly = vi.fn().mockResolvedValue({
      totalCount: 1,
      rows: [
        {
          BILL_ID: "BILL_ACTIVE",
          BILL_NO: "2200007",
          BILL_NAME: "활성 법안",
          PROPOSER: "홍의원",
          CURR_COMMITTEE: "교육위원회",
          NOTI_ED_DT: "2026-04-12",
          LINK_URL: "https://open.assembly.go.kr/example-active",
        },
      ],
    });

    const service = new LegislationSearchService({ fetchOpenAssembly }, 100);
    const result = await service.search(
      {
        noticeScope: "active_only",
        page: 1,
        pageSize: 20,
      },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(fetchOpenAssembly).toHaveBeenCalledTimes(1);
    expect(fetchOpenAssembly).toHaveBeenCalledWith(
      "nknalejkafmvgzmpt",
      expect.objectContaining({
        START_DT: "2026-03-20",
        END_DT: "2026-04-20",
      }),
    );
    expect(result.query.noticeScope).toBe("active_only");
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items[0]?.noticeStatus).toBe("active");
  });

  it("정렬 옵션이 notice_end_asc면 종료일 오래된 순으로 정렬한다", async () => {
    const fetchOpenAssembly = vi.fn(async (apiCode: string) => {
      if (apiCode === "nknalejkafmvgzmpt") {
        return {
          totalCount: 2,
          rows: [
            {
              BILL_ID: "BILL_010",
              BILL_NO: "2200010",
              BILL_NAME: "첫번째 법안",
              PROPOSER: "A",
              CURR_COMMITTEE: "교육위",
              NOTI_ED_DT: "2026-04-18",
            },
            {
              BILL_ID: "BILL_011",
              BILL_NO: "2200011",
              BILL_NAME: "두번째 법안",
              PROPOSER: "B",
              CURR_COMMITTEE: "교육위",
              NOTI_ED_DT: "2026-04-01",
            },
          ],
        };
      }

      return { totalCount: 0, rows: [] };
    });

    const service = new LegislationSearchService({ fetchOpenAssembly }, 100);
    const result = await service.search(
      {
        sortBy: "notice_end_asc",
        page: 1,
        pageSize: 20,
      },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(result.query.sortBy).toBe("notice_end_asc");
    expect(result.totalPages).toBe(1);
    expect(result.items.map((item) => item.billId)).toEqual([
      "BILL_011",
      "BILL_010",
    ]);
  });

  it("페이지와 페이지 크기에 맞춰 결과를 나누고 totalPages를 계산한다", async () => {
    const fetchOpenAssembly = vi.fn(async (apiCode: string) => {
      if (apiCode === "nknalejkafmvgzmpt") {
        return {
          totalCount: 2,
          rows: [
            {
              BILL_ID: "BILL_101",
              BILL_NO: "2200101",
              BILL_NAME: "데이터법 1",
              PROPOSER: "A",
              CURR_COMMITTEE: "정무위",
              NOTI_ED_DT: "2026-04-18",
            },
            {
              BILL_ID: "BILL_102",
              BILL_NO: "2200102",
              BILL_NAME: "데이터법 2",
              PROPOSER: "B",
              CURR_COMMITTEE: "정무위",
              NOTI_ED_DT: "2026-04-17",
            },
          ],
        };
      }

      return { totalCount: 0, rows: [] };
    });

    const service = new LegislationSearchService({ fetchOpenAssembly }, 100);
    const result = await service.search(
      {
        page: 2,
        pageSize: 1,
      },
      new Date("2026-04-20T08:00:00Z"),
    );

    expect(fetchOpenAssembly).toHaveBeenCalledWith(
      "nknalejkafmvgzmpt",
      expect.objectContaining({
        pIndex: 1,
        pSize: 2,
      }),
    );
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.query.page).toBe(2);
    expect(result.query.pageSize).toBe(1);
    expect(result.items.map((item) => item.billId)).toEqual(["BILL_102"]);
  });
});
