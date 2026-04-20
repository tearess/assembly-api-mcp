import {
  type ScheduledNewsletterJobRunStatus,
  type ScheduledNewsletterRunRecord,
  type SendLogRecord,
} from "./types.js";

export interface SendLogExportFilter {
  readonly text?: string | null;
  readonly status?: SendLogRecord["status"] | "all" | null;
}

export interface ScheduleRunExportFilter {
  readonly text?: string | null;
  readonly status?: ScheduledNewsletterJobRunStatus | "all" | null;
  readonly scheduleJobId?: string | null;
}

export function filterSendLogs(
  logs: readonly SendLogRecord[],
  filter: SendLogExportFilter = {},
): readonly SendLogRecord[] {
  const text = normalizeFilterText(filter.text);
  const status = normalizeSendLogStatus(filter.status);

  return logs.filter((log) => {
    if (status && log.status !== status) {
      return false;
    }

    if (!text) {
      return true;
    }

    return matchesFilterText(text, [
      log.recipientEmail,
      log.subject,
      log.keyword,
      log.errorMessage,
    ]);
  });
}

export function filterScheduleRuns(
  runs: readonly ScheduledNewsletterRunRecord[],
  filter: ScheduleRunExportFilter = {},
): readonly ScheduledNewsletterRunRecord[] {
  const text = normalizeFilterText(filter.text);
  const status = normalizeScheduleRunStatus(filter.status);
  const scheduleJobId = normalizeFilterText(filter.scheduleJobId);

  return runs.filter((run) => {
    if (scheduleJobId && run.scheduleJobId !== scheduleJobId) {
      return false;
    }

    if (status && run.status !== status) {
      return false;
    }

    if (!text) {
      return true;
    }

    return matchesFilterText(text, [
      run.scheduleSubject,
      run.keyword,
      run.message,
    ]);
  });
}

export function renderSendLogsCsv(logs: readonly SendLogRecord[]): string {
  return renderCsv([
    ["recipient_email", "status", "subject", "keyword", "item_count", "snapshot_available", "sent_at", "error_message", "job_id", "log_id"],
    ...logs.map((log) => [
      log.recipientEmail,
      log.status,
      log.subject,
      log.keyword ?? "",
      String(log.itemCount ?? 0),
      log.snapshotAvailable ? "true" : "false",
      log.sentAt,
      log.errorMessage ?? "",
      log.jobId,
      log.id,
    ]),
  ]);
}

export function renderScheduleRunsCsv(runs: readonly ScheduledNewsletterRunRecord[]): string {
  return renderCsv([
    ["run_at", "status", "schedule_subject", "schedule_job_id", "recurrence", "keyword", "item_count", "sent_count", "failed_count", "message", "delivery_job_id"],
    ...runs.map((run) => [
      run.runAt,
      run.status,
      run.scheduleSubject,
      run.scheduleJobId,
      run.recurrence,
      run.keyword ?? "",
      String(run.itemCount ?? 0),
      String(run.sentCount ?? 0),
      String(run.failedCount ?? 0),
      run.message ?? "",
      run.deliveryJobId ?? "",
    ]),
  ]);
}

function normalizeFilterText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeSendLogStatus(
  value: SendLogExportFilter["status"],
): SendLogRecord["status"] | null {
  return value === "sent" || value === "failed" ? value : null;
}

function normalizeScheduleRunStatus(
  value: ScheduleRunExportFilter["status"],
): ScheduledNewsletterJobRunStatus | null {
  return value === "sent" || value === "failed" || value === "skipped" ? value : null;
}

function matchesFilterText(text: string, values: readonly (string | null | undefined)[]): boolean {
  return values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .some((value) => value.toLowerCase().includes(text));
}

function renderCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n") + "\n";
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
