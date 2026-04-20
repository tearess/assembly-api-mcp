import { randomUUID } from "node:crypto";
import { type AppConfig } from "../config.js";
import {
  SmtpNewsletterEmailSender,
  loadSmtpSettings,
  normalizeRecipients,
  type SmtpSettings,
} from "./email.js";
import { createLegislationEnrichmentService } from "./legislation-enricher.js";
import { createLegislationSearchService } from "./legislation-search.js";
import {
  RecipientGroupStore,
  RecipientStore,
  SearchPresetStore,
  SendLogStore,
  SentNewsletterStore,
} from "./persistence.js";
import { renderNewsletterHtml } from "./render-html.js";
import { renderNewsletterMarkdown } from "./render-markdown.js";
import {
  type LegislationItem,
  type LegislationSearchQuery,
  type LegislationSortBy,
  type NewsletterContentPayload,
  type NewsletterDocument,
  type NewsletterSendPayload,
  type NoticeScope,
  type SavedSearchPresetQuery,
  type SentNewsletterSnapshotRecord,
} from "./types.js";

export const EMPTY_NEWSLETTER_ERROR_MESSAGE = "뉴스레터에 포함할 법안이 없습니다.";

export interface NewsletterSendExecution {
  readonly document: NewsletterDocument;
  readonly html: string;
  readonly markdown: string;
  readonly result: {
    readonly sent: number;
    readonly failed: number;
    readonly failures: readonly { recipient: string; error: string }[];
  };
  readonly logs: Awaited<ReturnType<SendLogStore["appendLogs"]>>;
}

interface PreparedNewsletterSendOptions {
  readonly recipientStore?: Pick<RecipientStore, "upsertMany">;
  readonly snapshotStore?: Pick<SentNewsletterStore, "save">;
  readonly logStore?: Pick<SendLogStore, "appendLogs">;
  readonly sender?: Pick<SmtpNewsletterEmailSender, "send">;
  readonly jobId?: string;
  readonly smtpSettings?: SmtpSettings | null;
}

export function normalizeNewsletterContentPayload(
  input: unknown,
): NewsletterContentPayload {
  if (!isRecord(input)) {
    return {
      query: {},
      items: [],
      selectedBillIds: [],
      subject: null,
      introText: null,
      outroText: null,
      includeAllResults: false,
      onlyNewResults: false,
      excludeBillIds: [],
      recipientGroupId: null,
      recipientGroupName: null,
      searchPresetId: null,
      searchPresetName: null,
      subscriptionTemplateId: null,
      subscriptionTemplateName: null,
    };
  }

  return {
    query: toSearchQuery(input.query),
    items: Array.isArray(input.items)
      ? input.items.filter(isRecord).map((item) => normalizeLegislationItem(item))
      : [],
    selectedBillIds: Array.isArray(input.selectedBillIds)
      ? input.selectedBillIds.filter((item): item is string => typeof item === "string")
      : [],
    subject: nullableString(input.subject),
    introText: nullableString(input.introText),
    outroText: nullableString(input.outroText),
    includeAllResults: input.includeAllResults === true,
    onlyNewResults: input.onlyNewResults === true,
    excludeBillIds: Array.isArray(input.excludeBillIds)
      ? input.excludeBillIds.filter((item): item is string => typeof item === "string")
      : [],
    recipientGroupId: nullableString(input.recipientGroupId),
    recipientGroupName: nullableString(input.recipientGroupName),
    searchPresetId: nullableString(input.searchPresetId),
    searchPresetName: nullableString(input.searchPresetName),
    subscriptionTemplateId: nullableString(input.subscriptionTemplateId),
    subscriptionTemplateName: nullableString(input.subscriptionTemplateName),
  };
}

export function normalizeNewsletterSendPayload(
  input: unknown,
): NewsletterSendPayload {
  const payload = normalizeNewsletterContentPayload(input);

  return {
    ...payload,
    recipients: normalizeRecipients(isRecord(input) ? input.recipients : undefined),
  };
}

export async function buildNewsletterDocumentFromPayload(
  payload: NewsletterContentPayload,
  config: AppConfig,
): Promise<NewsletterDocument> {
  const resolvedPayload = await resolveNewsletterContentPayload(payload);
  const items = await resolveItems(resolvedPayload, config);
  if (items.length === 0) {
    throw new Error(EMPTY_NEWSLETTER_ERROR_MESSAGE);
  }

  const keyword = resolvedPayload.query.keyword?.trim() || null;
  const proposerFilter = resolvedPayload.query.proposerFilter?.trim() || null;
  const committeeFilter = resolvedPayload.query.committeeFilter?.trim() || null;
  const dateFrom = resolvedPayload.query.dateFrom ?? inferDateFromItems(items);
  const dateTo = resolvedPayload.query.dateTo ?? inferDateToItems(items);

  return {
    subject: normalizeSubject(
      resolvedPayload.subject,
      buildSubjectContext(keyword, proposerFilter, committeeFilter),
    ),
    keyword,
    proposerFilter,
    committeeFilter,
    dateFrom,
    dateTo,
    timeZone: "Asia/Seoul",
    generatedAt: formatNowKst(),
    introText: resolvedPayload.introText ?? null,
    outroText: resolvedPayload.outroText ?? null,
    items,
  };
}

