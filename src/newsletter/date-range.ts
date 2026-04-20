import {
  type DatePreset,
  type LegislationSearchQuery,
  type ResolvedDateRange,
} from "./types.js";

const DEFAULT_DATE_PRESET: Exclude<DatePreset, "custom"> = "1m";
const DEFAULT_TIME_ZONE = "Asia/Seoul";

interface LocalDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function resolveDateRange(
  query: LegislationSearchQuery,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): ResolvedDateRange {
  const explicitFrom = normalizeDateString(query.dateFrom);
  const explicitTo = normalizeDateString(query.dateTo);

  if (query.datePreset === "custom" || explicitFrom || explicitTo) {
    if (!explicitFrom || !explicitTo) {
      throw new Error("사용자 지정 기간은 시작일과 종료일을 모두 입력해야 합니다.");
    }
    if (explicitFrom > explicitTo) {
      throw new Error("시작일은 종료일보다 늦을 수 없습니다.");
    }
    return {
      datePreset: "custom",
      dateFrom: explicitFrom,
      dateTo: explicitTo,
      timeZone,
    };
  }

  const preset = toResolvedPreset(query.datePreset);
  const endDate = toAnchorDate(getTimeZoneDateParts(now, timeZone));
  const startDate = subtractPreset(endDate, preset);

  return {
    datePreset: preset,
    dateFrom: formatAnchorDate(startDate),
    dateTo: formatAnchorDate(endDate),
    timeZone,
  };
}

function normalizeDateString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`날짜 형식이 올바르지 않습니다: ${value}`);
  }
  return value;
}

function getTimeZoneDateParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("시간대 기준 날짜를 계산하지 못했습니다.");
  }

  return { year, month, day };
}

function toAnchorDate(parts: LocalDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
}

function subtractPreset(anchor: Date, preset: Exclude<DatePreset, "custom">): Date {
  const next = new Date(anchor);

  switch (preset) {
    case "6m":
      next.setUTCMonth(next.getUTCMonth() - 6);
      return next;
    case "3m":
      next.setUTCMonth(next.getUTCMonth() - 3);
      return next;
    case "1m":
      next.setUTCMonth(next.getUTCMonth() - 1);
      return next;
    case "3w":
      next.setUTCDate(next.getUTCDate() - 21);
      return next;
    case "2w":
      next.setUTCDate(next.getUTCDate() - 14);
      return next;
    case "1w":
      next.setUTCDate(next.getUTCDate() - 7);
      return next;
  }
}

function toResolvedPreset(
  preset: DatePreset | undefined,
): Exclude<DatePreset, "custom"> {
  if (!preset || preset === "custom") {
    return DEFAULT_DATE_PRESET;
  }
  return preset;
}

function formatAnchorDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
