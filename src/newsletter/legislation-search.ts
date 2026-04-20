import { type ApiResult, createApiClient } from "../api/client.js";
import { API_CODES, CURRENT_AGE } from "../api/codes.js";
import { type AppConfig } from "../config.js";
import { resolveDateRange } from "./date-range.js";
import {
  type LegislationSortBy,
  type LegislationItem,
  type LegislationSearchQuery,
  type LegislationSearchResult,
  type NoticeScope,
  type ResolvedDateRange,
} from "./types.js";

interface AssemblyApiLike {
  fetchOpenAssembly(
    apiCode: string,
    params?: Record<string, string | number>,
  ): Promise<ApiResult>;
}

export function createLegislationSearchService(
  config: AppConfig,
): LegislationSearchService {
  return new LegislationSearchService(
    createApiClient(config),
    config.apiResponse.maxPageSize,
  );
}

export class LegislationSearchService {
  constructor(
    private readonly api: AssemblyApiLike,
    private readonly maxPageSize: number = 100,
  ) {}

  async search(
    query: LegislationSearchQuery,
    now: Date = new Date(),
    timeZone: string = "Asia/Seoul",
  ): Promise<LegislationSearchResult> {
    const page = toPositiveInt(query.page, 1);
    const pageSize = clampPageSize(query.pageSize, this.maxPageSize);
    const dateRange = resolveDateRange(query, now, timeZone);
    const keyword = normalizeText(query.keyword);
    const noticeScope = resolveNoticeScope(query.noticeScope);
    const sortBy = resolveSortBy(query.sortBy, keyword);
    const requestedWindowSize = Math.min(page * pageSize, this.maxPageSize);

    const activePromise = this.api.fetchOpenAssembly(
      API_CODES.LEGISLATION_ACTIVE,
      buildLegislationSearchParams(keyword, dateRange, 1, requestedWindowSize),
    );

    const closedPromise = noticeScope === "include_closed"
      ? this.api.fetchOpenAssembly(
          API_CODES.LEGISLATION_CLOSED,
          buildClosedLegislationSearchParams(keyword, 1, requestedWindowSize),
        )
      : Promise.resolve({ totalCount: 0, rows: [] });

    const [activeResult, closedResult] = await Promise.all([
      activePromise,
      closedPromise,
    ]);

    const mergedItems = mergeLegislationItems(
      [
        ...activeResult.rows.map((row) => mapLegislationItem(row, keyword, "active")),
        ...closedResult.rows.map((row) => mapLegislationItem(row, keyword, "closed")),
      ],
      keyword,
      dateRange,
      noticeScope,
      sortBy,
    );

    const pageStart = (page - 1) * pageSize;
    const pageItems = mergedItems.slice(pageStart, pageStart + pageSize);
    const total = mergedItems.length;

    return {
      query: {
        keyword,
        datePreset: dateRange.datePreset,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        noticeScope,
        sortBy,
        page,
        pageSize,
        timeZone: dateRange.timeZone,
      },
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: pageItems,
    };
  }
}

export function buildLegislationSearchParams(
  keyword: string | null,
  dateRange: ResolvedDateRange,
  page: number,
  pageSize: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    START_DT: dateRange.dateFrom,
    END_DT: dateRange.dateTo,
    pIndex: page,
    pSize: pageSize,
  };

  if (keyword) {
    params.BILL_NAME = keyword;
  }

  return params;
}

export function buildClosedLegislationSearchParams(
  keyword: string | null,
  page: number,
  pageSize: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    AGE: CURRENT_AGE,
    pIndex: page,
    pSize: pageSize,
  };

  if (keyword) {
    params.BILL_NAME = keyword;
  }

  return params;
}

function mapLegislationItem(
  row: Record<string, unknown>,
  keyword: string | null,
  noticeStatus: "active" | "closed",
): LegislationItem {
  const billId = pickString(row, "BILL_ID") ?? pickString(row, "BILL_NO") ?? "unknown";
  const billNo = pickString(row, "BILL_NO") ?? "";
  const billName = pickString(row, "BILL_NAME") ?? "";
  const proposer = pickString(row, "PROPOSER") ?? "";
  const committee = pickString(row, "CURR_COMMITTEE") ?? "";
  const detailUrl = pickString(row, "LINK_URL");
  const noticeEndDate = pickString(row, "NOTI_ED_DT");

  return {
    billId,
    billNo,
    billName,
    proposer,
    committee,
    noticeStatus,
    billStage: null,
    stageLabel: noticeStatus === "active" ? "입법예고 진행중" : "입법예고 종료",
    noticeEndDate: noticeEndDate ?? null,
    summary: "",
    detailUrl: detailUrl ?? null,
    relevanceScore: calculateKeywordRelevance(keyword, billName, proposer, committee),
    raw: row,
  };
}

