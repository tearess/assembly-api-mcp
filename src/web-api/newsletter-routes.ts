import { type IncomingMessage, type ServerResponse } from "node:http";
import { type AppConfig } from "../config.js";
import { normalizeRecipients } from "../newsletter/email.js";
import {
  buildNewsletterDocumentFromPayload,
  normalizeNewsletterContentPayload,
  normalizeNewsletterSendPayload,
  resendNewsletterFromSnapshot,
  sendNewsletterFromPayload,
} from "../newsletter/delivery.js";
import { createLegislationEnrichmentService } from "../newsletter/legislation-enricher.js";
import { createLegislationSearchService } from "../newsletter/legislation-search.js";
import {
    RecipientStore,
    SearchPresetStore,
    ScheduledNewsletterJobStore,
    SentNewsletterStore,
    SendLogStore,
  } from "../newsletter/persistence.js";
import {
  buildMarkdownFilename,
  renderNewsletterMarkdown,
} from "../newsletter/render-markdown.js";
import { renderNewsletterHtml } from "../newsletter/render-html.js";
import {
  type LegislationSearchQuery,
  type LegislationSortBy,
  type NoticeScope,
  type ScheduledNewsletterRecurrence,
  type SavedSearchPresetQuery,
} from "../newsletter/types.js";
import { readJsonBody, sendHtml, sendJson, sendText } from "./http.js";
import { buildNewsletterAppHtml } from "../web-ui/newsletter-app.js";

