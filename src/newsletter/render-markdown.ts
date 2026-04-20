import { type NewsletterDocument } from "./types.js";

export function renderNewsletterMarkdown(
  document: NewsletterDocument,
): string {
  const lines: string[] = [
    `# ${document.subject}`,
    "",
    `- 키워드: ${document.keyword ?? "없음"}`,
    ...(document.proposerFilter ? [`- 발의 의원 필터: ${document.proposerFilter}`] : []),
    ...(document.committeeFilter ? [`- 상임위 필터: ${document.committeeFilter}`] : []),
    `- 기간: ${document.dateFrom} ~ ${document.dateTo}`,
    `- 생성시각: ${document.generatedAt} ${document.timeZone}`,
    `- 포함 법안 수: ${document.items.length}건`,
    "",
  ];

  if (document.introText) {
    lines.push("## 브리핑 메모");
    lines.push("");
    lines.push(document.introText);
    lines.push("");
  }

  document.items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.billName}`);
    lines.push("");
    lines.push(`- 의안번호: ${item.billNo || "미상"}`);
    lines.push(`- 발의 의원: ${item.proposer || "미상"}`);
    lines.push(`- 소관 상임위: ${item.committee || "미상"}`);
    lines.push(`- 현재 단계: ${item.stageLabel}`);
    lines.push(`- 입법예고 종료일: ${item.noticeEndDate ?? "미상"}`);
    if (item.detailUrl) {
      lines.push(`- 원문 링크: ${item.detailUrl}`);
    }
    lines.push("");
    lines.push("### 요약");
    lines.push("");
    lines.push(item.summary || "상세 요약 정보가 아직 수집되지 않았습니다.");
    lines.push("");
  });

  if (document.outroText) {
    lines.push("## 마무리");
    lines.push("");
    lines.push(document.outroText);
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

export function buildMarkdownFilename(document: NewsletterDocument): string {
  const keyword = sanitizeFilename(document.keyword ?? "all");
  return `legislation-newsletter_${keyword}_${document.dateFrom}_${document.dateTo}.md`;
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "") || "all";
}
