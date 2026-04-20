import {
  type NewsletterOperationalSummary,
  type RecipientGroupRecord,
  type RecipientRecord,
  type SavedNewsletterSubscriptionRecord,
  type SavedSearchPresetRecord,
  type ScheduledNewsletterJobRecord,
  type ScheduledNewsletterRunRecord,
  type SendLogRecord,
} from "./types.js";

const DEFAULT_WINDOW_DAYS = 7;

export interface NewsletterOperationalSummaryInput {
  readonly recipients: readonly RecipientRecord[];
  readonly recipientGroups: readonly RecipientGroupRecord[];
  readonly searchPresets: readonly SavedSearchPresetRecord[];
  readonly subscriptionTemplates: readonly SavedNewsletterSubscriptionRecord[];
  readonly schedules: readonly ScheduledNewsletterJobRecord[];
  readonly scheduleRuns: readonly ScheduledNewsletterRunRecord[];
  readonly sendLogs: readonly SendLogRecord[];
  readonly now?: Date | string;
  readonly windowDays?: number;
}

export function buildNewsletterOperationalSummary(
  input: NewsletterOperationalSummaryInput,
): NewsletterOperationalSummary {
  const referenceNow = normalizeReferenceDate(input.now);
  const windowDays = normalizeWindowDays(input.windowDays);
  const windowStartTime = referenceNow.getTime() - (windowDays * 24 * 60 * 60 * 1000);

  const scheduleRunCounts = {
    sent: 0,
    skipped: 0,
    failed: 0,
  };
  for (const run of input.scheduleRuns) {
    const runDate = parseStoredDate(run.runAt);
    if (!runDate || runDate.getTime() < windowStartTime || runDate.getTime() > referenceNow.getTime()) {
      continue;
    }

    if (run.status === "sent") scheduleRunCounts.sent += 1;
    else if (run.status === "skipped") scheduleRunCounts.skipped += 1;
    else scheduleRunCounts.failed += 1;
  }

  const sendLogCounts = {
    sent: 0,
    failed: 0,
  };
  for (const log of input.sendLogs) {
    const sentAt = parseStoredDate(log.sentAt);
    if (!sentAt || sentAt.getTime() < windowStartTime || sentAt.getTime() > referenceNow.getTime()) {
      continue;
    }

    if (log.status === "sent") sendLogCounts.sent += 1;
    else sendLogCounts.failed += 1;
  }

  return {
    asOf: formatNowKst(referenceNow),
    recipientCount: input.recipients.length,
    recipientGroupCount: input.recipientGroups.length,
    searchPresetCount: input.searchPresets.length,
    subscriptionTemplateCount: input.subscriptionTemplates.length,
    scheduleCounts: {
      total: input.schedules.length,
      active: input.schedules.filter((item) => item.status === "pending" || item.status === "processing").length,
      paused: input.schedules.filter((item) => item.status === "paused").length,
      failed: input.schedules.filter((item) => item.status === "failed").length,
    },
    scheduleRunWindowDays: windowDays,
    scheduleRunCounts,
    sendLogCounts,
  };
}

function normalizeReferenceDate(value: Date | string | undefined): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseStoredDate(value);
    if (parsed) {
      return parsed;
    }
  }

  return new Date();
}

function normalizeWindowDays(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return DEFAULT_WINDOW_DAYS;
  }

  return Math.max(1, Math.trunc(value));
}

function parseStoredDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const parsed = new Date(withSeconds.replace(" ", "T") + "+09:00");
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function formatNowKst(date: Date): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return formatter.format(date);
}
