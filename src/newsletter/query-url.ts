import { type LegislationSearchQuery } from "./types.js";

export function parseLegislationSearchQueryFromParams(
  params: URLSearchParams,
): LegislationSearchQuery {
  const query: LegislationSearchQuery = {};
  const keyword = normalizeOptionalText(params.get("keyword"));
  const proposerFilter = normalizeOptionalText(params.get("proposer"));
  const committeeFilter = normalizeOptionalText(params.get("committee"));
  const datePreset = normalizeDatePreset(params.get("preset"));
  const dateFrom = normalizeOptionalDate(params.get("from"));
  const dateTo = normalizeOptionalDate(params.get("to"));
  const noticeScope = normalizeNoticeScope(params.get("scope"));
  const sortBy = normalizeSortBy(params.get("sort"));
  const page = normalizePositiveInt(params.get("page"));
  const pageSize = normalizePositiveInt(params.get("pageSize"));

  if (keyword) query.keyword = keyword;
  if (proposerFilter) query.proposerFilter = proposerFilter;
  if (committeeFilter) query.committeeFilter = committeeFilter;
  if (datePreset) query.datePreset = datePreset;
  if (dateFrom) query.dateFrom = dateFrom;
  if (dateTo) query.dateTo = dateTo;
  if (noticeScope) query.noticeScope = noticeScope;
  if (sortBy) query.sortBy = sortBy;
  if (page) query.page = page;
  if (pageSize) query.pageSize = pageSize;

  return query;
}

export function buildLegislationSearchQueryParams(
  query: LegislationSearchQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  appendIfPresent(params, "keyword", query.keyword);
  appendIfPresent(params, "proposer", query.proposerFilter);
  appendIfPresent(params, "committee", query.committeeFilter);
  appendIfPresent(params, "preset", query.datePreset);
  appendIfPresent(params, "from", query.dateFrom);
  appendIfPresent(params, "to", query.dateTo);
  appendIfPresent(params, "scope", query.noticeScope);
  appendIfPresent(params, "sort", query.sortBy);
  appendIfPositiveInt(params, "page", query.page);
  appendIfPositiveInt(params, "pageSize", query.pageSize);
  return params;
}

export function hasMeaningfulLegislationSearchQuery(
  query: LegislationSearchQuery,
): boolean {
  return Boolean(
    normalizeOptionalText(query.keyword)
      || normalizeOptionalText(query.proposerFilter)
      || normalizeOptionalText(query.committeeFilter)
      || normalizeDatePreset(query.datePreset ?? null)
      || normalizeOptionalDate(query.dateFrom ?? null)
      || normalizeOptionalDate(query.dateTo ?? null)
      || normalizeNoticeScope(query.noticeScope ?? null)
      || normalizeSortBy(query.sortBy ?? null)
      || normalizePositiveInt(query.page ?? null)
      || normalizePositiveInt(query.pageSize ?? null),
  );
}

function appendIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  const normalized = normalizeOptionalText(value ?? null);
  if (normalized) {
    params.set(key, normalized);
  }
}

function appendIfPositiveInt(
  params: URLSearchParams,
  key: string,
  value: number | undefined,
): void {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    params.set(key, String(value));
  }
}

function normalizeOptionalText(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalDate(value: string | null): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function normalizePositiveInt(value: string | number | null | undefined): number | undefined {
  const parsed = typeof value === "number"
    ? value
    : (typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
}

function normalizeDatePreset(value: string | null): LegislationSearchQuery["datePreset"] {
  return value === "6m"
    || value === "3m"
    || value === "1m"
    || value === "3w"
    || value === "2w"
    || value === "1w"
    || value === "custom"
    ? value
    : undefined;
}

function normalizeNoticeScope(value: string | null): LegislationSearchQuery["noticeScope"] {
  return value === "active_only" || value === "include_closed" ? value : undefined;
}

function normalizeSortBy(value: string | null): LegislationSearchQuery["sortBy"] {
  return value === "relevance"
    || value === "notice_end_desc"
    || value === "notice_end_asc"
    ? value
    : undefined;
}
