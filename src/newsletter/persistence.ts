import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  type NewsletterSendPayload,
  type NewsletterDocument,
  type RecipientGroupRecord,
  type RecipientRecord,
  type SavedSearchPresetQuery,
  type SavedSearchPresetRecord,
  type SentNewsletterSnapshotRecord,
  type ScheduledNewsletterRecurrence,
  type ScheduledNewsletterJobRecord,
  type ScheduledNewsletterJobRunStatus,
  type SendLogRecord,
} from "./types.js";

const DEFAULT_DATA_DIR = ".newsletter-data";
const RECIPIENTS_FILE = "recipients.json";
const RECIPIENT_GROUPS_FILE = "recipient-groups.json";
const SEND_LOGS_FILE = "send-logs.json";
const SEARCH_PRESETS_FILE = "search-presets.json";
const SCHEDULED_JOBS_FILE = "scheduled-jobs.json";
const SENT_SNAPSHOTS_DIR = "sent-newsletters";

export function resolveNewsletterDataDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env["NEWSLETTER_DATA_DIR"]?.trim();
  if (override) {
    return resolve(override);
  }
  return resolve(process.cwd(), DEFAULT_DATA_DIR);
}

export class RecipientStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(): Promise<readonly RecipientRecord[]> {
    const items = await readJsonArray<RecipientRecord>(
      resolve(this.dataDir, RECIPIENTS_FILE),
    );

    return items.sort((left, right) => left.email.localeCompare(right.email));
  }

  async upsert(email: string): Promise<RecipientRecord> {
    const normalizedEmail = normalizeEmail(email);
    const now = formatNowKst();
    const filePath = resolve(this.dataDir, RECIPIENTS_FILE);
    const items = await readJsonArray<RecipientRecord>(filePath);
    const existing = items.find((item) => item.email === normalizedEmail);

    let record: RecipientRecord;
    if (existing) {
      record = {
        ...existing,
        updatedAt: now,
      };
      await writeJsonArray(
        filePath,
        items.map((item) => item.email === normalizedEmail ? record : item),
      );
      return record;
    }

    record = {
      email: normalizedEmail,
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonArray(filePath, [...items, record]);
    return record;
  }

  async upsertMany(emails: readonly string[]): Promise<readonly RecipientRecord[]> {
    const results: RecipientRecord[] = [];
    for (const email of emails) {
      results.push(await this.upsert(email));
    }
    return results;
  }

  async replaceAll(emails: readonly string[]): Promise<readonly RecipientRecord[]> {
    const filePath = resolve(this.dataDir, RECIPIENTS_FILE);
    const existingItems = await readJsonArray<RecipientRecord>(filePath);
    const existingByEmail = new Map(
      existingItems.map((item) => [normalizeEmail(item.email), item]),
    );
    const normalizedEmails = Array.from(
      new Set(
        emails
          .map((email) => normalizeEmail(email))
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));
    const now = formatNowKst();
    const nextItems = normalizedEmails.map<RecipientRecord>((email) => {
      const existing = existingByEmail.get(email);
      if (existing) {
        return {
          ...existing,
          email,
          updatedAt: now,
        };
      }

      return {
        email,
        createdAt: now,
        updatedAt: now,
      };
    });

    await writeJsonArray(filePath, nextItems);
    return nextItems;
  }

  async delete(email: string): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);
    const filePath = resolve(this.dataDir, RECIPIENTS_FILE);
    const items = await readJsonArray<RecipientRecord>(filePath);
    const filtered = items.filter((item) => item.email !== normalizedEmail);
    if (filtered.length === items.length) {
      return false;
    }
    await writeJsonArray(filePath, filtered);
    return true;
  }
}

export class RecipientGroupStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(): Promise<readonly RecipientGroupRecord[]> {
    const items = await readJsonArray<RecipientGroupRecord>(
      resolve(this.dataDir, RECIPIENT_GROUPS_FILE),
    );

