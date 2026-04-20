import { type ApiResult, createApiClient } from "../api/client.js";
import { API_CODES } from "../api/codes.js";
import { type AppConfig } from "../config.js";
import { type LegislationItem } from "./types.js";

interface AssemblyApiLike {
  fetchOpenAssembly(
    apiCode: string,
    params?: Record<string, string | number>,
  ): Promise<ApiResult>;
}

export interface StageResolution {
  readonly billStage: string | null;
  readonly stageLabel: string;
  readonly reviewRows: readonly Record<string, unknown>[];
  readonly historyRows: readonly Record<string, unknown>[];
}

export interface InferBillStageInput {
  readonly detail?: Record<string, unknown> | undefined;
  readonly reviewRows?: readonly Record<string, unknown>[] | undefined;
  readonly historyRows?: readonly Record<string, unknown>[] | undefined;
}

export function createLegislationStageService(
  config: AppConfig,
): LegislationStageService {
  return new LegislationStageService(createApiClient(config));
}

export class LegislationStageService {
  constructor(private readonly api: AssemblyApiLike) {}

  async resolveStage(
    item: LegislationItem,
    detail?: Record<string, unknown>,
  ): Promise<StageResolution> {
    const [reviewRows, historyRows] = await Promise.all([
      this.fetchReviewRows(item),
      this.fetchHistoryRows(item),
    ]);

    const billStage = inferBillStage({ detail, reviewRows, historyRows });
    return {
      billStage,
      stageLabel: buildStageLabel(item.noticeStatus, billStage),
      reviewRows,
      historyRows,
    };
  }

  private async fetchReviewRows(
    item: LegislationItem,
  ): Promise<readonly Record<string, unknown>[]> {
    if (!item.billId && !item.billName) {
      return [];
    }

    try {
      const result = await this.api.fetchOpenAssembly(API_CODES.BILL_REVIEW, {
        ...(item.billId ? { BILL_ID: item.billId } : {}),
        ...(item.billName ? { BILL_NM: item.billName } : {}),
        pSize: 10,
      });
      return filterMatchingRows(result.rows, item);
    } catch {
      return [];
    }
  }

  private async fetchHistoryRows(
    item: LegislationItem,
  ): Promise<readonly Record<string, unknown>[]> {
    if (!item.billNo && !item.billName) {
      return [];
    }

    try {
      const result = await this.api.fetchOpenAssembly(API_CODES.BILL_RECEIVED, {
        ...(item.billNo ? { BILL_NO: item.billNo } : {}),
        ...(item.billName ? { BILL_NM: item.billName } : {}),
        pSize: 10,
      });
      return filterMatchingRows(result.rows, item);
    } catch {
      return [];
    }
  }
}

export function inferBillStage(
  input: InferBillStageInput,
): string | null {
  const detail = input.detail;
  const historyStage = inferStageFromHistoryRows(input.historyRows ?? []);
  const reviewStage = inferStageFromReviewRows(input.reviewRows ?? []);
  const detailStage = inferStageFromDetail(detail);

  return detailStage.finalStage
    ?? historyStage
    ?? reviewStage
    ?? detailStage.progressStage
    ?? null;
}

export function buildStageLabel(
  noticeStatus: "active" | "closed",
  billStage: string | null,
): string {
  const noticeLabel = noticeStatus === "active"
    ? "입법예고 진행중"
    : "입법예고 종료";

  if (!billStage) {
    return noticeLabel;
  }

  return `${noticeLabel} / ${billStage}`;
}

