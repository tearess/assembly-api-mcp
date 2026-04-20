import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  type NewsletterSendPayload,
  type NewsletterDocument,
  type NewsletterSettingsBundle,
  type RecipientGroupRecord,
  type RecipientRecord,
  type ScheduledNewsletterRunRecord,
  type SavedNewsletterSubscriptionRecord,
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
const SCHEDULE_RUN_LOGS_FILE = "schedule-run-logs.json";
const SEARCH_PRESETS_FILE = "search-presets.json";
const NEWSLETTER_SUBSCRIPTIONS_FILE = "newsletter-subscriptions.json";
const SCHEDULED_JOBS_FILE = "scheduled-jobs.json";
const SENT_SNAPSHOTS_DIR = "sent-newsletters";
const SETTINGS_BUNDLE_VERSION = 1;
const ACTIVE_DUPLICATE_SCHEDULE_STATUSES = new Set([
  "pending",
  "processing",
  "paused",
  "failed",
]);

export function resolveNewsletterDataDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env["NEWSLETTER_DATA_DIR"]?.trim();
  if (override) {
    return resolve(override);
  }
  return resolve(process.cwd(), DEFAULT_DATA_DIR);
}

export async function exportNewsletterSettingsBundle(
  dataDir: string = resolveNewsletterDataDir(),
): Promise<NewsletterSettingsBundle> {
  const [recipients, recipientGroups, searchPresets, subscriptionTemplates] = await Promise.all([
    new RecipientStore(dataDir).list(),
    new RecipientGroupStore(dataDir).list(),
    new SearchPresetStore(dataDir).list(),
    new NewsletterSubscriptionStore(dataDir).list(),
  ]);

  return {
    version: SETTINGS_BUNDLE_VERSION,
    exportedAt: formatNowKst(),
    recipients,
    recipientGroups,
    searchPresets,
    subscriptionTemplates,
  };
}

export async function importNewsletterSettingsBundle(
  input: unknown,
  dataDir: string = resolveNewsletterDataDir(),
): Promise<NewsletterSettingsBundle> {
  const bundle = normalizeNewsletterSettingsBundle(input);

  await Promise.all([
    writeJsonArray(
      resolve(dataDir, RECIPIENTS_FILE),
      dedupeRecipients(bundle.recipients),
    ),
    writeJsonArray(
      resolve(dataDir, RECIPIENT_GROUPS_FILE),
      dedupeRecordsById(bundle.recipientGroups),
    ),
    writeJsonArray(
      resolve(dataDir, SEARCH_PRESETS_FILE),
      dedupeRecordsById(bundle.searchPresets),
    ),
    writeJsonArray(
      resolve(dataDir, NEWSLETTER_SUBSCRIPTIONS_FILE),
      dedupeRecordsById(bundle.subscriptionTemplates),
    ),
  ]);

  return bundle;
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

  async get(id: string): Promise<RecipientGroupRecord | null> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return null;
    }

    const items = await this.list();
    return items.find((item) => item.id === normalizedId) ?? null;
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

  async get(id: string): Promise<SendLogRecord | null> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return null;
    }

    const items = await readJsonArray<SendLogRecord>(
      resolve(this.dataDir, SEND_LOGS_FILE),
    );
    return items
      .map((item) => normalizeSendLogRecord(item))
      .find((item) => item.id === normalizedId) ?? null;
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

export class ScheduledNewsletterRunStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(
    limit = 20,
    scheduleJobId?: string | null,
  ): Promise<readonly ScheduledNewsletterRunRecord[]> {
    const normalizedScheduleJobId = normalizeOptionalText(scheduleJobId);
    const items = await readJsonArray<ScheduledNewsletterRunRecord>(
      resolve(this.dataDir, SCHEDULE_RUN_LOGS_FILE),
    );

    return items
      .map((item) => normalizeScheduledNewsletterRunRecord(item))
      .filter((item) => normalizedScheduleJobId ? item.scheduleJobId === normalizedScheduleJobId : true)
      .sort((left, right) => right.runAt.localeCompare(left.runAt))
      .slice(0, limit);
  }

  async append(
    input: Omit<ScheduledNewsletterRunRecord, "id" | "runAt"> & { readonly runAt?: string | null },
  ): Promise<ScheduledNewsletterRunRecord> {
    const filePath = resolve(this.dataDir, SCHEDULE_RUN_LOGS_FILE);
    const items = await readJsonArray<ScheduledNewsletterRunRecord>(filePath);
    const record = normalizeScheduledNewsletterRunRecord({
      ...input,
      id: randomUUID(),
      runAt: input.runAt ?? formatNowKst(),
    });

    await writeJsonArray(filePath, [record, ...items].slice(0, 500));
    return record;
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

export class NewsletterSubscriptionStore {
  constructor(
    private readonly dataDir: string = resolveNewsletterDataDir(),
  ) {}

  async list(): Promise<readonly SavedNewsletterSubscriptionRecord[]> {
    const items = await readJsonArray<SavedNewsletterSubscriptionRecord>(
      resolve(this.dataDir, NEWSLETTER_SUBSCRIPTIONS_FILE),
    );

    return items
      .map((item) => normalizeNewsletterSubscriptionRecord(item))
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
          || left.name.localeCompare(right.name),
      );
  }

  async get(id: string): Promise<SavedNewsletterSubscriptionRecord | null> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return null;
    }

    const items = await this.list();
    return items.find((item) => item.id === normalizedId) ?? null;
  }

  async upsert(
    name: string,
    input: Omit<SavedNewsletterSubscriptionRecord, "id" | "name" | "createdAt" | "updatedAt">,
  ): Promise<SavedNewsletterSubscriptionRecord> {
    const normalizedName = normalizePresetName(name);
    const normalizedInput = normalizeNewsletterSubscriptionInput(input);
    const now = formatNowKst();
    const filePath = resolve(this.dataDir, NEWSLETTER_SUBSCRIPTIONS_FILE);
    const items = (await readJsonArray<SavedNewsletterSubscriptionRecord>(filePath))
      .map((item) => normalizeNewsletterSubscriptionRecord(item));
    const existing = items.find((item) =>
      item.name.localeCompare(normalizedName, undefined, { sensitivity: "accent" }) === 0
      || item.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    let record: SavedNewsletterSubscriptionRecord;
    if (existing) {
      record = {
        ...existing,
        ...normalizedInput,
        name: normalizedName,
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
      ...normalizedInput,
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonArray(filePath, [...items, record]);
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("삭제할 구독 템플릿 id가 필요합니다.");
    }

    const filePath = resolve(this.dataDir, NEWSLETTER_SUBSCRIPTIONS_FILE);
    const items = (await readJsonArray<SavedNewsletterSubscriptionRecord>(filePath))
      .map((item) => normalizeNewsletterSubscriptionRecord(item));
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
    const normalizedScheduledAt = normalizeScheduledAt(scheduledAt);
    const normalizedRecurrence = normalizeRecurrence(recurrence);
    const normalizedPayload = normalizeNewsletterSendPayload(payload);
    const duplicate = findDuplicateScheduledJob(
      items,
      normalizedPayload,
      normalizedScheduledAt,
      normalizedRecurrence,
    );
    if (duplicate) {
      throw new Error(buildDuplicateScheduledJobErrorMessage(duplicate));
    }
    const now = formatNowKst();
    const record: ScheduledNewsletterJobRecord = {
      id: randomUUID(),
      scheduledAt: normalizedScheduledAt,
      recurrence: normalizedRecurrence,
      status: "pending",
      payload: normalizedPayload,
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

  async update(
    id: string,
    scheduledAt: string,
    recurrence: ScheduledNewsletterRecurrence = "once",
  ): Promise<boolean> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("수정할 예약 id가 필요합니다.");
    }

    const filePath = resolve(this.dataDir, SCHEDULED_JOBS_FILE);
    const items = await readScheduledJobArray(filePath);
    const current = items.find((item) => item.id === normalizedId);
    if (!current) {
      return false;
    }

    if (current.status !== "pending" && current.status !== "paused" && current.status !== "failed") {
      return false;
    }

    const normalizedScheduledAt = normalizeScheduledAt(scheduledAt);
    const normalizedRecurrence = normalizeRecurrence(recurrence);
    const duplicate = findDuplicateScheduledJob(
      items,
      current.payload,
      normalizedScheduledAt,
      normalizedRecurrence,
      normalizedId,
    );
    if (duplicate) {
      throw new Error(buildDuplicateScheduledJobErrorMessage(duplicate));
    }

    if (
      current.scheduledAt === normalizedScheduledAt
      && current.recurrence === normalizedRecurrence
    ) {
      return true;
    }

    const now = formatNowKst();
    const next = items.map((item) =>
      item.id === normalizedId
        ? {
            ...item,
            scheduledAt: normalizedScheduledAt,
            recurrence: normalizedRecurrence,
            updatedAt: now,
          }
        : item,
    );

    await writeJsonArray(filePath, next);
    return true;
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
      if (
        item.id !== normalizedId
        || (item.status !== "pending" && item.status !== "paused" && item.status !== "failed")
      ) {
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

  async pause(id: string): Promise<boolean> {
    return updateScheduledJob(
      resolve(this.dataDir, SCHEDULED_JOBS_FILE),
      id,
      (item, now) => {
        if (item.status !== "pending") {
          return item;
        }

        return {
          ...item,
          status: "paused",
          updatedAt: now,
          errorMessage: null,
        };
      },
    );
  }

  async resume(id: string): Promise<boolean> {
    return updateScheduledJob(
      resolve(this.dataDir, SCHEDULED_JOBS_FILE),
      id,
      (item, now) => {
        if (item.status !== "paused" && item.status !== "failed") {
          return item;
        }

        return {
          ...item,
          status: "pending",
          updatedAt: now,
          errorMessage: null,
        };
      },
    );
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

function normalizeRecipientRecord(item: RecipientRecord): RecipientRecord {
  const email = normalizeEmail(item.email);
  if (!email) {
    throw new Error("수신자 이메일이 필요합니다.");
  }

  const createdAt = normalizeOptionalText(item.createdAt) ?? formatNowKst();
  return {
    email,
    createdAt,
    updatedAt: normalizeOptionalText(item.updatedAt) ?? createdAt,
  };
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

function normalizeScheduledNewsletterRunRecord(
  item: ScheduledNewsletterRunRecord,
): ScheduledNewsletterRunRecord {
  const scheduleJobId = normalizeOptionalText(item.scheduleJobId);
  if (!scheduleJobId) {
    throw new Error("예약 실행 로그에는 scheduleJobId가 필요합니다.");
  }
  const subject = normalizeOptionalText(item.scheduleSubject) ?? "[입법예고 뉴스레터]";

  return {
    id: normalizeOptionalText(item.id) ?? randomUUID(),
    scheduleJobId,
    scheduleSubject: subject,
    recurrence: normalizeRecurrence(item.recurrence),
    status: normalizeLastRunStatus(item.status) ?? "failed",
    message: normalizeOptionalText(item.message),
    keyword: normalizeOptionalText(item.keyword),
    itemCount: normalizeNonNegativeInteger(item.itemCount),
    sentCount: normalizeNonNegativeInteger(item.sentCount),
    failedCount: normalizeNonNegativeInteger(item.failedCount),
    deliveryJobId: normalizeOptionalText(item.deliveryJobId),
    runAt: normalizeOptionalText(item.runAt) ?? formatNowKst(),
  };
}

function normalizePresetName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("preset 이름이 필요합니다.");
  }
  return normalized;
}

function normalizeSavedSearchPresetRecord(
  item: SavedSearchPresetRecord,
): SavedSearchPresetRecord {
  const createdAt = normalizeOptionalText(item.createdAt) ?? formatNowKst();

  return {
    id: normalizeOptionalText(item.id) ?? randomUUID(),
    name: normalizePresetName(item.name),
    query: normalizeSavedSearchPresetQuery(item.query),
    createdAt,
    updatedAt: normalizeOptionalText(item.updatedAt) ?? createdAt,
  };
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

function normalizeNewsletterSubscriptionInput(
  input: Omit<SavedNewsletterSubscriptionRecord, "id" | "name" | "createdAt" | "updatedAt">,
): Omit<SavedNewsletterSubscriptionRecord, "id" | "name" | "createdAt" | "updatedAt"> {
  return {
    query: normalizeSavedSearchPresetQuery(input.query),
    recipientGroupId: normalizeOptionalText(input.recipientGroupId),
    recipientGroupName: normalizeOptionalText(input.recipientGroupName),
    searchPresetId: normalizeOptionalText(input.searchPresetId),
    searchPresetName: normalizeOptionalText(input.searchPresetName),
    recipients: normalizeRecipientGroupEmails(input.recipients),
    subject: normalizeOptionalText(input.subject),
    introText: normalizeOptionalText(input.introText),
    outroText: normalizeOptionalText(input.outroText),
    recurrence: normalizeRecurrence(input.recurrence),
    onlyNewResults: input.onlyNewResults === true,
  };
}

function normalizeNewsletterSubscriptionRecord(
  item: SavedNewsletterSubscriptionRecord,
): SavedNewsletterSubscriptionRecord {
  const createdAt = normalizeOptionalText(item.createdAt) ?? formatNowKst();

  return {
    id: normalizeOptionalText(item.id) ?? randomUUID(),
    name: normalizePresetName(item.name),
    ...normalizeNewsletterSubscriptionInput(item),
    createdAt,
    updatedAt: normalizeOptionalText(item.updatedAt) ?? createdAt,
  };
}

function normalizeNewsletterSettingsBundle(
  input: unknown,
): NewsletterSettingsBundle {
  if (!isRecord(input)) {
    throw new Error("설정 백업 파일 형식이 올바르지 않습니다.");
  }

  const version = input["version"];
  if (version !== SETTINGS_BUNDLE_VERSION) {
    throw new Error("지원하지 않는 설정 백업 파일 버전입니다.");
  }

  return {
    version: SETTINGS_BUNDLE_VERSION,
    exportedAt: normalizeOptionalText(asOptionalString(input["exportedAt"])) ?? formatNowKst(),
    recipients: readBundleArray(input["recipients"], "recipients")
      .map((item) => normalizeRecipientRecord(item as unknown as RecipientRecord)),
    recipientGroups: readBundleArray(input["recipientGroups"], "recipientGroups")
      .map((item) => normalizeRecipientGroupRecord(item as unknown as RecipientGroupRecord)),
    searchPresets: readBundleArray(input["searchPresets"], "searchPresets")
      .map((item) => normalizeSavedSearchPresetRecord(item as unknown as SavedSearchPresetRecord)),
    subscriptionTemplates: readBundleArray(input["subscriptionTemplates"], "subscriptionTemplates")
      .map((item) => normalizeNewsletterSubscriptionRecord(item as unknown as SavedNewsletterSubscriptionRecord)),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readBundleArray(
  value: unknown,
  fieldName: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new Error(`설정 백업 파일의 ${fieldName} 필드가 올바르지 않습니다.`);
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error(`설정 백업 파일의 ${fieldName} 항목 형식이 올바르지 않습니다.`);
    }
    return item;
  });
}

function dedupeRecipients(items: readonly RecipientRecord[]): RecipientRecord[] {
  const map = new Map<string, RecipientRecord>();
  for (const item of items) {
    map.set(item.email, normalizeRecipientRecord(item));
  }
  return Array.from(map.values()).sort((left, right) => left.email.localeCompare(right.email));
}

function dedupeRecordsById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function normalizeSortBy(
  value: SavedSearchPresetQuery["sortBy"] | undefined,
): SavedSearchPresetQuery["sortBy"] {
  if (value === "notice_end_desc" || value === "notice_end_asc") {
    return value;
  }
  return "relevance";
}

function normalizeDatePreset(
  value: NewsletterSendPayload["query"]["datePreset"],
): NonNullable<NewsletterSendPayload["query"]["datePreset"]> {
  if (
    value === "6m"
    || value === "3m"
    || value === "1m"
    || value === "3w"
    || value === "2w"
    || value === "1w"
    || value === "custom"
  ) {
    return value;
  }
  return "1m";
}

function clampPageSize(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return 20;
  }
  return Math.min(value, 100);
}

function normalizeNonNegativeInteger(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizePositiveInteger(
  value: number | null | undefined,
  fallback: number,
): number {
  const normalized = normalizeNonNegativeInteger(value);
  return normalized > 0 ? normalized : fallback;
}

function normalizeScheduledJobQuery(
  query: NewsletterSendPayload["query"],
  includeAllResults = false,
): NewsletterSendPayload["query"] {
  const source = query ?? {};
  const datePreset = normalizeDatePreset(source.datePreset);

  return {
    keyword: normalizeOptionalText(source.keyword) ?? undefined,
    datePreset,
    dateFrom: datePreset === "custom" ? normalizeOptionalDate(source.dateFrom) ?? undefined : undefined,
    dateTo: datePreset === "custom" ? normalizeOptionalDate(source.dateTo) ?? undefined : undefined,
    noticeScope: source.noticeScope === "active_only" ? "active_only" : "include_closed",
    sortBy: normalizeSortBy(source.sortBy),
    page: includeAllResults ? 1 : normalizePositiveInteger(source.page, 1),
    pageSize: includeAllResults ? undefined : clampPageSize(source.pageSize),
  };
}

function normalizeNewsletterSendPayload(
  payload: NewsletterSendPayload,
): NewsletterSendPayload {
  return {
    query: normalizeScheduledJobQuery(payload.query, payload.includeAllResults === true),
    items: Array.isArray(payload.items) ? payload.items : [],
    selectedBillIds: normalizeBillIdList(payload.selectedBillIds),
    subject: normalizeOptionalText(payload.subject),
    introText: normalizeOptionalText(payload.introText),
    outroText: normalizeOptionalText(payload.outroText),
    includeAllResults: payload.includeAllResults === true,
    onlyNewResults: payload.onlyNewResults === true,
    excludeBillIds: normalizeBillIdList(payload.excludeBillIds),
    recipientGroupId: normalizeOptionalText(payload.recipientGroupId),
    recipientGroupName: normalizeOptionalText(payload.recipientGroupName),
    searchPresetId: normalizeOptionalText(payload.searchPresetId),
    searchPresetName: normalizeOptionalText(payload.searchPresetName),
    subscriptionTemplateId: normalizeOptionalText(payload.subscriptionTemplateId),
    subscriptionTemplateName: normalizeOptionalText(payload.subscriptionTemplateName),
    recipients: normalizeRecipientList(payload.recipients),
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
  if (
    value === "processing"
    || value === "paused"
    || value === "sent"
    || value === "skipped"
    || value === "failed"
    || value === "cancelled"
  ) {
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
    const updatedItem = updater(item, now);
    if (updatedItem !== item) {
      changed = true;
    }
    return updatedItem;
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

  if (leftRank <= 2) {
    return left.scheduledAt.localeCompare(right.scheduledAt);
  }

  return right.scheduledAt.localeCompare(left.scheduledAt);
}

function getScheduledJobStatusRank(status: ScheduledNewsletterJobRecord["status"]): number {
  if (status === "pending") return 0;
  if (status === "processing") return 1;
  if (status === "paused") return 2;
  if (status === "failed") return 3;
  if (status === "sent") return 4;
  if (status === "skipped") return 5;
  return 6;
}

function isDuplicateScheduledJob(
  item: ScheduledNewsletterJobRecord,
  payload: NewsletterSendPayload,
  scheduledAt: string,
  recurrence: ScheduledNewsletterRecurrence,
): boolean {
  if (!ACTIVE_DUPLICATE_SCHEDULE_STATUSES.has(item.status)) {
    return false;
  }

  return buildScheduledJobFingerprint(item.payload, item.scheduledAt, item.recurrence)
    === buildScheduledJobFingerprint(payload, scheduledAt, recurrence);
}

function findDuplicateScheduledJob(
  items: readonly ScheduledNewsletterJobRecord[],
  payload: NewsletterSendPayload,
  scheduledAt: string,
  recurrence: ScheduledNewsletterRecurrence,
  excludeId?: string,
): ScheduledNewsletterJobRecord | undefined {
  return items.find((item) =>
    item.id !== excludeId
    && isDuplicateScheduledJob(item, payload, scheduledAt, recurrence)
  );
}

function buildScheduledJobFingerprint(
  payload: NewsletterSendPayload,
  scheduledAt: string,
  recurrence: ScheduledNewsletterRecurrence,
): string {
  const normalizedPayload = normalizeNewsletterSendPayload(payload);
  const includeAllResults = normalizedPayload.includeAllResults === true;
  const recipientGroupId = normalizeOptionalText(normalizedPayload.recipientGroupId);

  return JSON.stringify({
    scheduledAt,
    recurrence,
    includeAllResults,
    query: normalizedPayload.query,
    selectedBillIds: sortNormalizedValues(normalizedPayload.selectedBillIds),
    itemBillIds: includeAllResults ? [] : sortNormalizedValues(extractPayloadItemBillIds(normalizedPayload.items)),
    subject: normalizedPayload.subject,
    introText: normalizedPayload.introText,
    outroText: normalizedPayload.outroText,
    onlyNewResults: normalizedPayload.onlyNewResults === true,
    excludeBillIds: sortNormalizedValues(normalizedPayload.excludeBillIds),
    recipientGroupId,
    recipientGroupName: normalizeOptionalText(normalizedPayload.recipientGroupName),
    recipients: recipientGroupId ? [] : normalizedPayload.recipients,
    searchPresetId: normalizeOptionalText(normalizedPayload.searchPresetId),
    searchPresetName: normalizeOptionalText(normalizedPayload.searchPresetName),
    subscriptionTemplateId: normalizeOptionalText(normalizedPayload.subscriptionTemplateId),
    subscriptionTemplateName: normalizeOptionalText(normalizedPayload.subscriptionTemplateName),
  });
}

function extractPayloadItemBillIds(
  items: readonly NewsletterSendPayload["items"][number][],
): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return normalizeBillIdList(
    items.map((item) => {
      if (typeof item !== "object" || item === null) {
        return "";
      }

      return typeof item.billId === "string" ? item.billId : "";
    }),
  );
}

function normalizeRecipientList(recipients: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return sortNormalizedValues(
    recipients
      .map((recipient) => normalizeEmail(recipient))
      .filter(Boolean),
  );
}

function sortNormalizedValues(values: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );
}

function buildDuplicateScheduledJobErrorMessage(item: ScheduledNewsletterJobRecord): string {
  return [
    "같은 조건의 예약 발송이 이미 등록되어 있습니다.",
    `기존 예약: ${formatScheduledAtKst(item.scheduledAt)} · ${getScheduledJobStatusLabel(item.status)}`,
    "기존 예약을 수정·재개하거나 취소한 뒤 다시 시도해 주세요.",
  ].join(" ");
}

function formatScheduledAtKst(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(date);
}

function getScheduledJobStatusLabel(status: ScheduledNewsletterJobRecord["status"]): string {
  if (status === "pending") return "대기 중";
  if (status === "processing") return "처리 중";
  if (status === "paused") return "일시정지";
  if (status === "failed") return "실패";
  if (status === "sent") return "발송 완료";
  if (status === "skipped") return "건너뜀";
  return "취소";
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