    return items
      .map((item) => normalizeRecipientGroupRecord(item))
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
          || left.name.localeCompare(right.name),
      );
  }

  async upsert(name: string, emails: readonly string[]): Promise<RecipientGroupRecord> {
    const normalizedName = normalizeRecipientGroupName(name);
    const normalizedEmails = normalizeRecipientGroupEmails(emails);
    const now = formatNowKst();
    const filePath = resolve(this.dataDir, RECIPIENT_GROUPS_FILE);
    const items = (await readJsonArray<RecipientGroupRecord>(filePath))
      .map((item) => normalizeRecipientGroupRecord(item));
    const existing = items.find((item) =>
      item.name.localeCompare(normalizedName, undefined, { sensitivity: "accent" }) === 0
      || item.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    let record: RecipientGroupRecord;
    if (existing) {
      record = {
        ...existing,
        name: normalizedName,
        emails: normalizedEmails,
        updatedAt: now,
      };
      await writeJsonArray(
        filePath,
        items.map((item) => item.id === existing.id ? record : item),
      );
      return record;
    }

    record = {
      id: randomUUID(),
      name: normalizedName,
      emails: normalizedEmails,
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonArray(filePath, [...items, record]);
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("삭제할 수신자 그룹 id가 필요합니다.");
    }

    const filePath = resolve(this.dataDir, RECIPIENT_GROUPS_FILE);
    const items = (await readJsonArray<RecipientGroupRecord>(filePath))
      .map((item) => normalizeRecipientGroupRecord(item));
    const filtered = items.filter((item) => item.id !== normalizedId);
    if (filtered.length === items.length) {
      return false;
    }

    await writeJsonArray(filePath, filtered);
    return true;
  }
}

export class SendLogStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(limit = 20): Promise<readonly SendLogRecord[]> {
    const items = await readJsonArray<SendLogRecord>(
      resolve(this.dataDir, SEND_LOGS_FILE),
    );

    return items
      .map((item) => normalizeSendLogRecord(item))
      .sort((left, right) => right.sentAt.localeCompare(left.sentAt))
      .slice(0, limit);
  }

  async appendLogs(
    document: NewsletterDocument,
    recipients: readonly string[],
    failures: ReadonlyMap<string, string>,
    options?: {
      readonly jobId?: string;
      readonly snapshotAvailable?: boolean;
      readonly sentAt?: string;
    },
  ): Promise<readonly SendLogRecord[]> {
    const filePath = resolve(this.dataDir, SEND_LOGS_FILE);
    const items = await readJsonArray<SendLogRecord>(filePath);
    const jobId = options?.jobId?.trim() || randomUUID();
    const sentAt = options?.sentAt?.trim() || formatNowKst();
    const snapshotAvailable = options?.snapshotAvailable === true;

    const newLogs = recipients.map<SendLogRecord>((recipient) => ({
      id: randomUUID(),
      jobId,
      recipientEmail: normalizeEmail(recipient),
      status: failures.has(normalizeEmail(recipient)) ? "failed" : "sent",
      errorMessage: failures.get(normalizeEmail(recipient)) ?? null,
      subject: document.subject,
      keyword: document.keyword,
      itemCount: document.items.length,
      snapshotAvailable,
      sentAt,
    }));

    await writeJsonArray(filePath, [...newLogs, ...items].slice(0, 500));
    return newLogs;
  }
}

export class SentNewsletterStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async save(
    jobId: string,
    document: NewsletterDocument,
    html: string,
    markdown: string,
  ): Promise<SentNewsletterSnapshotRecord> {
    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) {
      throw new Error("발송 스냅샷 저장용 job id가 필요합니다.");
    }

    const record: SentNewsletterSnapshotRecord = {
      jobId: normalizedJobId,
      document,
      html,
      markdown,
      createdAt: formatNowKst(),
    };

    const filePath = resolve(this.dataDir, SENT_SNAPSHOTS_DIR, `${normalizedJobId}.json`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(record, null, 2) + "\n", "utf-8");
    return record;
  }

  async get(jobId: string): Promise<SentNewsletterSnapshotRecord | null> {
    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) {
      return null;
    }

    const filePath = resolve(this.dataDir, SENT_SNAPSHOTS_DIR, `${normalizedJobId}.json`);
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      return isSentNewsletterSnapshotRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