function inferStageFromDetail(
  detail: Record<string, unknown> | undefined,
): { finalStage: string | null; progressStage: string | null } {
  if (!detail) {
    return { finalStage: null, progressStage: null };
  }

  if (pickString(detail, "RGS_PROC_DT")) {
    return { finalStage: "공포", progressStage: null };
  }

  const processResult = pickString(detail, "PROC_RESULT_CD")
    ?? pickString(detail, "PROC_RESULT");
  const mappedProcessResult = mapFinalProcessResult(processResult);
  if (mappedProcessResult) {
    return { finalStage: mappedProcessResult, progressStage: null };
  }

  const lawResult = pickString(detail, "LAW_PROC_RESULT_CD");
  if (lawResult) {
    return { finalStage: null, progressStage: "법사위 심사" };
  }

  if (pickString(detail, "LAW_PRESENT_DT") || pickString(detail, "LAW_PROC_DT")) {
    return { finalStage: null, progressStage: "법사위 심사" };
  }

  const committeeResult = pickString(detail, "CMT_PROC_RESULT_CD");
  if (committeeResult) {
    return { finalStage: null, progressStage: "소관위 심사" };
  }

  if (pickString(detail, "CMT_PRESENT_DT") || pickString(detail, "CMT_PROC_DT")) {
    return { finalStage: null, progressStage: "소관위 심사" };
  }

  if (pickString(detail, "PROPOSE_DT")) {
    return { finalStage: null, progressStage: "접수" };
  }

  return { finalStage: null, progressStage: null };
}

function inferStageFromHistoryRows(
  rows: readonly Record<string, unknown>[],
): string | null {
  const latest = getLatestRow(rows, ["PROC_DT", "PPSL_DT"]);
  if (!latest) return null;

  const result = pickString(latest, "PROC_RSLT")
    ?? pickString(latest, "PROC_RESULT")
    ?? pickString(latest, "PROC_RESULT_CD");

  return mapFinalProcessResult(result);
}

function inferStageFromReviewRows(
  rows: readonly Record<string, unknown>[],
): string | null {
  const latest = getLatestRow(rows, ["PROC_DT", "PPSR_DT"]);
  if (!latest) return null;

  const committeeName = pickString(latest, "CMIT_NM")
    ?? pickString(latest, "COMMITTEE")
    ?? pickString(latest, "JRCMIT_NM");
  const result = pickString(latest, "PROC_RESULT_CD")
    ?? pickString(latest, "PROC_RESULT");

  if (committeeName && isJudiciaryCommittee(committeeName)) {
    return "법사위 심사";
  }

  if (result) {
    if (result.includes("심사") || result.includes("계류") || result.includes("가결")) {
      return "소관위 심사";
    }
  }

  if (committeeName) {
    return "소관위 심사";
  }

  return null;
}

function mapFinalProcessResult(
  value: string | undefined,
): string | null {
  if (!value) return null;
  if (value.includes("공포")) return "공포";
  if (value.includes("철회")) return "철회";
  if (value.includes("대안반영폐기") || value.includes("폐기")) return "폐기";
  if (value.includes("부결")) return "본회의 부결";
  if (value.includes("가결") || value.includes("원안")) return "본회의 의결";
  return null;
}

function filterMatchingRows(
  rows: readonly Record<string, unknown>[],
  item: LegislationItem,
): readonly Record<string, unknown>[] {
  const filtered = rows.filter((row) => {
    const billId = pickString(row, "BILL_ID");
    const billNo = pickString(row, "BILL_NO");
    const billName = pickString(row, "BILL_NM") ?? pickString(row, "BILL_NAME");

    if (item.billId && billId && item.billId === billId) return true;
    if (item.billNo && billNo && item.billNo === billNo) return true;
    if (item.billName && billName && item.billName === billName) return true;
    return false;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  return rows.length === 1 ? rows : [];
}

function getLatestRow(
  rows: readonly Record<string, unknown>[],
  dateKeys: readonly string[],
): Record<string, unknown> | undefined {
  return [...rows].sort((left, right) => {
    const leftDate = getComparableDate(left, dateKeys);
    const rightDate = getComparableDate(right, dateKeys);
    return rightDate.localeCompare(leftDate);
  })[0];
}

function getComparableDate(
  row: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = pickString(row, key);
    if (value) return value;
  }
  return "";
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

function isJudiciaryCommittee(value: string): boolean {
  return value.includes("법제사법") || value.includes("법사");
}