export async function handleNewsletterRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: AppConfig,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;

  if (req.method === "GET" && pathname === "/newsletter") {
    sendHtml(res, 200, buildNewsletterAppHtml());
    return true;
  }

  if (req.method === "GET" && pathname === "/api/recipients") {
    try {
      const store = new RecipientStore();
      sendJson(res, 200, { items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/recipients") {
    try {
      const body = await readRequestBody(req);
      const recipients = normalizeRecipients(body.recipients ?? body.email);
      const store = new RecipientStore();
      await store.upsertMany(recipients);
      sendJson(res, 200, { items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname === "/api/recipients") {
    try {
      const email = requestUrl.searchParams.get("email");
      if (!email) {
        throw new Error("삭제할 이메일이 필요합니다.");
      }
      const store = new RecipientStore();
      const deleted = await store.delete(email);
      sendJson(res, 200, { deleted, items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "GET" && pathname === "/api/newsletter/send-logs") {
    try {
      const store = new SendLogStore();
      const limit = Number.parseInt(requestUrl.searchParams.get("limit") ?? "20", 10);
      sendJson(res, 200, {
        items: await store.list(Number.isInteger(limit) ? limit : 20),
      });
    } catch (error: unknown) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "GET" && pathname === "/api/newsletter/send-log-artifact") {
    try {
      const jobId = requestUrl.searchParams.get("jobId") ?? "";
      const format = (requestUrl.searchParams.get("format") ?? "html").trim().toLowerCase();
      if (!jobId.trim()) {
        throw new Error("조회할 발송 로그 jobId가 필요합니다.");
      }

      const store = new SentNewsletterStore();
      const snapshot = await store.get(jobId);
      if (!snapshot) {
        sendJson(res, 404, { error: "발송 스냅샷을 찾지 못했습니다." });
        return true;
      }

      if (format === "markdown") {
        sendText(res, 200, snapshot.markdown, {
          "Content-Disposition": `attachment; filename="${buildMarkdownFilename(snapshot.document)}"`,
        });
        return true;
      }

      sendHtml(res, 200, snapshot.html);
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/newsletter/send-log-resend") {
    try {
      const body = await readRequestBody(req);
      const jobId = asString(body.jobId);
      if (!jobId) {
        throw new Error("재전송할 발송 로그 jobId가 필요합니다.");
      }

      const recipients = normalizeRecipients(body.recipients);
      const snapshotStore = new SentNewsletterStore();
      const snapshot = await snapshotStore.get(jobId);
      if (!snapshot) {
        sendJson(res, 404, { error: "재전송할 발송 스냅샷을 찾지 못했습니다." });
        return true;
      }

      const execution = await resendNewsletterFromSnapshot(snapshot, recipients);
      sendJson(res, 200, { ...execution.result, logs: execution.logs });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "GET" && pathname === "/api/newsletter/schedules") {
    try {
      const store = new ScheduledNewsletterJobStore();
      const limit = Number.parseInt(requestUrl.searchParams.get("limit") ?? "20", 10);
      sendJson(res, 200, {
        items: await store.list(Number.isInteger(limit) ? limit : 20),
      });
    } catch (error: unknown) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/newsletter/schedules") {
    try {
      const body = await readRequestBody(req);
      const scheduledAt = asString(body.scheduledAt);
      const recurrence = toScheduledRecurrence(body.recurrence);
      const payload = normalizeNewsletterSendPayload(body.payload);
      const store = new ScheduledNewsletterJobStore();
      await store.create(payload, scheduledAt, recurrence);
      sendJson(res, 200, {
        items: await store.list(),
      });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname === "/api/newsletter/schedules") {
    try {
      const id = requestUrl.searchParams.get("id");
      if (!id) {
        throw new Error("취소할 예약 id가 필요합니다.");
      }
      const store = new ScheduledNewsletterJobStore();
      const cancelled = await store.cancel(id);
      sendJson(res, 200, {
        cancelled,
        items: await store.list(),
      });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "GET" && pathname === "/api/search-presets") {
    try {
      const store = new SearchPresetStore();
      sendJson(res, 200, { items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/search-presets") {
    try {
      const body = await readRequestBody(req);
      const store = new SearchPresetStore();
      await store.upsert(asString(body.name), toSavedSearchPresetQuery(body.query));
      sendJson(res, 200, { items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname === "/api/search-presets") {
    try {
      const id = requestUrl.searchParams.get("id");
      if (!id) {
        throw new Error("삭제할 preset id가 필요합니다.");
      }
      const store = new SearchPresetStore();
      const deleted = await store.delete(id);
      sendJson(res, 200, { deleted, items: await store.list() });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/legislation/search") {
    try {
      const body = await readJsonBody(req);
      const query = toSearchQuery(body);
      const searchService = createLegislationSearchService(config);
      const enrichmentService = createLegislationEnrichmentService(config);
      const result = await searchService.search(query);
      const enrichedItems = await enrichmentService.enrichItems(result.items);

      sendJson(res, 200, {
        ...result,
        items: enrichedItems,
      });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/newsletter/preview") {
    try {
      const body = await readRequestBody(req);
      const payload = normalizeNewsletterContentPayload(body);
      const document = await buildNewsletterDocumentFromPayload(payload, config);
      sendJson(res, 200, { html: renderNewsletterHtml(document) });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/newsletter/markdown") {
    try {
      const body = await readRequestBody(req);
      const payload = normalizeNewsletterContentPayload(body);
      const document = await buildNewsletterDocumentFromPayload(payload, config);
      const markdown = renderNewsletterMarkdown(document);
      const filename = buildMarkdownFilename(document);
      sendText(res, 200, markdown, {
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/newsletter/send") {
    try {
      const body = await readRequestBody(req);
      const payload = normalizeNewsletterSendPayload(body);
      const execution = await sendNewsletterFromPayload(payload, config);
      sendJson(res, 200, { ...execution.result, logs: execution.logs });
    } catch (error: unknown) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  return false;
}

function toSearchQuery(input: unknown): LegislationSearchQuery {
  if (!isRecord(input)) {
    return {};
  }

  return {
    keyword: nullableString(input.keyword) ?? undefined,
    datePreset: isDatePreset(input.datePreset) ? input.datePreset : undefined,
    dateFrom: nullableString(input.dateFrom) ?? undefined,
    dateTo: nullableString(input.dateTo) ?? undefined,
    noticeScope: isNoticeScope(input.noticeScope) ? input.noticeScope : undefined,
    sortBy: isSortBy(input.sortBy) ? input.sortBy : undefined,
    page: toOptionalNumber(input.page),
    pageSize: toOptionalNumber(input.pageSize),
  };
}

function toSavedSearchPresetQuery(input: unknown): SavedSearchPresetQuery {
  const query = toSearchQuery(input);
  const isCustom = query.datePreset === "custom"
    || query.dateFrom !== undefined
    || query.dateTo !== undefined;

  return {
    keyword: query.keyword?.trim() || null,
    datePreset: isCustom ? "custom" : query.datePreset ?? "1m",
    dateFrom: isCustom ? query.dateFrom?.trim() || null : null,
    dateTo: isCustom ? query.dateTo?.trim() || null : null,
    noticeScope: query.noticeScope ?? "include_closed",
    sortBy: query.sortBy ?? "relevance",
    pageSize: toPresetPageSize(query.pageSize),
  };
}

function toScheduledRecurrence(value: unknown): ScheduledNewsletterRecurrence {
  if (value === "daily" || value === "weekly") {
    return value;
  }
  return "once";
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

function toPresetPageSize(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return 20;
  }
  return Math.min(value, 100);
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

async function readRequestBody(
  req: IncomingMessage,
): Promise<Record<string, unknown>> {
  const body = await readJsonBody(req);
  if (!isRecord(body)) {
    throw new Error("요청 본문이 올바르지 않습니다.");
  }
  return body;
}