export class SearchPresetStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(): Promise<readonly SavedSearchPresetRecord[]> {
    const items = await readJsonArray<SavedSearchPresetRecord>(
      resolve(this.dataDir, SEARCH_PRESETS_FILE),
    );

    return items.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
        || left.name.localeCompare(right.name),
    );
  }

  async get(id: string): Promise<SavedSearchPresetRecord | null> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return null;
    }

    const items = await readJsonArray<SavedSearchPresetRecord>(
      resolve(this.dataDir, SEARCH_PRESETS_FILE),
    );
    return items.find((item) => item.id === normalizedId) ?? null;
  }

  async upsert(
    name: string,
    query: SavedSearchPresetQuery,
  ): Promise<SavedSearchPresetRecord> {
    const normalizedName = normalizePresetName(name);
    const normalizedQuery = normalizeSavedSearchPresetQuery(query);
    const now = formatNowKst();
    const filePath = resolve(this.dataDir, SEARCH_PRESETS_FILE);
    const items = await readJsonArray<SavedSearchPresetRecord>(filePath);
    const existing = items.find((item) =>
      item.name.localeCompare(normalizedName, undefined, { sensitivity: "accent" }) === 0
      || item.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    let record: SavedSearchPresetRecord;
    if (existing) {
      record = {
        ...existing,
        name: normalizedName,
        query: normalizedQuery,
        updatedAt: now,
      };
      await writeJsonArray(
        filePath,
        items.map((item) => item.id === existing.id ? record : item),
      );
      return record;
    }

    record = {
      id: randomUUID(),
      name: normalizedName,
      query: normalizedQuery,
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonArray(filePath, [...items, record]);
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("삭제할 preset id가 필요합니다.");
    }

    const filePath = resolve(this.dataDir, SEARCH_PRESETS_FILE);
    const items = await readJsonArray<SavedSearchPresetRecord>(filePath);
    const filtered = items.filter((item) => item.id !== normalizedId);
    if (filtered.length === items.length) {
      return false;
    }

    await writeJsonArray(filePath, filtered);
    return true;
  }
}

export class ScheduledNewsletterJobStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(limit = 50): Promise<readonly ScheduledNewsletterJobRecord[]> {
    const items = await readScheduledJobArray(resolve(this.dataDir, SCHEDULED_JOBS_FILE));

