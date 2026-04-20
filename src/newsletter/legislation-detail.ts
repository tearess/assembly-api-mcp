import { type ApiResult, getSharedApiClient } from "../api/client.js";
import { API_CODES, CURRENT_AGE } from "../api/codes.js";
import { type AppConfig } from "../config.js";
import {
  buildLegislationPreview,
  type LegislationPreviewDetails,
} from "./legislation-preview.js";
import { LegislationStageService } from "./legislation-stage.js";
import { type LegislationItem, type NoticeStatus } from "./types.js";

interface AssemblyApiLike {
  fetchOpenAssembly(
    apiCode: string,
    params?: Record<string, string | number>,
  ): Promise<ApiResult>;
}

export interface LegislationDetailEvent {
  readonly label: string;
  readonly date: string | null;
  readonly detail: string | null;
}

export interface LegislationDetailResult {
  readonly item: LegislationItem;
  readonly preview: LegislationPreviewDetails;
  readonly reviewEvents: readonly LegislationDetailEvent[];
  readonly historyEvents: readonly LegislationDetailEvent[];
}

export function createLegislationDetailService(
  config: AppConfig,
): LegislationDetailService {
  return new LegislationDetailService(
    getSharedApiClient(config, { cacheByBillId: true }),
  );
}

export class LegislationDetailService {
  private readonly stageService: LegislationStageService;

  constructor(private readonly api: AssemblyApiLike) {
    this.stageService = new LegislationStageService(api);
  }

  async getByBillId(
    billId: string,
    now: Date = new Date(),
    timeZone: string = "Asia/Seoul",
  ): Promise<LegislationDetailResult | null> {
    const normalizedBillId = billId.trim();
    if (!normalizedBillId) {
      return null;
    }

    const result = await this.api.fetchOpenAssembly(API_CODES.BILL_DETAIL, {
      BILL_ID: normalizedBillId,
      AGE: CURRENT_AGE,
    });
    const detail = result.rows[0];
    if (!detail) {
      return null;
    }

    const item = buildLegislationItemFromDetail(detail, now, timeZone);
    const stage = await this.stageService.resolveStage(item, detail);
    const enrichedItem: LegislationItem = {
      ...item,
      billStage: stage.billStage,
      stageLabel: stage.stageLabel,
      raw: { ...detail },
    };

    return {
      item: enrichedItem,
      preview: buildLegislationPreview(enrichedItem),
      reviewEvents: mapReviewEvents(stage.reviewRows),
      historyEvents: mapHistoryEvents(stage.historyRows),
    };
  }
}

export function buildLegislationItemFromDetail(
  detail: Record<string, unknown>,
  now: Date = new Date(),
  timeZone: string = "Asia/Seoul",
): LegislationItem {
  const billId = pickString(detail, "BILL_ID") ?? "unknown";
  const billNo = pickString(detail, "BILL_NO") ?? "";
  const billName = pickString(detail, "BILL_NAME")
    ?? pickString(detail, "BILL_NM")
    ?? "";
  const proposer = pickString(detail, "PROPOSER")
    ?? pickString(detail, "RST_PROPOSER")
    ?? "";
  const committee = pickString(detail, "COMMITTEE")
    ?? pickString(detail, "CURR_COMMITTEE")
    ?? pickString(detail, "COMMITTEE_NM")
    ?? pickString(detail, "JRCMIT_NM")
    ?? "";
  const detailUrl = pickString(detail, "DETAIL_LINK")
    ?? pickString(detail, "LINK_URL");
  const noticeEndDate = pickString(detail, "NOTI_ED_DT");
  const noticeStatus = resolveNoticeStatus(noticeEndDate, now, timeZone);

  return {
    billId,
    billNo,
    billName,
    proposer,
    committee,
    noticeStatus,
    billStage: null,
    stageLabel: noticeStatus === "closed" ? "입법예고 종료" : "입법예고 진행중",
    noticeEndDate: noticeEndDate ?? null,
    summary: buildSummary(detail) ?? "",
    detailUrl: detailUrl ?? null,
    relevanceScore: 1,
    raw: { ...detail },
  };
}

function mapReviewEvents(rows: readonly Record<string, unknown>[]): LegislationDetailEvent[] {
  return rows.map((row) => ({
    label: pickString(row, "CMIT_NM")
      ?? pickString(row, "COMMITTEE")
      ?? pickString(row, "JRCMIT_NM")
      ?? "심사 정보",
    date: pickString(row, "PROC_DT") ?? pickString(row, "PPSR_DT") ?? null,
    detail: pickString(row, "PROC_RESULT_CD")
      ?? pickString(row, "PROC_RESULT")
      ?? null,
  }));
}

function mapHistoryEvents(rows: readonly Record<string, unknown>[]): LegislationDetailEvent[] {
  return rows.map((row) => ({
    label: pickString(row, "PROC_RSLT")
      ?? pickString(row, "PROC_RESULT")
      ?? pickString(row, "PROC_RESULT_CD")
      ?? "접수/처리 이력",
    date: pickString(row, "PROC_DT") ?? pickString(row, "PPSL_DT") ?? null,
    detail: pickString(row, "BILL_KIND")
      ?? pickString(row, "PPSR_KIND")
      ?? null,
  }));
}

function buildSummary(detail: Record<string, unknown>): string | undefined {
  const segments = [
    pickString(detail, "DETAIL_CONTENT"),
    pickString(detail, "RSN"),
    pickString(detail, "PPSL_RSON_CNTN"),
  ].filter(Boolean) as string[];

  if (segments.length === 0) {
    return undefined;
  }

  return segments
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function resolveNoticeStatus(
  noticeEndDate: string | undefined,
  now: Date,
  timeZone: string,
): NoticeStatus {
  if (!noticeEndDate) {
    return "active";
  }

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return noticeEndDate < today ? "closed" : "active";
}

function pickString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = row[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