function mergeLegislationItems(
  items: readonly LegislationItem[],
  keyword: string | null,
  dateRange: ResolvedDateRange,
  noticeScope: NoticeScope,
  sortBy: LegislationSortBy,
): LegislationItem[] {
  const deduplicated = new Map<string, LegislationItem>();

  for (const item of items) {
    if (noticeScope === "active_only" && item.noticeStatus !== "active") continue;
    if (!matchesKeyword(item, keyword)) continue;
    if (!matchesDateRange(item, dateRange)) continue;

    const dedupeKey = item.billId || item.billNo || item.billName;
    const existing = deduplicated.get(dedupeKey);
    if (!existing) {
      deduplicated.set(dedupeKey, item);
      continue;
    }

    // 같은 법안이 중복될 경우 진행중 입법예고를 우선하고, 그다음 관련도 점수가 높은 항목을 유지한다.
    if (existing.noticeStatus === "closed" && item.noticeStatus === "active") {
      deduplicated.set(dedupeKey, item);
      continue;
    }

    if (item.relevanceScore > existing.relevanceScore) {
      deduplicated.set(dedupeKey, item);
    }
  }

  return [...deduplicated.values()].sort((left, right) =>
    compareLegislationItems(left, right, sortBy),
  );
}

function calculateKeywordRelevance(
  keyword: string | null,
  billName: string,
  proposer: string,
  committee: string,
): number {
  if (!keyword) return 1;

  const query = keyword.toLowerCase();
  const name = billName.toLowerCase();
  const proposerText = proposer.toLowerCase();
  const committeeText = committee.toLowerCase();

  let score = 0;
  if (name.includes(query)) score += 0.7;
  if (name === query) score += 0.2;
  if (proposerText.includes(query)) score += 0.05;
  if (committeeText.includes(query)) score += 0.05;

  return Math.min(1, Number(score.toFixed(2)));
}

function matchesKeyword(
  item: LegislationItem,
  keyword: string | null,
): boolean {
  if (!keyword) return true;

  const query = keyword.toLowerCase();
  return item.billName.toLowerCase().includes(query)
    || item.proposer.toLowerCase().includes(query)
    || item.committee.toLowerCase().includes(query);
}

function matchesDateRange(
  item: LegislationItem,
  dateRange: ResolvedDateRange,
): boolean {
  if (!item.noticeEndDate) return true;
  return item.noticeEndDate >= dateRange.dateFrom
    && item.noticeEndDate <= dateRange.dateTo;
}

function compareLegislationItems(
  left: LegislationItem,
  right: LegislationItem,
  sortBy: LegislationSortBy,
): number {
  if (sortBy === "notice_end_desc") {
    return compareByDate(right.noticeEndDate, left.noticeEndDate)
      || compareByStatus(left, right)
      || compareByRelevance(left, right)
      || left.billName.localeCompare(right.billName);
  }

  if (sortBy === "notice_end_asc") {
    return compareByDate(left.noticeEndDate, right.noticeEndDate)
      || compareByStatus(left, right)
      || compareByRelevance(left, right)
      || left.billName.localeCompare(right.billName);
  }

  return compareByRelevance(left, right)
    || compareByDate(right.noticeEndDate, left.noticeEndDate)
    || compareByStatus(left, right)
    || left.billName.localeCompare(right.billName);
}

function compareByRelevance(
  left: LegislationItem,
  right: LegislationItem,
): number {
  if (right.relevanceScore !== left.relevanceScore) {
    return right.relevanceScore - left.relevanceScore;
  }
  return 0;
}

function compareByDate(
  leftDate: string | null,
  rightDate: string | null,
): number {
  return (leftDate ?? "").localeCompare(rightDate ?? "");
}

function compareByStatus(
  left: LegislationItem,
  right: LegislationItem,
): number {
  if (left.noticeStatus !== right.noticeStatus) {
    return left.noticeStatus === "active" ? -1 : 1;
  }
  return 0;
}

function resolveNoticeScope(
  noticeScope: NoticeScope | undefined,
): NoticeScope {
  return noticeScope ?? "include_closed";
}

function resolveSortBy(
  sortBy: LegislationSortBy | undefined,
  keyword: string | null,
): LegislationSortBy {
  if (sortBy) return sortBy;
  return keyword ? "relevance" : "notice_end_desc";
}

function pickString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = row[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function normalizeText(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toPositiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return fallback;
  }
  return value;
}

function clampPageSize(value: number | undefined, maxPageSize: number): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return 20;
  }
  return Math.min(value, maxPageSize);
}