    return items
      .sort((left, right) =>
        compareScheduledJobPriority(left, right)
          || right.updatedAt.localeCompare(left.updatedAt),
      )
      .slice(0, limit);
  }

  async create(
    payload: NewsletterSendPayload,
    scheduledAt: string,
    recurrence: ScheduledNewsletterRecurrence = "once",
  ): Promise<ScheduledNewsletterJobRecord> {
    const filePath = resolve(this.dataDir, SCHEDULED_JOBS_FILE);
    const items = await readScheduledJobArray(filePath);
    const now = formatNowKst();
    const record: ScheduledNewsletterJobRecord = {
      id: randomUUID(),
      scheduledAt: normalizeScheduledAt(scheduledAt),
      recurrence: normalizeRecurrence(recurrence),
      status: "pending",
      payload: normalizeNewsletterSendPayload(payload),
      deliveredBillIds: [],
      createdAt: now,
      updatedAt: now,
      processedAt: null,
      lastRunStatus: null,
      lastRunMessage: null,
      errorMessage: null,
    };

    await writeJsonArray(filePath, [record, ...items].slice(0, 300));
    return record;
  }

  async cancel(id: string): Promise<boolean> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("취소할 예약 id가 필요합니다.");
    }

    const filePath = resolve(this.dataDir, SCHEDULED_JOBS_FILE);
    const items = await readScheduledJobArray(filePath);
    let changed = false;
    const now = formatNowKst();

    const next = items.map((item) => {
      if (item.id !== normalizedId || (item.status !== "pending" && item.status !== "failed")) {
        return item;
      }
      changed = true;
      return {
        ...item,
        status: "cancelled" as const,
        updatedAt: now,
      };
    });

    if (!changed) {
      return false;
    }

    await writeJsonArray(filePath, next);
    return true;
  }

  async claimDueJobs(
    now: Date = new Date(),
    limit = 5,
  ): Promise<readonly ScheduledNewsletterJobRecord[]> {
    const filePath = resolve(this.dataDir, SCHEDULED_JOBS_FILE);
    const items = await readScheduledJobArray(filePath);
    const nowIso = now.toISOString();
    const claimedIds = new Set(
      items
        .filter((item) => item.status === "pending" && item.scheduledAt <= nowIso)
        .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))
        .slice(0, limit)
        .map((item) => item.id),
    );

    if (claimedIds.size === 0) {
      return [];
    }

    const updatedAt = formatNowKst();
    const next = items.map((item) =>
      claimedIds.has(item.id)
        ? {
            ...item,
            status: "processing" as const,
            updatedAt,
            errorMessage: null,
          }
        : item,
    );

    await writeJsonArray(filePath, next);
    return next.filter((item) => claimedIds.has(item.id));
  }

  async markSent(
    id: string,
    nowDate: Date = new Date(),
    deliveredBillIds: readonly string[] = [],
  ): Promise<boolean> {
    const normalizedDeliveredBillIds = normalizeBillIdList(deliveredBillIds);
    return updateScheduledJob(
      resolve(this.dataDir, SCHEDULED_JOBS_FILE),
      id,
      (item, now) => {
        if (item.recurrence === "once") {
          return {
            ...item,
            status: "sent",
            updatedAt: now,
            processedAt: now,
            deliveredBillIds: mergeBillIdLists(item.deliveredBillIds, normalizedDeliveredBillIds),
            lastRunStatus: "sent",
            lastRunMessage: null,
            errorMessage: null,
          };
        }

        return {
          ...item,
          scheduledAt: getNextScheduledAt(item.scheduledAt, item.recurrence, nowDate),
          status: "pending",
          updatedAt: now,
          processedAt: now,
          deliveredBillIds: mergeBillIdLists(item.deliveredBillIds, normalizedDeliveredBillIds),
          lastRunStatus: "sent",
          lastRunMessage: null,
          errorMessage: null,
        };
      },
    );
  }

  async markSkipped(
    id: string,
    message: string,
    nowDate: Date = new Date(),
  ): Promise<boolean> {
    const normalizedMessage = message.trim() || "조건에 맞는 법안이 없어 이번 회차를 건너뛰었습니다.";
    return updateScheduledJob(
      resolve(this.dataDir, SCHEDULED_JOBS_FILE),
      id,
      (item, now) => {
        if (item.recurrence === "once") {
          return {
            ...item,
            status: "skipped",
            updatedAt: now,
            processedAt: now,
            lastRunStatus: "skipped",
            lastRunMessage: normalizedMessage,
            errorMessage: null,
          };
        }

        return {
          ...item,
          scheduledAt: getNextScheduledAt(item.scheduledAt, item.recurrence, nowDate),
          status: "pending",
          updatedAt: now,
          processedAt: now,
          lastRunStatus: "skipped",
          lastRunMessage: normalizedMessage,
          errorMessage: null,
        };
      },
    );
  }

  async markFailed(id: string, errorMessage: string): Promise<boolean> {
    const normalizedMessage = errorMessage.trim() || "알 수 없는 오류";
    return updateScheduledJob(
      resolve(this.dataDir, SCHEDULED_JOBS_FILE),
      id,
      (item, now) => ({
        ...item,
        status: "failed",
        updatedAt: now,
        processedAt: now,
        lastRunStatus: "failed",
        lastRunMessage: normalizedMessage,
        errorMessage: normalizedMessage,
      }),
    );
  }

  async requeueProcessingJobs(): Promise<number> {
    const filePath = resolve(this.dataDir, SCHEDULED_JOBS_FILE);
    const items = await readScheduledJobArray(filePath);
    let count = 0;
    const now = formatNowKst();

    const next = items.map((item) => {
      if (item.status !== "processing") {
        return item;
      }
      count += 1;
      return {
        ...item,
        status: "pending" as const,
        updatedAt: now,
      };
    });

    if (count > 0) {
      await writeJsonArray(filePath, next);
    }

    return count;
  }
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  if (!existsSync(filePath)) {
    return [];
  }

  const raw = await readFile(filePath, "utf-8");
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

