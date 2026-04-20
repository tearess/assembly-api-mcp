import { type LegislationItem } from "./types.js";

export interface LegislationPreviewSection {
  readonly title: string;
  readonly content: string;
}

export interface LegislationPreviewDetails {
  readonly billNo: string | null;
  readonly proposalDate: string | null;
  readonly noticeStatusLabel: string;
  readonly relevanceLabel: string;
  readonly summary: string;
  readonly proposalReason: string | null;
  readonly mainContent: string | null;
  readonly sections: readonly LegislationPreviewSection[];
}

export function buildLegislationPreview(item: LegislationItem): LegislationPreviewDetails {
  const raw = isRecord(item.raw) ? item.raw : {};
  const proposalReason = pickText(raw, [
    "RSN",
    "PPSL_RSON_CNTN",
    "PROPOSE_REASON",
    "PROPOSAL_REASON",
    "提案理由",
    "제안이유",
  ]);
  const mainContent = pickText(raw, [
    "DETAIL_CONTENT",
    "MAIN_CONTENT",
    "MAJOR_CONTENT",
    "DETAIL_CNTNT",
    "주요내용",
    "提案內容",
  ]);
  const summary = normalizeText(item.summary)
    ?? mainContent
    ?? proposalReason
    ?? "상세 요약 정보가 아직 수집되지 않았습니다.";
  const proposalDate = pickText(raw, ["PPSL_DT", "PROPOSE_DT", "PROPOS_DT"]);
  const sections = [
    buildSection("제안이유", proposalReason),
    buildSection("주요내용", mainContent),
    buildSection("심사 참고", buildReviewNote(raw)),
  ].filter((section): section is LegislationPreviewSection => Boolean(section));

  return {
    billNo: normalizeText(item.billNo),
    proposalDate,
    noticeStatusLabel: item.noticeStatus === "closed" ? "입법예고 종료" : "입법예고 진행중",
    relevanceLabel: formatRelevanceLabel(item.relevanceScore),
    summary,
    proposalReason,
    mainContent,
    sections,
  };
}

function buildSection(title: string, content: string | null): LegislationPreviewSection | null {
  const normalized = normalizeText(content);
  if (!normalized) {
    return null;
  }

  return {
    title,
    content: normalized,
  };
}

function buildReviewNote(raw: Record<string, unknown>): string | null {
  const parts = [
    pickText(raw, ["PROC_RESULT", "PROC_RSLT"]),
    pickText(raw, ["CMT_PROC_RESULT_CD", "CMT_PROC_RESULT"]),
    pickText(raw, ["LAW_PROC_RESULT_CD", "LAW_PROC_RESULT"]),
  ].filter(Boolean) as string[];

  if (parts.length === 0) {
    return null;
  }

  return Array.from(new Set(parts)).join(" · ");
}

function pickText(raw: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value !== "string") {
      continue;
    }

    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  return normalized ? normalized.slice(0, 1200) : null;
}

function formatRelevanceLabel(score: number): string {
  if (!Number.isFinite(score) || score <= 0) {
    return "관련도 정보 없음";
  }

  if (score >= 0.9) {
    return `매우 높음 (${score.toFixed(2)})`;
  }

  if (score >= 0.7) {
    return `높음 (${score.toFixed(2)})`;
  }

  if (score >= 0.4) {
    return `보통 (${score.toFixed(2)})`;
  }

  return `낮음 (${score.toFixed(2)})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