export async function resolveNewsletterContentPayload(
  payload: NewsletterContentPayload,
  presetStore: Pick<SearchPresetStore, "get"> = new SearchPresetStore(),
): Promise<NewsletterContentPayload> {
  const presetId = payload.searchPresetId?.trim();
  if (!presetId) {
    return payload;
  }

  const preset = await presetStore.get(presetId);
  if (!preset) {
    return payload;
  }

  return {
    ...payload,
    searchPresetId: preset.id,
    searchPresetName: preset.name,
    query: mergeQueryWithSavedPreset(payload.query, preset.query),
  };
}

export async function resolveNewsletterSendPayload(
  payload: NewsletterSendPayload,
  presetStore: Pick<SearchPresetStore, "get"> = new SearchPresetStore(),
  recipientGroupStore: Pick<RecipientGroupStore, "get"> = new RecipientGroupStore(),
): Promise<NewsletterSendPayload> {
  const resolvedContent = await resolveNewsletterContentPayload(payload, presetStore);
  const groupId = payload.recipientGroupId?.trim();
  if (!groupId) {
    return {
      ...resolvedContent,
      recipients: payload.recipients,
    };
  }

  const group = await recipientGroupStore.get(groupId);
  if (!group) {
    return {
      ...resolvedContent,
      recipients: payload.recipients,
    };
  }

  return {
    ...resolvedContent,
    recipientGroupId: group.id,
    recipientGroupName: group.name,
    recipients: group.emails,
  };
}

export async function sendNewsletterFromPayload(
  payload: NewsletterSendPayload,
  config: AppConfig,
): Promise<NewsletterSendExecution> {
  const resolvedPayload = await resolveNewsletterSendPayload(payload);
  const document = await buildNewsletterDocumentFromPayload(resolvedPayload, config);
  const html = renderNewsletterHtml(document);
  const markdown = renderNewsletterMarkdown(document);
  return sendPreparedNewsletter(document, html, markdown, resolvedPayload.recipients);
}

export async function resendNewsletterFromSnapshot(
  snapshot: SentNewsletterSnapshotRecord,
  recipients: readonly string[],
  options: PreparedNewsletterSendOptions = {},
): Promise<NewsletterSendExecution> {
  return sendPreparedNewsletter(
    snapshot.document,
    snapshot.html,
    snapshot.markdown,
    recipients,
    options,
  );
}

export function isEmptyNewsletterError(error: unknown): boolean {
  return error instanceof Error && error.message === EMPTY_NEWSLETTER_ERROR_MESSAGE;
}

export async function sendPreparedNewsletter(
  document: NewsletterDocument,
  html: string,
  markdown: string,
  recipients: readonly string[],
  options: PreparedNewsletterSendOptions = {},
): Promise<NewsletterSendExecution> {
  const smtpSettings = options.smtpSettings === undefined
    ? loadSmtpSettings()
    : options.smtpSettings;
  const sender = options.sender ?? (
    smtpSettings
      ? new SmtpNewsletterEmailSender(smtpSettings)
      : null
  );
  if (!sender) {
    throw new Error(
      "SMTP 설정이 없습니다. NEWSLETTER_SMTP_HOST, PORT, USER, PASS, FROM_EMAIL을 설정해 주세요.",
    );
  }

  const result = await sender.send(recipients, document, html, markdown);
  const recipientStore = options.recipientStore ?? new RecipientStore();
  await recipientStore.upsertMany(recipients);
  const jobId = options.jobId?.trim() || randomUUID();
  let snapshotAvailable = false;
  const snapshotStore = options.snapshotStore ?? new SentNewsletterStore();
  try {
    await snapshotStore.save(jobId, document, html, markdown);
    snapshotAvailable = true;
  } catch {
    snapshotAvailable = false;
  }
  const logStore = options.logStore ?? new SendLogStore();
  const failures = new Map(
    result.failures.map((failure) => [failure.recipient.toLowerCase(), failure.error]),
  );
  const logs = await logStore.appendLogs(document, recipients, failures, {
    jobId,
    snapshotAvailable,
  });

  return {
    document,
    html,
    markdown,
    result,
    logs,
  };
}