async function readScheduledJobArray(filePath: string): Promise<ScheduledNewsletterJobRecord[]> {
  const items = await readJsonArray<ScheduledNewsletterJobRecord>(filePath);
  return items.map((item) => normalizeScheduledJobRecord(item));
}

async function writeJsonArray<T>(
  filePath: string,
  items: readonly T[],
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items, null, 2) + "\n", "utf-8");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRecipientGroupRecord(item: RecipientGroupRecord): RecipientGroupRecord {
  const createdAt = normalizeOptionalText(item.createdAt) ?? formatNowKst();

  return {
    id: normalizeOptionalText(item.id) ?? randomUUID(),
    name: normalizeRecipientGroupName(item.name),
    emails: normalizeRecipientGroupEmails(item.emails),
    createdAt,
    updatedAt: normalizeOptionalText(item.updatedAt) ?? createdAt,
  };
}

function normalizeRecipientGroupName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("수신자 그룹 이름이 필요합니다.");
  }
  return normalized;
}

function normalizeRecipientGroupEmails(emails: readonly string[]): string[] {
  if (!Array.isArray(emails)) {
    throw new Error("수신자 그룹 이메일 목록이 올바르지 않습니다.");
  }

  const normalized = Array.from(
    new Set(
      emails
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeEmail(item))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  if (normalized.length === 0) {
    throw new Error("수신자 그룹에는 이메일이 1개 이상 필요합니다.");
  }

  return normalized;
}

function normalizeSendLogRecord(item: SendLogRecord): SendLogRecord {
  return {
    ...item,
    snapshotAvailable: item.snapshotAvailable === true,
  };
}

function normalizePresetName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("preset 이름이 필요합니다.");
  }
  return normalized;
}

function normalizeSavedSearchPresetQuery(
  query: SavedSearchPresetQuery,
): SavedSearchPresetQuery {
  const datePreset = query.datePreset ?? "1m";
  const dateFrom = normalizeOptionalDate(query.dateFrom);
  const dateTo = normalizeOptionalDate(query.dateTo);

  return {
    keyword: normalizeOptionalText(query.keyword),
    datePreset,
    dateFrom: datePreset === "custom" ? dateFrom : null,
    dateTo: datePreset === "custom" ? dateTo : null,
    noticeScope: query.noticeScope === "active_only" ? "active_only" : "include_closed",
    sortBy: normalizeSortBy(query.sortBy),
    pageSize: clampPageSize(query.pageSize),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function normalizeOptionalDate(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (normalized === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`날짜 형식이 올바르지 않습니다: ${normalized}`);
  }
  return normalized;
}

function isSentNewsletterSnapshotRecord(value: unknown): value is SentNewsletterSnapshotRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record["jobId"] === "string"
    && typeof record["html"] === "string"
    && typeof record["markdown"] === "string"
    && typeof record["createdAt"] === "string"
    && typeof record["document"] === "object"
    && record["document"] !== null;
}

function normalizeSortBy(value: SavedSearchPresetQuery["sortBy"]): SavedSearchPresetQuery["sortBy"] {
  if (value === "notice_end_desc" || value === "notice_end_asc") {
    return value;
  }
  return "relevance";
}

function clampPageSize(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return 20;
  }
  return Math.min(value, 100);
}

function normalizeNewsletterSendPayload(
  payload: NewsletterSendPayload,
): NewsletterSendPayload {
  return {
    query: payload.query ?? {},
    items: Array.isArray(payload.items) ? payload.items : [],
    selectedBillIds: Array.isArray(payload.selectedBillIds) ? payload.selectedBillIds : [],
    subject: normalizeOptionalText(payload.subject),
    introText: normalizeOptionalText(payload.introText),
    outroText: normalizeOptionalText(payload.outroText),
    includeAllResults: payload.includeAllResults === true,
    onlyNewResults: payload.onlyNewResults === true,
    excludeBillIds: normalizeBillIdList(payload.excludeBillIds),
    searchPresetId: normalizeOptionalText(payload.searchPresetId),
    searchPresetName: normalizeOptionalText(payload.searchPresetName),
    recipients: payload.recipients.map((recipient) => normalizeEmail(recipient)),
  };
}

