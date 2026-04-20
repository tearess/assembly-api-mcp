import { describe, expect, it } from "vitest";
import {
  buildLegislationSearchQueryParams,
  hasMeaningfulLegislationSearchQuery,
  parseLegislationSearchQueryFromParams,
} from "../../src/newsletter/query-url.js";

describe("newsletter/query-url", () => {
  it("URLSearchParams에서 검색 조건을 파싱한다", () => {
    const params = new URLSearchParams({
      keyword: "인공지능",
      proposer: "홍길동",
      committee: "과학기술정보방송통신위원회",
      preset: "custom",
      from: "2026-03-20",
      to: "2026-04-20",
      scope: "active_only",
      sort: "notice_end_desc",
      page: "2",
      pageSize: "50",
    });

    expect(parseLegislationSearchQueryFromParams(params)).toEqual({
      keyword: "인공지능",
      proposerFilter: "홍길동",
      committeeFilter: "과학기술정보방송통신위원회",
      datePreset: "custom",
      dateFrom: "2026-03-20",
      dateTo: "2026-04-20",
      noticeScope: "active_only",
      sortBy: "notice_end_desc",
      page: 2,
      pageSize: 50,
    });
  });

  it("검색 조건을 공유용 URLSearchParams로 직렬화한다", () => {
    const params = buildLegislationSearchQueryParams({
      keyword: "인공지능",
      proposerFilter: "홍길동",
      committeeFilter: "과학기술정보",
      datePreset: "1m",
      noticeScope: "include_closed",
      sortBy: "relevance",
      page: 1,
      pageSize: 20,
    });

    expect(params.toString()).toBe(
      "keyword=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5&proposer=%ED%99%8D%EA%B8%B8%EB%8F%99&committee=%EA%B3%BC%ED%95%99%EA%B8%B0%EC%88%A0%EC%A0%95%EB%B3%B4&preset=1m&scope=include_closed&sort=relevance&page=1&pageSize=20",
    );
  });

  it("의미 있는 검색 조건 여부를 판단한다", () => {
    expect(hasMeaningfulLegislationSearchQuery({})).toBe(false);
    expect(hasMeaningfulLegislationSearchQuery({ keyword: "인공지능" })).toBe(true);
    expect(hasMeaningfulLegislationSearchQuery({ committeeFilter: "환경노동위원회" })).toBe(true);
  });
});