async function resolveItems(
  payload: NewsletterContentPayload,
  config: AppConfig,
): Promise<readonly LegislationItem[]> {
  let items: LegislationItem[];

  if (payload.items.length > 0 && !payload.includeAllResults) {
    items = payload.items.map((item) => normalizeLegislationItem(item));
  } else {
    const searchService = createLegislationSearchService(config);
    const enrichmentService = createLegislationEnrichmentService(config);
    const result = await searchService.search(
      payload.includeAllResults
        ? {
            ...payload.query,
            page: 1,
            pageSize: config.apiResponse.maxPageSize,
          }
        : payload.query,
    );
    items = [...await enrichmentService.enrichItems(result.items)];
  }

  if (payload.selectedBillIds.length > 0) {
    const selectedBillIds = new Set(payload.selectedBillIds);
    items = items.filter((item) => selectedBillIds.has(item.billId));
  }

  if (Array.isArray(payload.excludeBillIds) && payload.excludeBillIds.length > 0) {
    const excludedBillIds = new Set(
      payload.excludeBillIds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    items = items.filter((item) => !excludedBillIds.has(item.billId));
  }

  return items;
}

function normalizeLegislationItem(
  input: Record<string, unknown> | LegislationItem,
): LegislationItem {
  const source = input as Record<string, unknown>;
  return {
    billId: asString(source.billId),
    billNo: asString(source.billNo),
    billName: asString(source.billName),
    proposer: asString(source.proposer),
    committee: asString(source.committee),
    noticeStatus: source.noticeStatus === "closed" ? "closed" : "active",
    billStage: nullableString(source.billStage),
    stageLabel: asString(source.stageLabel) || "입법예고 진행중",
    noticeEndDate: nullableString(source.noticeEndDate),
    summary: asString(source.summary),
    detailUrl: nullableString(source.detailUrl),
    relevanceScore: typeof source.relevanceScore === "number" ? source.relevanceScore : 1,
    raw: isRecord(source.raw) ? source.raw : {},
  };
}

function toSearchQuery(input: unknown): LegislationSearchQuery {
  if (!isRecord(input)) {
    return {};
  }

  return {
    keyword: nullableString(input.keyword) ?? undefined,
    proposerFilter: nullableString(input.proposerFilter) ?? undefined,
    committeeFilter: nullableString(input.committeeFilter) ?? undefined,
    datePreset: isDatePreset(input.datePreset) ? input.datePreset : undefined,
    dateFrom: nullableString(input.dateFrom) ?? undefined,
    dateTo: nullableString(input.dateTo) ?? undefined,
    noticeScope: isNoticeScope(input.noticeScope) ? input.noticeScope : undefined,
    sortBy: isSortBy(input.sortBy) ? input.sortBy : undefined,
    page: toOptionalNumber(input.page),
    pageSize: toOptionalNumber(input.pageSize),
  };
}

function normalizeSubject(
  value: string | null,
  contextLabel: string | null,
): string {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return `[입법예고 뉴스레터] ${(contextLabel ?? "주요")} 관련 법안 브리핑`;
}

function buildSubjectContext(
  keyword: string | null,
  proposerFilter: string | null,
  committeeFilter: string | null,
): string | null {
  return keyword || committeeFilter || proposerFilter || null;
}

function mergeQueryWithSavedPreset(
  query: LegislationSearchQuery,
  presetQuery: SavedSearchPresetQuery,
): LegislationSearchQuery {
  return {
    ...query,
    keyword: presetQuery.keyword ?? undefined,
    proposerFilter: presetQuery.proposerFilter ?? undefined,
    committeeFilter: presetQuery.committeeFilter ?? undefined,
    datePreset: presetQuery.datePreset,
    dateFrom: presetQuery.dateFrom ?? undefined,
    dateTo: presetQuery.dateTo ?? undefined,
    noticeScope: presetQuery.noticeScope,
    sortBy: presetQuery.sortBy,
    pageSize: typeof query.pageSize === "number" ? query.pageSize : presetQuery.pageSize,
  };
}

function inferDateFromItems(items: readonly LegislationItem[]): string {
  const dates = items
    .map((item) => item.noticeEndDate)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates[0] ?? formatDateOnly(new Date());
}

function inferDateToItems(items: readonly LegislationItem[]): string {
  const dates = items
    .map((item) => item.noticeEndDate)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates[dates.length - 1] ?? formatDateOnly(new Date());
}

function formatNowKst(): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(new Date()).replace(" ", " ");
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown): string | null {
  const stringValue = asString(value);
  return stringValue === "" ? null : stringValue;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isDatePreset(
  value: unknown,
): value is "6m" | "3m" | "1m" | "3w" | "2w" | "1w" | "custom" {
  return value === "6m"
    || value === "3m"
    || value === "1m"
    || value === "3w"
    || value === "2w"
    || value === "1w"
    || value === "custom";
}

function isNoticeScope(value: unknown): value is NoticeScope {
  return value === "active_only" || value === "include_closed";
}

function isSortBy(value: unknown): value is LegislationSortBy {
  return value === "relevance"
    || value === "notice_end_desc"
    || value === "notice_end_asc";
}