function normalizeScheduledAt(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    throw new Error("예약 시각 형식이 올바르지 않습니다. YYYY-MM-DDTHH:mm 형식을 사용해 주세요.");
  }

  const date = new Date(`${normalized}:00+09:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("예약 시각을 해석하지 못했습니다.");
  }

  if (date.getTime() <= Date.now()) {
    throw new Error("예약 시각은 현재 시각보다 미래여야 합니다.");
  }

  return date.toISOString();
}

function normalizeRecurrence(
  value: ScheduledNewsletterRecurrence | string | undefined,
): ScheduledNewsletterRecurrence {
  if (value === "daily" || value === "weekly") {
    return value;
  }
  return "once";
}

function normalizeScheduledJobRecord(
  item: ScheduledNewsletterJobRecord,
): ScheduledNewsletterJobRecord {
  return {
    ...item,
    status: normalizeScheduledJobStatus(item.status),
    recurrence: normalizeRecurrence(item.recurrence),
    payload: normalizeNewsletterSendPayload(item.payload),
    deliveredBillIds: normalizeBillIdList(item.deliveredBillIds),
    lastRunStatus: normalizeLastRunStatus(item.lastRunStatus),
    lastRunMessage: normalizeOptionalText(item.lastRunMessage),
    errorMessage: normalizeOptionalText(item.errorMessage),
  };
}

function normalizeScheduledJobStatus(
  value: ScheduledNewsletterJobRecord["status"] | string | undefined,
): ScheduledNewsletterJobRecord["status"] {
  if (value === "processing" || value === "sent" || value === "skipped" || value === "failed" || value === "cancelled") {
    return value;
  }
  return "pending";
}

function normalizeLastRunStatus(
  value: ScheduledNewsletterJobRunStatus | string | null | undefined,
): ScheduledNewsletterJobRunStatus | null {
  if (value === "sent" || value === "failed" || value === "skipped") {
    return value;
  }
  return null;
}

function normalizeBillIdList(value: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(-1000);
}

function mergeBillIdLists(
  current: readonly string[] | null | undefined,
  next: readonly string[] | null | undefined,
): string[] {
  return normalizeBillIdList([...(current ?? []), ...(next ?? [])]);
}

function getNextScheduledAt(
  currentScheduledAt: string,
  recurrence: ScheduledNewsletterRecurrence,
  referenceDate: Date,
): string {
  const intervalMs = recurrence === "weekly"
    ? 7 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
  let nextTime = new Date(currentScheduledAt).getTime();
  const referenceTime = referenceDate.getTime();

  if (!Number.isFinite(nextTime)) {
    throw new Error("다음 예약 시각을 계산하지 못했습니다.");
  }

  do {
    nextTime += intervalMs;
  } while (nextTime <= referenceTime);

  return new Date(nextTime).toISOString();
}

async function updateScheduledJob(
  filePath: string,
  id: string,
  updater: (
    item: ScheduledNewsletterJobRecord,
    now: string,
  ) => ScheduledNewsletterJobRecord,
): Promise<boolean> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error("예약 id가 필요합니다.");
  }

  const items = await readScheduledJobArray(filePath);
  let changed = false;
  const now = formatNowKst();
  const next = items.map((item) => {
    if (item.id !== normalizedId) {
      return item;
    }
    changed = true;
    return updater(item, now);
  });

  if (!changed) {
    return false;
  }

  await writeJsonArray(filePath, next);
  return true;
}

function compareScheduledJobPriority(
  left: ScheduledNewsletterJobRecord,
  right: ScheduledNewsletterJobRecord,
): number {
  const leftRank = getScheduledJobStatusRank(left.status);
  const rightRank = getScheduledJobStatusRank(right.status);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (leftRank <= 1) {
    return left.scheduledAt.localeCompare(right.scheduledAt);
  }

  return right.scheduledAt.localeCompare(left.scheduledAt);
}

function getScheduledJobStatusRank(status: ScheduledNewsletterJobRecord["status"]): number {
  if (status === "pending") return 0;
  if (status === "processing") return 1;
  if (status === "failed") return 2;
  if (status === "sent") return 3;
  if (status === "skipped") return 4;
  return 5;
}

function formatNowKst(): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return formatter.format(new Date());
}
