import { type NewsletterDocument } from "./types.js";

export function renderNewsletterHtml(
  document: NewsletterDocument,
): string {
  const introBlock = document.introText
    ? `<section class="copy-block"><h2>브리핑 메모</h2><p>${escapeHtml(document.introText)}</p></section>`
    : "";
  const outroBlock = document.outroText
    ? `<section class="copy-block outro"><h2>마무리</h2><p>${escapeHtml(document.outroText)}</p></section>`
    : "";
  const cards = document.items.map((item) => `
    <section class="bill-card">
      <div class="bill-head">
        <div>
          <p class="bill-number">${escapeHtml(item.billNo || "의안번호 미상")}</p>
          <h2>${escapeHtml(item.billName || "법안명 미상")}</h2>
        </div>
        <span class="stage">${escapeHtml(item.stageLabel)}</span>
      </div>
      <dl class="meta-grid">
        <div><dt>발의 의원</dt><dd>${escapeHtml(item.proposer || "미상")}</dd></div>
        <div><dt>소관 상임위</dt><dd>${escapeHtml(item.committee || "미상")}</dd></div>
        <div><dt>입법예고 종료일</dt><dd>${escapeHtml(item.noticeEndDate ?? "미상")}</dd></div>
        <div><dt>관련도</dt><dd>${escapeHtml(String(item.relevanceScore))}</dd></div>
      </dl>
      <div class="summary">
        <h3>주요 내용</h3>
        <p>${escapeHtml(item.summary || "상세 요약 정보가 아직 수집되지 않았습니다.")}</p>
      </div>
      ${item.detailUrl ? `<p class="link"><a href="${escapeAttribute(item.detailUrl)}">원문 보기</a></p>` : ""}
    </section>
  `).join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(document.subject)}</title>
  <style>
    body { margin: 0; background: #f3efe6; color: #14302b; font-family: "SUIT", "Pretendard Variable", "Noto Sans KR", sans-serif; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; }
    .hero { background: linear-gradient(135deg, #14302b, #245548); color: #fbf7ef; border-radius: 24px; padding: 28px; box-shadow: 0 20px 60px rgba(20, 48, 43, 0.16); }
    .hero h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.2; }
    .hero p { margin: 0; color: rgba(251, 247, 239, 0.85); }
    .meta-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0 24px; }
    .meta-box { background: rgba(251, 247, 239, 0.1); border: 1px solid rgba(251, 247, 239, 0.14); border-radius: 18px; padding: 14px 16px; }
    .meta-box dt { font-size: 12px; opacity: 0.75; margin-bottom: 6px; }
    .meta-box dd { margin: 0; font-size: 16px; font-weight: 700; }
    .copy-block { background: #fff8eb; border: 1px solid rgba(20, 48, 43, 0.08); border-radius: 22px; padding: 20px 22px; margin-top: 18px; box-shadow: 0 12px 28px rgba(20, 48, 43, 0.06); }
    .copy-block h2 { margin: 0 0 10px; font-size: 18px; }
    .copy-block p { margin: 0; line-height: 1.8; white-space: pre-line; color: #24423b; }
    .copy-block.outro { background: #f6f2e8; }
    .bill-card { background: #fffdf8; border: 1px solid rgba(20, 48, 43, 0.1); border-radius: 22px; padding: 22px; margin-top: 18px; box-shadow: 0 14px 38px rgba(20, 48, 43, 0.08); }
    .bill-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .bill-number { margin: 0 0 6px; font-size: 12px; color: #56716b; letter-spacing: 0.06em; text-transform: uppercase; }
    .bill-head h2 { margin: 0; font-size: 22px; line-height: 1.35; }
    .stage { display: inline-flex; align-items: center; background: #d5e8dd; color: #14302b; padding: 8px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; white-space: nowrap; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 18px 0 0; }
    .meta-grid dt { font-size: 12px; color: #6e837d; margin-bottom: 6px; }
    .meta-grid dd { margin: 0; font-size: 15px; font-weight: 600; }
    .summary { margin-top: 18px; padding: 16px 18px; background: #f6f2e8; border-radius: 16px; }
    .summary h3 { margin: 0 0 10px; font-size: 15px; }
    .summary p { margin: 0; line-height: 1.7; }
    .link { margin-top: 16px; }
    .link a { color: #1b6b5a; text-decoration: none; font-weight: 700; }
    .footer { margin-top: 24px; text-align: center; color: #687c76; font-size: 13px; }
    @media (max-width: 700px) {
      .wrap { padding: 18px 14px 32px; }
      .hero { padding: 22px; border-radius: 20px; }
      .hero h1 { font-size: 24px; }
      .bill-head { flex-direction: column; }
      .stage { white-space: normal; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <h1>${escapeHtml(document.subject)}</h1>
      <p>국회 입법예고 법안을 키워드와 기간 기준으로 정리한 브리핑입니다.</p>
      <dl class="meta-bar">
        <div class="meta-box"><dt>키워드</dt><dd>${escapeHtml(document.keyword ?? "없음")}</dd></div>
        <div class="meta-box"><dt>조회 기간</dt><dd>${escapeHtml(`${document.dateFrom} ~ ${document.dateTo}`)}</dd></div>
        <div class="meta-box"><dt>생성 시각</dt><dd>${escapeHtml(`${document.generatedAt} ${document.timeZone}`)}</dd></div>
        <div class="meta-box"><dt>포함 법안</dt><dd>${escapeHtml(String(document.items.length))}건</dd></div>
      </dl>
    </header>
    ${introBlock}
    ${cards}
    ${outroBlock}
    <p class="footer">Generated by assembly-api-mcp legislation newsletter prototype.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
