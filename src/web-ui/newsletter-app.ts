export function buildNewsletterAppHtml(): string {
  return String.raw`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>입법예고 뉴스레터 스튜디오</title>
  <style>
    :root {
      --paper: #f4efe4;
      --ink: #18352f;
      --muted: #5f766f;
      --panel: rgba(255, 252, 246, 0.82);
      --panel-strong: #fffaf0;
      --line: rgba(24, 53, 47, 0.12);
      --accent: #0f7662;
      --accent-2: #d98d3f;
      --accent-soft: rgba(15, 118, 98, 0.08);
      --danger: #b74b34;
      --shadow: 0 18px 50px rgba(24, 53, 47, 0.12);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "SUIT", "Pretendard Variable", "Noto Sans KR", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(217, 141, 63, 0.18), transparent 24%),
        radial-gradient(circle at bottom right, rgba(15, 118, 98, 0.16), transparent 26%),
        linear-gradient(180deg, #efe8db 0%, #f7f3ea 100%);
    }

    .shell {
      max-width: 1440px;
      margin: 0 auto;
      padding: 22px 18px 28px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 18px;
      margin-bottom: 18px;
    }

    .hero-card,
    .hero-side,
    .panel,
    .preview-card,
    .composer-card {
      background: var(--panel);
      backdrop-filter: blur(18px);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }

    .hero-card {
      padding: 28px;
      background:
        linear-gradient(140deg, rgba(24, 53, 47, 0.96), rgba(16, 94, 78, 0.92)),
        var(--panel);
      color: #fffaf0;
      position: relative;
      overflow: hidden;
    }

    .hero-card::after {
      content: "";
      position: absolute;
      right: -72px;
      top: -64px;
      width: 220px;
      height: 220px;
      border-radius: 999px;
      background: rgba(217, 141, 63, 0.18);
      filter: blur(2px);
    }

    .hero-card h1 {
      margin: 0;
      max-width: 9.5em;
      font-family: "Iowan Old Style", "Nanum Myeongjo", serif;
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.05;
      letter-spacing: -0.03em;
    }

    .hero-card p {
      margin: 14px 0 0;
      max-width: 42rem;
      color: rgba(255, 250, 240, 0.82);
      line-height: 1.7;
      font-size: 0.98rem;
    }

    .hero-side {
      padding: 22px;
      display: grid;
      gap: 12px;
      align-content: start;
    }

    .mini-stat {
      background: rgba(255, 250, 240, 0.78);
      border: 1px solid rgba(24, 53, 47, 0.08);
      border-radius: 18px;
      padding: 16px;
    }

    .mini-stat .label {
      color: var(--muted);
      font-size: 0.8rem;
      margin-bottom: 6px;
    }

    .mini-stat .value {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
      gap: 18px;
    }

    .left-stack,
    .right-stack {
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .panel,
    .preview-card,
    .composer-card {
      padding: 22px;
    }

    .section-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .section-head h2,
    .section-head h3 {
      margin: 0;
      font-size: 1.15rem;
      line-height: 1.3;
    }

    .subtle {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1.4fr repeat(2, minmax(140px, 0.5fr)) auto;
      gap: 12px;
      align-items: end;
    }

    label {
      display: grid;
      gap: 8px;
      font-size: 0.88rem;
      color: var(--muted);
    }

    input,
    select,
    button,
    textarea {
      font: inherit;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid rgba(24, 53, 47, 0.14);
      background: rgba(255, 251, 244, 0.95);
      color: var(--ink);
      border-radius: 16px;
      padding: 13px 14px;
      outline: none;
      transition: border-color .2s ease, transform .2s ease;
    }

    input:focus,
    textarea:focus {
      border-color: rgba(15, 118, 98, 0.5);
      transform: translateY(-1px);
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(160px, 220px));
      gap: 12px;
      margin-top: 14px;
    }

    .saved-preset-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      margin-top: 14px;
      align-items: end;
    }

    .saved-preset-list {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .saved-preset-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(255, 250, 242, 0.88);
      border: 1px solid rgba(24, 53, 47, 0.08);
    }

    .saved-preset-item strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.94rem;
    }

    .saved-preset-head {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .saved-preset-meta {
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.5;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      border: 1px solid rgba(24, 53, 47, 0.08);
      background: rgba(24, 53, 47, 0.06);
      color: var(--ink);
    }

    .status-badge.active {
      background: rgba(15, 118, 98, 0.14);
      color: #0b5a4b;
    }

    .status-badge.warning {
      background: rgba(217, 141, 63, 0.16);
      color: #8a4f16;
    }

    .status-badge.danger {
      background: rgba(183, 75, 52, 0.14);
      color: #97341f;
    }

    .status-badge.muted {
      background: rgba(95, 118, 111, 0.12);
      color: #4f6660;
    }

    .subscription-filter-meta {
      margin-top: 10px;
    }

    .saved-preset-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .load-preset-btn {
      background: rgba(15, 118, 98, 0.12);
      color: var(--accent);
    }

    .preset-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .preset-btn,
    .ghost-btn,
    .primary-btn,
    .accent-btn,
    .danger-btn {
      border: none;
      border-radius: 999px;
      padding: 11px 16px;
      cursor: pointer;
      font-weight: 700;
      transition: transform .18s ease, filter .18s ease, background .18s ease;
    }

    .preset-btn:hover,
    .ghost-btn:hover,
    .primary-btn:hover,
    .accent-btn:hover,
    .danger-btn:hover {
      transform: translateY(-1px);
      filter: saturate(1.04);
    }

    .preset-btn {
      background: rgba(24, 53, 47, 0.06);
      color: var(--ink);
    }

    .preset-btn.active {
      background: var(--accent);
      color: #f8faf7;
    }

    .primary-btn {
      background: var(--accent);
      color: #f8faf7;
      min-width: 108px;
    }

    .accent-btn {
      background: var(--accent-2);
      color: #fff9f2;
    }

    .ghost-btn {
      background: rgba(24, 53, 47, 0.06);
      color: var(--ink);
    }

    .danger-btn {
      background: rgba(183, 75, 52, 0.1);
      color: var(--danger);
    }

    button:disabled {
      opacity: 0.48;
      cursor: not-allowed;
      transform: none;
      filter: none;
    }

    .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--panel-strong);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 860px;
    }

    th,
    td {
      padding: 14px 12px;
      border-bottom: 1px solid rgba(24, 53, 47, 0.08);
      text-align: left;
      vertical-align: top;
      font-size: 0.92rem;
    }

    th {
      background: rgba(15, 118, 98, 0.06);
      color: var(--muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tbody tr {
      cursor: pointer;
      transition: background .16s ease;
    }

    tbody tr:hover {
      background: var(--accent-soft);
    }

    tbody tr.active {
      background: rgba(217, 141, 63, 0.12);
    }

    .stage-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(15, 118, 98, 0.1);
      color: var(--accent);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .actions-row {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .result-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
    }

    .page-indicator {
      color: var(--muted);
      font-size: 0.88rem;
      font-weight: 700;
    }

    .preview-card {
      min-height: 280px;
    }

    .preview-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin: 16px 0 18px;
    }

    .preview-box {
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(15, 118, 98, 0.06);
      border: 1px solid rgba(15, 118, 98, 0.08);
    }

    .preview-box .label {
      color: var(--muted);
      font-size: 0.75rem;
      margin-bottom: 6px;
    }

    .preview-box .value {
      font-weight: 700;
      line-height: 1.5;
    }

    .summary-block {
      border-radius: 18px;
      padding: 18px;
      background: rgba(255, 250, 242, 0.96);
      border: 1px solid rgba(24, 53, 47, 0.08);
      line-height: 1.7;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }

    .summary-card {
      display: grid;
      gap: 6px;
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(24, 53, 47, 0.05);
      border: 1px solid rgba(24, 53, 47, 0.08);
    }

    .summary-kicker {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .summary-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--ink);
    }

    .summary-note {
      color: var(--muted);
      font-size: 0.8rem;
      line-height: 1.45;
    }

    .summary-empty {
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 14px;
    }

    .recipient-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin-bottom: 12px;
    }

    .schedule-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(120px, 160px) minmax(180px, 220px) auto auto;
      gap: 10px;
      align-items: end;
      margin-top: 14px;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 24px;
      margin-bottom: 14px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(24, 53, 47, 0.08);
      color: var(--ink);
      font-size: 0.85rem;
    }

    .chip button {
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      padding: 0;
      font-size: 0.85rem;
    }

    .log-list {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .log-item {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(24, 53, 47, 0.05);
      border: 1px solid rgba(24, 53, 47, 0.08);
    }

    .log-item strong {
      font-size: 0.9rem;
    }

    .log-meta {
      color: var(--muted);
      font-size: 0.8rem;
      line-height: 1.5;
    }

    .log-status {
      font-size: 0.8rem;
      font-weight: 700;
    }

    .log-status.sent {
      color: var(--accent);
    }

    .log-status.pending,
    .log-status.processing {
      color: var(--accent-2);
    }

    .log-status.paused,
    .log-status.skipped,
    .log-status.cancelled {
      color: var(--muted);
    }

    .log-status.failed {
      color: var(--danger);
    }

    .status-line {
      min-height: 24px;
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .status-line.error {
      color: var(--danger);
    }

    .status-line.success {
      color: var(--accent);
    }

    .modal {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(12, 24, 22, 0.48);
      backdrop-filter: blur(8px);
    }

    .modal.open {
      display: flex;
    }

    .modal-card {
      width: min(980px, 100%);
      max-height: 84vh;
      overflow: hidden;
      background: #fffdf8;
      border-radius: 24px;
      box-shadow: 0 28px 80px rgba(12, 24, 22, 0.28);
      border: 1px solid rgba(24, 53, 47, 0.1);
      display: grid;
      grid-template-rows: auto 1fr;
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid rgba(24, 53, 47, 0.08);
    }

    .modal-body {
      overflow: auto;
      padding: 0;
    }

    iframe {
      width: 100%;
      height: 70vh;
      border: none;
      background: #fffdf8;
    }

    @media (max-width: 1120px) {
      .hero,
      .layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 780px) {
      .shell { padding: 14px 12px 20px; }
      .hero-card,
      .hero-side,
      .panel,
      .preview-card,
      .composer-card { border-radius: 20px; }
      .form-grid { grid-template-columns: 1fr; }
      .filter-row { grid-template-columns: 1fr; }
      .saved-preset-row { grid-template-columns: 1fr; }
      .recipient-row { grid-template-columns: 1fr; }
      .schedule-row { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: 1fr; }
      .actions-row { display: grid; grid-template-columns: 1fr; }
      .saved-preset-actions { width: 100%; display: grid; grid-template-columns: 1fr; }
      .primary-btn,
      .accent-btn,
      .ghost-btn,
      .danger-btn { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="hero-card">
        <h1>입법예고 뉴스레터 스튜디오</h1>
        <p>키워드와 기간을 입력하면 관련 입법예고 법안을 정리하고, 같은 결과를 HTML 이메일과 Markdown으로 한 번에 내보낼 수 있습니다.</p>
      </div>
      <aside class="hero-side">
        <div class="mini-stat">
          <div class="label">기본 검색 범위</div>
          <div class="value">최근 1개월</div>
        </div>
        <div class="mini-stat">
          <div class="label">현재 모드</div>
          <div class="value">수동 발송 · 다중 수신자</div>
        </div>
        <div class="mini-stat">
          <div class="label">접속 경로</div>
          <div class="value">HTTP 모드 /newsletter</div>
        </div>
      </aside>
    </section>

    <section class="layout">
      <div class="left-stack">
        <section class="panel">
          <div class="section-head">
            <div>
              <h2>검색 조건</h2>
              <div class="subtle">키워드와 기간을 정하면 해당 범위의 입법예고를 검색합니다. 기간을 비워두면 최근 1개월이 자동 적용됩니다.</div>
            </div>
          </div>
          <div class="form-grid">
            <label>
              키워드
              <input id="keywordInput" type="text" placeholder="예: 인공지능, 보건의료, 플랫폼 노동">
            </label>
            <label>
              시작일
              <input id="dateFromInput" type="date">
            </label>
            <label>
              종료일
              <input id="dateToInput" type="date">
            </label>
            <button id="searchBtn" class="primary-btn" type="button">검색</button>
          </div>
          <div class="preset-row" id="presetRow">
            <button class="preset-btn" data-preset="6m" type="button">6개월</button>
            <button class="preset-btn" data-preset="3m" type="button">3개월</button>
            <button class="preset-btn active" data-preset="1m" type="button">1개월</button>
            <button class="preset-btn" data-preset="3w" type="button">3주</button>
            <button class="preset-btn" data-preset="2w" type="button">2주</button>
            <button class="preset-btn" data-preset="1w" type="button">1주</button>
            <button class="preset-btn" data-preset="custom" type="button">직접 지정</button>
          </div>
          <div class="filter-row">
            <label>
              공고 범위
              <select id="noticeScopeSelect">
                <option value="include_closed">진행중 + 종료 포함</option>
                <option value="active_only">진행중만</option>
              </select>
            </label>
            <label>
              정렬 방식
              <select id="sortBySelect">
                <option value="relevance">관련도 순</option>
                <option value="notice_end_desc">종료일 최신순</option>
                <option value="notice_end_asc">종료일 오래된순</option>
              </select>
            </label>
            <label>
              페이지 크기
              <select id="pageSizeSelect">
                <option value="10">10건</option>
                <option value="20" selected>20건</option>
                <option value="50">50건</option>
              </select>
            </label>
          </div>
          <div class="saved-preset-row">
            <label>
              검색 preset 이름
              <input id="presetNameInput" type="text" placeholder="예: AI 최근 1개월">
            </label>
            <button id="savePresetBtn" class="accent-btn" type="button">현재 조건 저장</button>
          </div>
          <div class="saved-preset-list" id="savedSearchList">
            <span class="subtle">저장된 검색 preset이 없습니다.</span>
          </div>
          <div class="status-line" id="searchStatus"></div>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <h2>검색 결과</h2>
              <div class="subtle" id="resultMeta">검색 전입니다.</div>
            </div>
            <div class="actions-row">
              <button id="selectAllBtn" class="ghost-btn" type="button">전체 선택</button>
              <button id="clearSelectionBtn" class="ghost-btn" type="button">선택 해제</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 48px;">선택</th>
                  <th>법안 제목</th>
                  <th>발의 의원</th>
                  <th>상임위</th>
                  <th>현재 단계</th>
                  <th>종료일</th>
                </tr>
              </thead>
              <tbody id="resultsBody">
                <tr><td colspan="6" class="subtle">검색 결과가 여기에 표시됩니다.</td></tr>
              </tbody>
            </table>
          </div>
          <div class="result-foot">
            <div class="page-indicator" id="pageIndicator">1 / 1 페이지</div>
            <div class="actions-row" style="margin-top: 0;">
              <button id="prevPageBtn" class="ghost-btn" type="button">이전 페이지</button>
              <button id="nextPageBtn" class="ghost-btn" type="button">다음 페이지</button>
            </div>
          </div>
        </section>
      </div>

      <div class="right-stack">
        <section class="preview-card">
          <div class="section-head">
            <div>
              <h3>상세 미리보기</h3>
              <div class="subtle">리스트에서 법안을 클릭하면 상세 정보가 표시됩니다.</div>
            </div>
          </div>
          <div id="previewEmpty" class="subtle">아직 선택된 법안이 없습니다.</div>
          <div id="previewContent" hidden>
            <h3 id="previewTitle"></h3>
            <div class="preview-meta">
              <div class="preview-box"><div class="label">발의 의원</div><div class="value" id="previewProposer"></div></div>
              <div class="preview-box"><div class="label">소관 상임위</div><div class="value" id="previewCommittee"></div></div>
              <div class="preview-box"><div class="label">현재 단계</div><div class="value" id="previewStage"></div></div>
              <div class="preview-box"><div class="label">입법예고 종료일</div><div class="value" id="previewEndDate"></div></div>
            </div>
            <div class="summary-block" id="previewSummary"></div>
            <p class="subtle" style="margin-top: 14px;">
              <a id="previewLink" href="#" target="_blank" rel="noreferrer">원문 보기</a>
            </p>
          </div>
        </section>

        <section class="composer-card">
          <div class="section-head">
            <div>
              <h3>발송 및 저장</h3>
              <div class="subtle">이메일 주소를 여러 개 추가하고, 전체 또는 선택 항목 기준으로 발송/저장할 수 있습니다.</div>
            </div>
          </div>
          <div class="summary-grid" id="operationalSummaryGrid"></div>
          <div class="saved-preset-actions" style="justify-content: flex-start; margin-top: 12px;">
            <button id="exportSettingsBtn" class="ghost-btn" type="button">설정 백업</button>
            <button id="importSettingsBtn" class="ghost-btn" type="button">설정 복원</button>
          </div>
          <input id="settingsImportInput" type="file" accept=".json,application/json" hidden>
          <div class="subtle" style="margin-top: 8px;">
            수신자, 수신자 그룹, 검색 preset, 구독 템플릿을 JSON으로 백업하거나 복원합니다. 예약 발송과 로그는 포함되지 않습니다.
          </div>

          <div class="recipient-row">
            <input id="recipientInput" type="email" placeholder="recipient@example.com">
            <button id="addRecipientBtn" class="accent-btn" type="button">이메일 추가</button>
          </div>
          <div class="chip-list" id="recipientList"></div>
          <div class="saved-preset-row">
            <label>
              수신자 그룹 이름
              <input id="groupNameInput" type="text" placeholder="예: 정책팀 전체">
            </label>
            <button id="saveRecipientGroupBtn" class="ghost-btn" type="button">현재 수신자 그룹 저장</button>
          </div>
          <div class="saved-preset-list" id="savedRecipientGroupList">
            <span class="subtle">저장된 수신자 그룹이 없습니다.</span>
          </div>
          <label>
            구독/예약 수신자 그룹 연결
            <select id="subscriptionRecipientGroupSelect">
              <option value="">현재 수신자 목록 스냅샷 사용</option>
            </select>
          </label>

          <label>
            메일 제목
            <input id="subjectInput" type="text" placeholder="[입법예고 뉴스레터] 키워드 브리핑">
          </label>

          <label>
            브리핑 메모
            <textarea id="introInput" rows="4" placeholder="예: 이번 주에는 인공지능 관련 입법예고 중 산업 진흥과 안전성 기준 정비에 초점을 맞춘 법안을 정리했습니다."></textarea>
          </label>

          <label>
            마무리 문구
            <textarea id="outroInput" rows="3" placeholder="예: 관심 법안이 있으면 회신해 주세요. 원문 검토가 필요한 안건은 별도 브리핑으로 이어가겠습니다."></textarea>
          </label>

          <div class="actions-row">
            <button id="previewBtn" class="ghost-btn" type="button">HTML 미리보기</button>
            <button id="sendSelectedBtn" class="primary-btn" type="button">선택 항목 이메일 발송</button>
            <button id="sendAllBtn" class="primary-btn" type="button">전체 결과 이메일 발송</button>
            <button id="downloadSelectedBtn" class="accent-btn" type="button">선택 항목 Markdown 저장</button>
            <button id="downloadAllBtn" class="accent-btn" type="button">전체 결과 Markdown 저장</button>
          </div>
          <div class="schedule-row">
            <label>
              예약 발송 시각
              <input id="scheduleAtInput" type="datetime-local">
            </label>
            <label>
              반복 주기
              <select id="scheduleRecurrenceSelect">
                <option value="once">한 번</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
              </select>
            </label>
            <label>
              전체 결과 예약 기준
              <select id="schedulePresetSelect">
                <option value="">현재 검색 조건</option>
              </select>
            </label>
            <button id="scheduleSelectedBtn" class="ghost-btn" type="button">선택 항목 예약</button>
            <button id="scheduleAllBtn" class="ghost-btn" type="button">전체 결과 예약</button>
          </div>
          <label style="display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; color: #395954; font-size: 0.94rem;">
            <input id="scheduleOnlyNewInput" type="checkbox">
            반복 예약에서는 새로 발견된 법안만 발송
          </label>
          <div class="saved-preset-row">
            <label>
              구독 템플릿 이름
              <input id="subscriptionNameInput" type="text" placeholder="예: AI 정책 브리핑 구독">
            </label>
            <button id="saveSubscriptionBtn" class="accent-btn" type="button">현재 설정 저장</button>
          </div>
          <div class="saved-preset-row">
            <label>
              구독 템플릿 찾기
              <input id="subscriptionFilterInput" type="text" placeholder="이름, 키워드, 메일 제목으로 찾기">
            </label>
            <label>
              템플릿 상태
              <select id="subscriptionFilterSelect">
                <option value="all">전체</option>
                <option value="active">활성 예약 있음</option>
                <option value="attention">주의 필요</option>
                <option value="history">이력만 있음</option>
                <option value="no_schedule">예약 없음</option>
              </select>
            </label>
          </div>
          <div class="subtle subscription-filter-meta" id="subscriptionFilterMeta">구독 템플릿을 불러오는 중입니다.</div>
          <div class="saved-preset-list" id="savedSubscriptionList">
            <span class="subtle">저장된 구독 템플릿이 없습니다.</span>
          </div>
          <div class="status-line" id="composerStatus"></div>
          <div class="log-list" id="scheduleList">
            <span class="subtle">예약 발송 목록을 불러오는 중입니다.</span>
          </div>
          <div class="section-head" style="margin-top: 16px;">
            <div>
              <h3 style="margin-bottom: 4px;">최근 예약 실행 이력</h3>
              <div class="subtle">성공, 건너뜀, 실패 기록을 최근 순으로 확인합니다.</div>
            </div>
          </div>
          <div class="saved-preset-row">
            <label>
              예약 실행 이력 찾기
              <input id="scheduleRunSearchInput" type="text" placeholder="제목, 키워드, 메시지로 찾기">
            </label>
            <label>
              실행 결과
              <select id="scheduleRunStatusSelect">
                <option value="all">전체</option>
                <option value="sent">발송 완료</option>
                <option value="skipped">건너뜀</option>
                <option value="failed">발송 실패</option>
              </select>
            </label>
          </div>
          <div class="subtle" id="scheduleRunFilterMeta">예약 실행 이력을 불러오는 중입니다.</div>
          <div class="saved-preset-actions" style="justify-content: flex-start; margin-top: 10px;">
            <button id="downloadScheduleRunsCsvBtn" class="ghost-btn" type="button">현재 보기 CSV 저장</button>
          </div>
          <div class="saved-preset-actions" id="scheduleRunFilterBar" style="justify-content: flex-start;" hidden></div>
          <div class="log-list" id="scheduleRunList">
            <span class="subtle">예약 실행 이력을 불러오는 중입니다.</span>
          </div>
          <div class="section-head" style="margin-top: 16px;">
            <div>
              <h3 style="margin-bottom: 4px;">최근 발송 로그</h3>
              <div class="subtle">수신자별 발송 성공/실패 결과와 스냅샷 재사용 흐름을 확인합니다.</div>
            </div>
          </div>
          <div class="saved-preset-row">
            <label>
              발송 로그 찾기
              <input id="sendLogSearchInput" type="text" placeholder="수신자, 제목, 키워드로 찾기">
            </label>
            <label>
              발송 상태
              <select id="sendLogStatusSelect">
                <option value="all">전체</option>
                <option value="sent">발송 완료</option>
                <option value="failed">발송 실패</option>
              </select>
            </label>
          </div>
          <div class="subtle" id="sendLogFilterMeta">발송 로그를 불러오는 중입니다.</div>
          <div class="saved-preset-actions" style="justify-content: flex-start; margin-top: 10px;">
            <button id="downloadSendLogsCsvBtn" class="ghost-btn" type="button">현재 보기 CSV 저장</button>
          </div>
          <div class="log-list" id="sendLogList">
            <span class="subtle">발송 로그를 불러오는 중입니다.</span>
          </div>
        </section>
      </div>
    </section>
  </div>

  <div class="modal" id="previewModal">
    <div class="modal-card">
      <div class="modal-head">
        <strong>이메일 HTML 미리보기</strong>
        <button id="closeModalBtn" class="danger-btn" type="button">닫기</button>
      </div>
      <div class="modal-body">
        <iframe id="previewFrame"></iframe>
      </div>
    </div>
  </div>

  <script>
    const DEFAULT_PAGE_SIZE = 20;

    const state = {
      query: {
        keyword: "",
        datePreset: "1m",
        dateFrom: "",
        dateTo: "",
        noticeScope: "include_closed",
        sortBy: "relevance",
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      },
      items: [],
      total: 0,
      totalPages: 1,
      itemCache: new Map(),
      selectedBillIds: new Set(),
      previewItemId: null,
      searchPresets: [],
      recipientGroups: [],
      subscriptionTemplates: [],
      subscriptionActivityById: {},
      subscriptionFilterText: "",
      subscriptionFilterStatus: "all",
      scheduleJobs: [],
      scheduleRunLogs: [],
      scheduleRunFilterJobId: "",
      scheduleRunFilterText: "",
      scheduleRunFilterStatus: "all",
      operationalSummary: null,
      recipients: [],
      sendLogs: [],
      sendLogFilterText: "",
      sendLogFilterStatus: "all",
    };

    const keywordInput = document.getElementById("keywordInput");
    const dateFromInput = document.getElementById("dateFromInput");
    const dateToInput = document.getElementById("dateToInput");
    const noticeScopeSelect = document.getElementById("noticeScopeSelect");
    const sortBySelect = document.getElementById("sortBySelect");
    const pageSizeSelect = document.getElementById("pageSizeSelect");
    const presetNameInput = document.getElementById("presetNameInput");
    const presetButtons = Array.from(document.querySelectorAll("[data-preset]"));
    const resultsBody = document.getElementById("resultsBody");
    const resultMeta = document.getElementById("resultMeta");
    const pageIndicator = document.getElementById("pageIndicator");
    const searchStatus = document.getElementById("searchStatus");
    const savedSearchList = document.getElementById("savedSearchList");
    const recipientInput = document.getElementById("recipientInput");
    const recipientList = document.getElementById("recipientList");
    const groupNameInput = document.getElementById("groupNameInput");
    const savedRecipientGroupList = document.getElementById("savedRecipientGroupList");
    const subscriptionRecipientGroupSelect = document.getElementById("subscriptionRecipientGroupSelect");
    const settingsImportInput = document.getElementById("settingsImportInput");
    const scheduleAtInput = document.getElementById("scheduleAtInput");
    const scheduleRecurrenceSelect = document.getElementById("scheduleRecurrenceSelect");
    const schedulePresetSelect = document.getElementById("schedulePresetSelect");
    const scheduleOnlyNewInput = document.getElementById("scheduleOnlyNewInput");
    const subscriptionNameInput = document.getElementById("subscriptionNameInput");
    const subscriptionFilterInput = document.getElementById("subscriptionFilterInput");
    const subscriptionFilterSelect = document.getElementById("subscriptionFilterSelect");
    const subscriptionFilterMeta = document.getElementById("subscriptionFilterMeta");
    const savedSubscriptionList = document.getElementById("savedSubscriptionList");
    const scheduleList = document.getElementById("scheduleList");
    const scheduleRunSearchInput = document.getElementById("scheduleRunSearchInput");
    const scheduleRunStatusSelect = document.getElementById("scheduleRunStatusSelect");
    const scheduleRunFilterMeta = document.getElementById("scheduleRunFilterMeta");
    const downloadScheduleRunsCsvBtn = document.getElementById("downloadScheduleRunsCsvBtn");
    const scheduleRunFilterBar = document.getElementById("scheduleRunFilterBar");
    const scheduleRunList = document.getElementById("scheduleRunList");
    const operationalSummaryGrid = document.getElementById("operationalSummaryGrid");
    const sendLogSearchInput = document.getElementById("sendLogSearchInput");
    const sendLogStatusSelect = document.getElementById("sendLogStatusSelect");
    const sendLogFilterMeta = document.getElementById("sendLogFilterMeta");
    const downloadSendLogsCsvBtn = document.getElementById("downloadSendLogsCsvBtn");
    const sendLogList = document.getElementById("sendLogList");
    const subjectInput = document.getElementById("subjectInput");
    const introInput = document.getElementById("introInput");
    const outroInput = document.getElementById("outroInput");
    const composerStatus = document.getElementById("composerStatus");
    const previewEmpty = document.getElementById("previewEmpty");
    const previewContent = document.getElementById("previewContent");
    const previewTitle = document.getElementById("previewTitle");
    const previewProposer = document.getElementById("previewProposer");
    const previewCommittee = document.getElementById("previewCommittee");
    const previewStage = document.getElementById("previewStage");
    const previewEndDate = document.getElementById("previewEndDate");
    const previewSummary = document.getElementById("previewSummary");
    const previewLink = document.getElementById("previewLink");
    const previewModal = document.getElementById("previewModal");
    const previewFrame = document.getElementById("previewFrame");

    applyPreset("1m");
    noticeScopeSelect.value = state.query.noticeScope;
    sortBySelect.value = state.query.sortBy;
    pageSizeSelect.value = String(state.query.pageSize);
    scheduleAtInput.value = getDefaultScheduleAtValue();
    scheduleRecurrenceSelect.value = "once";
    subscriptionFilterInput.value = "";
    subscriptionFilterSelect.value = state.subscriptionFilterStatus;
    scheduleRunSearchInput.value = "";
    scheduleRunStatusSelect.value = state.scheduleRunFilterStatus;
    sendLogSearchInput.value = "";
    sendLogStatusSelect.value = state.sendLogFilterStatus;
    renderRecipients();
    renderRecipientGroups();
    renderSubscriptionTemplates();
    renderOperationalSummary();
    renderScheduleJobs();
    renderScheduleRuns();
    renderSendLogs();
    renderResults();
    renderPagination();
    renderSearchPresets();
    renderSchedulePresetOptions();
    void loadSearchPresets();
    void loadRecipientGroups();
    void loadSubscriptionTemplates();
    void loadSubscriptionActivities();
    void loadOperationalSummary();
    void loadSchedules();
    void loadScheduleRuns();
    void loadRecipients();
    void loadSendLogs();
    window.setInterval(() => {
      void loadSubscriptionActivities();
      void loadOperationalSummary();
      void loadSchedules();
      void loadScheduleRuns();
      void loadSendLogs();
    }, 30000);

    presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyPreset(button.dataset.preset);
      });
    });

    document.getElementById("searchBtn").addEventListener("click", () => {
      startNewSearch();
    });

    document.getElementById("savePresetBtn").addEventListener("click", async () => {
      await saveSearchPreset();
    });

    document.getElementById("exportSettingsBtn").addEventListener("click", async () => {
      await exportSettingsBundle();
    });

    document.getElementById("importSettingsBtn").addEventListener("click", () => {
      settingsImportInput.click();
    });

    settingsImportInput.addEventListener("change", async () => {
      const file = settingsImportInput.files && settingsImportInput.files[0];
      if (!file) {
        return;
      }
      await importSettingsBundle(file);
    });

    keywordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        startNewSearch();
      }
    });

    presetNameInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await saveSearchPreset();
      }
    });

    subscriptionFilterInput.addEventListener("input", () => {
      state.subscriptionFilterText = subscriptionFilterInput.value || "";
      renderSubscriptionTemplates();
    });

    subscriptionFilterSelect.addEventListener("change", () => {
      state.subscriptionFilterStatus = subscriptionFilterSelect.value || "all";
      renderSubscriptionTemplates();
    });

    scheduleRunSearchInput.addEventListener("input", () => {
      state.scheduleRunFilterText = scheduleRunSearchInput.value || "";
      renderScheduleRuns();
    });

    scheduleRunStatusSelect.addEventListener("change", () => {
      state.scheduleRunFilterStatus = scheduleRunStatusSelect.value || "all";
      renderScheduleRuns();
    });

    sendLogSearchInput.addEventListener("input", () => {
      state.sendLogFilterText = sendLogSearchInput.value || "";
      renderSendLogs();
    });

    sendLogStatusSelect.addEventListener("change", () => {
      state.sendLogFilterStatus = sendLogStatusSelect.value || "all";
      renderSendLogs();
    });

    downloadScheduleRunsCsvBtn.addEventListener("click", async () => {
      await downloadScheduleRunsCsv();
    });

    downloadSendLogsCsvBtn.addEventListener("click", async () => {
      await downloadSendLogsCsv();
    });

    ["input", "change"].forEach((eventName) => {
      dateFromInput.addEventListener(eventName, () => {
        setCustomDateMode();
      });
      dateToInput.addEventListener(eventName, () => {
        setCustomDateMode();
      });
    });

    pageSizeSelect.addEventListener("change", () => {
      startNewSearch();
    });

    document.getElementById("prevPageBtn").addEventListener("click", () => {
      if (state.query.page <= 1) return;
      state.query.page -= 1;
      performSearch();
    });

    document.getElementById("nextPageBtn").addEventListener("click", () => {
      if (state.query.page >= state.totalPages) return;
      state.query.page += 1;
      performSearch();
    });

    document.getElementById("selectAllBtn").addEventListener("click", () => {
      state.items.forEach((item) => state.selectedBillIds.add(item.billId));
      renderResults();
      updateComposerStatus();
    });

    document.getElementById("clearSelectionBtn").addEventListener("click", () => {
      state.selectedBillIds.clear();
      renderResults();
      updateComposerStatus();
    });

    document.getElementById("addRecipientBtn").addEventListener("click", () => {
      addRecipient();
    });

    recipientInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addRecipient();
      }
    });

    document.getElementById("saveRecipientGroupBtn").addEventListener("click", async () => {
      await saveRecipientGroup();
    });

    groupNameInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await saveRecipientGroup();
      }
    });

    document.getElementById("saveSubscriptionBtn").addEventListener("click", async () => {
      await saveSubscriptionTemplate();
    });

    subscriptionNameInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await saveSubscriptionTemplate();
      }
    });

    document.getElementById("previewBtn").addEventListener("click", async () => {
      await openHtmlPreview();
    });

    document.getElementById("sendSelectedBtn").addEventListener("click", async () => {
      await sendNewsletter(false);
    });

    document.getElementById("sendAllBtn").addEventListener("click", async () => {
      await sendNewsletter(true);
    });

    document.getElementById("downloadSelectedBtn").addEventListener("click", async () => {
      await downloadMarkdown(false);
    });

    document.getElementById("downloadAllBtn").addEventListener("click", async () => {
      await downloadMarkdown(true);
    });

    document.getElementById("scheduleSelectedBtn").addEventListener("click", async () => {
      await scheduleNewsletter(false);
    });

    document.getElementById("scheduleAllBtn").addEventListener("click", async () => {
      await scheduleNewsletter(true);
    });

    document.getElementById("closeModalBtn").addEventListener("click", () => {
      previewModal.classList.remove("open");
      previewFrame.srcdoc = "";
    });

    function applyPreset(preset) {
      state.query.datePreset = preset;
      presetButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.preset === preset);
      });
      if (preset === "custom") {
        return;
      }
      const range = computePresetRange(preset);
      state.query.dateFrom = range.dateFrom;
      state.query.dateTo = range.dateTo;
      dateFromInput.value = range.dateFrom;
      dateToInput.value = range.dateTo;
    }

    function setCustomDateMode() {
      state.query.datePreset = "custom";
      presetButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.preset === "custom");
      });
      state.query.dateFrom = dateFromInput.value || "";
      state.query.dateTo = dateToInput.value || "";
    }

    function computePresetRange(preset) {
      const end = new Date();
      const start = new Date(end);
      if (preset === "6m") start.setMonth(start.getMonth() - 6);
      if (preset === "3m") start.setMonth(start.getMonth() - 3);
      if (preset === "1m") start.setMonth(start.getMonth() - 1);
      if (preset === "3w") start.setDate(start.getDate() - 21);
      if (preset === "2w") start.setDate(start.getDate() - 14);
      if (preset === "1w") start.setDate(start.getDate() - 7);
      return {
        dateFrom: formatDate(start),
        dateTo: formatDate(end),
      };
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    }

    function getDefaultScheduleAtValue() {
      const date = new Date(Date.now() + 60 * 60 * 1000);
      date.setSeconds(0, 0);
      return formatDateTimeLocal(date);
    }

    function formatDateTimeLocal(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
    }

    function renderSearchPresets() {
      renderSchedulePresetOptions();

      if (!state.searchPresets.length) {
        savedSearchList.innerHTML = '<span class="subtle">저장된 검색 preset이 없습니다.</span>';
        return;
      }

      savedSearchList.innerHTML = state.searchPresets.map((preset) => {
        return '<div class="saved-preset-item">' +
          '<div>' +
          '<strong>' + escapeHtml(preset.name) + '</strong>' +
          '<div class="saved-preset-meta">' + escapeHtml(getSavedPresetSummary(preset)) + '</div>' +
          '</div>' +
          '<div class="saved-preset-actions">' +
          '<button type="button" class="ghost-btn load-preset-btn" data-load-preset="' + escapeHtml(preset.id) + '">불러오기</button>' +
          '<button type="button" class="danger-btn" data-delete-preset="' + escapeHtml(preset.id) + '">삭제</button>' +
          '</div>' +
          '</div>';
      }).join("");

      savedSearchList.querySelectorAll("button[data-load-preset]").forEach((button) => {
        button.addEventListener("click", () => {
          const preset = state.searchPresets.find((item) => item.id === button.dataset.loadPreset);
          if (!preset) return;
          applySavedSearchPreset(preset);
        });
      });

      savedSearchList.querySelectorAll("button[data-delete-preset]").forEach((button) => {
        button.addEventListener("click", async () => {
          await deleteSearchPreset(button.dataset.deletePreset);
        });
      });
    }

    function renderSubscriptionTemplates() {
      const totalCount = state.subscriptionTemplates.length;
      if (!totalCount) {
        subscriptionFilterMeta.textContent = "저장된 구독 템플릿이 없습니다.";
        savedSubscriptionList.innerHTML = '<span class="subtle">저장된 구독 템플릿이 없습니다.</span>';
        return;
      }

      const filteredSubscriptions = state.subscriptionTemplates.filter((subscription) => {
        return matchesSubscriptionTemplateFilter(subscription);
      });
      subscriptionFilterMeta.textContent = getSubscriptionFilterMetaText(filteredSubscriptions.length, totalCount);

      if (!filteredSubscriptions.length) {
        savedSubscriptionList.innerHTML = '<span class="subtle">조건에 맞는 구독 템플릿이 없습니다.</span>';
        return;
      }

      savedSubscriptionList.innerHTML = filteredSubscriptions.map((subscription) => {
        const activity = state.subscriptionActivityById[subscription.id];
        const activityStatus = getSubscriptionActivityStatus(activity);
        const latestSnapshotButtons = activity && activity.latestSnapshotJobId
          ? '<button type="button" class="ghost-btn" data-open-subscription-html="' + escapeHtml(activity.latestSnapshotJobId) + '">최근 발송 HTML</button>' +
            '<button type="button" class="ghost-btn" data-download-subscription-markdown="' + escapeHtml(activity.latestSnapshotJobId) + '">최근 발송 Markdown</button>'
          : "";
        return '<div class="saved-preset-item">' +
          '<div>' +
          '<div class="saved-preset-head">' +
          '<strong>' + escapeHtml(subscription.name) + '</strong>' +
          '<span class="status-badge ' + escapeHtml(activityStatus.tone) + '">' + escapeHtml(activityStatus.label) + '</span>' +
          '</div>' +
          '<div class="saved-preset-meta">' + escapeHtml(getSubscriptionSummary(subscription)) + '</div>' +
          '</div>' +
          '<div class="saved-preset-actions">' +
          '<button type="button" class="ghost-btn" data-load-subscription="' + escapeHtml(subscription.id) + '">불러오기</button>' +
          '<button type="button" class="ghost-btn" data-send-subscription="' + escapeHtml(subscription.id) + '">즉시 발송</button>' +
          '<button type="button" class="ghost-btn" data-download-subscription="' + escapeHtml(subscription.id) + '">Markdown 저장</button>' +
          latestSnapshotButtons +
          '<button type="button" class="ghost-btn" data-schedule-subscription="' + escapeHtml(subscription.id) + '">현재 시각으로 예약</button>' +
          '<button type="button" class="danger-btn" data-delete-subscription="' + escapeHtml(subscription.id) + '">삭제</button>' +
          '</div>' +
          '</div>';
      }).join("");

      savedSubscriptionList.querySelectorAll("button[data-load-subscription]").forEach((button) => {
        button.addEventListener("click", async () => {
          await loadSubscriptionTemplate(button.dataset.loadSubscription);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-send-subscription]").forEach((button) => {
        button.addEventListener("click", async () => {
          await sendSubscriptionTemplate(button.dataset.sendSubscription);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-download-subscription]").forEach((button) => {
        button.addEventListener("click", async () => {
          await downloadSubscriptionMarkdown(button.dataset.downloadSubscription);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-open-subscription-html]").forEach((button) => {
        button.addEventListener("click", async () => {
          await openSendLogHtml(button.dataset.openSubscriptionHtml);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-download-subscription-markdown]").forEach((button) => {
        button.addEventListener("click", async () => {
          await downloadSendLogMarkdown(button.dataset.downloadSubscriptionMarkdown);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-schedule-subscription]").forEach((button) => {
        button.addEventListener("click", async () => {
          await scheduleSubscriptionTemplate(button.dataset.scheduleSubscription);
        });
      });

      savedSubscriptionList.querySelectorAll("button[data-delete-subscription]").forEach((button) => {
        button.addEventListener("click", async () => {
          await deleteSubscriptionTemplate(button.dataset.deleteSubscription);
        });
      });
    }

    function getSubscriptionSummary(subscription) {
      const keyword = subscription.query.keyword ? '키워드 ' + subscription.query.keyword : '키워드 없음';
      const dateRange = subscription.query.datePreset === "custom"
        ? ((subscription.query.dateFrom || "미정") + " ~ " + (subscription.query.dateTo || "미정"))
        : getDatePresetLabel(subscription.query.datePreset);
      const linkedPreset = subscription.searchPresetName
        ? 'preset ' + subscription.searchPresetName
        : '현재 조건 스냅샷';
      const recipientSource = subscription.recipientGroupName
        ? '그룹 ' + subscription.recipientGroupName
        : '수신자 스냅샷';
      const recurrence = getScheduleRecurrenceLabel(subscription.recurrence || "once");
      const newOnly = subscription.onlyNewResults ? " · 새 법안만" : "";
      const activity = getSubscriptionActivitySummary(subscription);
      return keyword + " · " + dateRange + " · " + linkedPreset + " · " + recipientSource + " · 수신자 " +
        String((subscription.recipients || []).length) + "명 · " + recurrence + newOnly + activity;
    }

    function getSubscriptionActivitySummary(subscription) {
      const activity = state.subscriptionActivityById[subscription.id];
      if (!activity || activity.scheduleCount === 0) {
        return " · 연결 예약 없음";
      }

      const latestLabel = activity.latestRunStatus
        ? getScheduleRunResultLabel(activity.latestRunStatus) + (activity.latestRunAt ? " " + activity.latestRunAt : "")
        : "최근 실행 없음";
      return " · 연결 예약 " + String(activity.scheduleCount) + "개" +
        " (활성 " + String(activity.activeScheduleCount) +
        ", 일시정지 " + String(activity.pausedScheduleCount) +
        ", 실패 " + String(activity.failedScheduleCount) +
        ") · " + latestLabel;
    }

    function matchesSubscriptionTemplateFilter(subscription) {
      const filterText = (state.subscriptionFilterText || "").trim().toLowerCase();
      if (filterText) {
        const haystack = [
          subscription.name,
          subscription.subject,
          subscription.query && subscription.query.keyword,
          subscription.searchPresetName,
          subscription.recipientGroupName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(filterText)) {
          return false;
        }
      }

      const filterStatus = state.subscriptionFilterStatus || "all";
      if (filterStatus === "all") {
        return true;
      }

      const activityStatus = getSubscriptionActivityStatus(state.subscriptionActivityById[subscription.id]);
      if (filterStatus === "attention") {
        return activityStatus.key === "failed" || activityStatus.key === "paused";
      }

      if (filterStatus === "active") {
        return activityStatus.key === "active";
      }

      if (filterStatus === "history") {
        return activityStatus.key === "history";
      }

      if (filterStatus === "no_schedule") {
        return activityStatus.key === "no_schedule";
      }

      return true;
    }

    function getSubscriptionActivityStatus(activity) {
      if (!activity || activity.scheduleCount === 0) {
        return { key: "no_schedule", label: "예약 없음", tone: "muted" };
      }

      if (activity.failedScheduleCount > 0) {
        return { key: "failed", label: "실패 있음", tone: "danger" };
      }

      if (activity.pausedScheduleCount > 0) {
        return { key: "paused", label: "일시정지", tone: "warning" };
      }

      if (activity.activeScheduleCount > 0) {
        return { key: "active", label: "활성", tone: "active" };
      }

      return { key: "history", label: "이력만", tone: "muted" };
    }

    function getSubscriptionFilterMetaText(visibleCount, totalCount) {
      const statusLabel = getSubscriptionFilterStatusLabel(state.subscriptionFilterStatus || "all");
      if (!totalCount) {
        return "저장된 구독 템플릿이 없습니다.";
      }
      return "표시 중 " + String(visibleCount) + " / " + String(totalCount) + "개 · 상태 " + statusLabel;
    }

    function getSubscriptionFilterStatusLabel(value) {
      if (value === "active") return "활성 예약 있음";
      if (value === "attention") return "주의 필요";
      if (value === "history") return "이력만 있음";
      if (value === "no_schedule") return "예약 없음";
      return "전체";
    }

    function applyQuerySnapshot(query, options) {
      const linkedPresetId = options && options.linkedPresetId ? options.linkedPresetId : "";
      const statusMessage = options && options.statusMessage ? options.statusMessage : "";

      keywordInput.value = query.keyword || "";
      noticeScopeSelect.value = query.noticeScope || "include_closed";
      sortBySelect.value = query.sortBy || "relevance";
      pageSizeSelect.value = String(query.pageSize || DEFAULT_PAGE_SIZE);
      schedulePresetSelect.value = linkedPresetId;

      if (query.datePreset === "custom") {
        applyPreset("custom");
        dateFromInput.value = query.dateFrom || "";
        dateToInput.value = query.dateTo || "";
        state.query.dateFrom = query.dateFrom || "";
        state.query.dateTo = query.dateTo || "";
      } else {
        applyPreset(query.datePreset || "1m");
      }

      startNewSearch();
      if (statusMessage) {
        setStatus(searchStatus, statusMessage, "success");
      }
    }

    function renderSchedulePresetOptions() {
      const currentValue = schedulePresetSelect.value;
      const options = ['<option value="">현재 검색 조건</option>'].concat(
        state.searchPresets.map((preset) =>
          '<option value="' + escapeHtml(preset.id) + '">' + escapeHtml(preset.name) + '</option>'
        ),
      );
      schedulePresetSelect.innerHTML = options.join("");
      const exists = state.searchPresets.some((preset) => preset.id === currentValue);
      schedulePresetSelect.value = exists ? currentValue : "";
    }

    function getSavedPresetSummary(preset) {
      const scope = getNoticeScopeLabel(preset.query.noticeScope);
      const sortBy = getSortByLabel(preset.query.sortBy);
      const keyword = preset.query.keyword ? '키워드 ' + preset.query.keyword : '키워드 없음';
      const dateRange = preset.query.datePreset === "custom"
        ? ((preset.query.dateFrom || "미정") + " ~ " + (preset.query.dateTo || "미정"))
        : getDatePresetLabel(preset.query.datePreset);

      return keyword + " · " + dateRange + " · " + scope + " · " + sortBy + " · " + preset.query.pageSize + "건";
    }

    function getDatePresetLabel(value) {
      if (value === "6m") return "최근 6개월";
      if (value === "3m") return "최근 3개월";
      if (value === "1m") return "최근 1개월";
      if (value === "3w") return "최근 3주";
      if (value === "2w") return "최근 2주";
      if (value === "1w") return "최근 1주";
      return "직접 지정";
    }

    function startNewSearch() {
      syncQueryFromInputs();
      state.query.page = 1;
      state.total = 0;
      state.totalPages = 1;
      state.items = [];
      state.itemCache.clear();
      state.selectedBillIds.clear();
      state.previewItemId = null;
      renderResults();
      renderPagination();
      updateComposerStatus();
      performSearch();
    }

    function syncQueryFromInputs() {
      state.query.keyword = keywordInput.value.trim();
      state.query.dateFrom = dateFromInput.value || "";
      state.query.dateTo = dateToInput.value || "";
      state.query.noticeScope = noticeScopeSelect.value;
      state.query.sortBy = sortBySelect.value;
      state.query.pageSize = Number(pageSizeSelect.value) || DEFAULT_PAGE_SIZE;
    }

    async function performSearch() {
      setStatus(searchStatus, "검색 중입니다...");

      try {
        const response = await fetch("/api/legislation/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: state.query.keyword,
            datePreset: state.query.datePreset,
            dateFrom: state.query.dateFrom || undefined,
            dateTo: state.query.dateTo || undefined,
            noticeScope: state.query.noticeScope,
            sortBy: state.query.sortBy,
            page: state.query.page,
            pageSize: state.query.pageSize,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "검색에 실패했습니다.");
        }

        state.items = data.items || [];
        state.total = Number(data.total) || 0;
        state.totalPages = Number(data.totalPages) || Math.max(1, Math.ceil(state.total / state.query.pageSize));
        state.query.page = data.query.page;
        state.query.pageSize = data.query.pageSize;
        pageSizeSelect.value = String(state.query.pageSize);

        state.items.forEach((item) => {
          state.itemCache.set(item.billId, item);
        });
        state.previewItemId = state.items[0] ? state.items[0].billId : null;

        resultMeta.textContent =
          "총 " + data.total + "건 · 기간 " + data.query.dateFrom + " ~ " + data.query.dateTo +
          " · 페이지 " + data.query.page + "/" + data.totalPages +
          " · 범위 " + getNoticeScopeLabel(data.query.noticeScope) +
          " · 정렬 " + getSortByLabel(data.query.sortBy);
        if (!subjectInput.value.trim()) {
          const subjectKeyword = data.query.keyword || "입법예고";
          subjectInput.value = "[입법예고 뉴스레터] " + subjectKeyword + " 관련 법안 브리핑";
        }

        renderResults();
        renderPagination();
        renderPreview();
        updateComposerStatus();
        setStatus(searchStatus, "검색 결과를 불러왔습니다.", "success");
      } catch (error) {
        setStatus(searchStatus, error.message || "검색에 실패했습니다.", "error");
      }
    }

    function renderResults() {
      if (!state.items.length) {
        resultsBody.innerHTML = '<tr><td colspan="6" class="subtle">검색 결과가 없습니다.</td></tr>';
        renderPreview();
        renderPagination();
        return;
      }

      resultsBody.innerHTML = state.items.map((item) => {
        const checked = state.selectedBillIds.has(item.billId) ? "checked" : "";
        const active = state.previewItemId === item.billId ? "active" : "";
        return '<tr class="' + active + '" data-bill-id="' + escapeHtml(item.billId) + '">' +
          '<td><input type="checkbox" data-select-id="' + escapeHtml(item.billId) + '" ' + checked + '></td>' +
          '<td><strong>' + escapeHtml(item.billName) + '</strong><div class="subtle">의안번호 ' + escapeHtml(item.billNo || "미상") + '</div></td>' +
          '<td>' + escapeHtml(item.proposer || "미상") + '</td>' +
          '<td>' + escapeHtml(item.committee || "미상") + '</td>' +
          '<td><span class="stage-pill">' + escapeHtml(item.stageLabel) + '</span></td>' +
          '<td>' + escapeHtml(item.noticeEndDate || "미상") + '</td>' +
          '</tr>';
      }).join("");

      resultsBody.querySelectorAll("tr[data-bill-id]").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target && event.target.matches('input[type="checkbox"]')) {
            return;
          }
          state.previewItemId = row.dataset.billId;
          renderResults();
          renderPreview();
        });
      });

      resultsBody.querySelectorAll("input[data-select-id]").forEach((checkbox) => {
        checkbox.addEventListener("click", (event) => event.stopPropagation());
        checkbox.addEventListener("change", () => {
          const id = checkbox.dataset.selectId;
          if (checkbox.checked) {
            state.selectedBillIds.add(id);
          } else {
            state.selectedBillIds.delete(id);
          }
          updateComposerStatus();
        });
      });
    }

    function renderPagination() {
      pageIndicator.textContent = state.query.page + " / " + state.totalPages + " 페이지";
      document.getElementById("prevPageBtn").disabled = state.query.page <= 1;
      document.getElementById("nextPageBtn").disabled = state.query.page >= state.totalPages || state.total === 0;
    }

    function renderPreview() {
      const item = state.items.find((entry) => entry.billId === state.previewItemId) || state.items[0];
      if (!item) {
        previewEmpty.hidden = false;
        previewContent.hidden = true;
        return;
      }

      previewEmpty.hidden = true;
      previewContent.hidden = false;
      previewTitle.textContent = item.billName;
      previewProposer.textContent = item.proposer || "미상";
      previewCommittee.textContent = item.committee || "미상";
      previewStage.textContent = item.stageLabel;
      previewEndDate.textContent = item.noticeEndDate || "미상";
      previewSummary.textContent = item.summary || "상세 요약 정보가 아직 수집되지 않았습니다.";
      previewLink.href = item.detailUrl || "#";
      previewLink.textContent = item.detailUrl ? "원문 보기" : "원문 링크 없음";
    }

    async function exportSettingsBundle() {
      try {
        const response = await fetch("/api/newsletter/settings-export");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "설정 백업 파일을 생성하지 못했습니다.");
        }

        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="([^"]+)"/);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = match ? match[1] : "newsletter-settings-backup.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus(composerStatus, "설정 백업 파일을 내려받았습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "설정 백업 파일을 생성하지 못했습니다.", "error");
      }
    }

    async function importSettingsBundle(file) {
      try {
        if (!file) {
          return;
        }

        const shouldImport = window.confirm(
          "현재 저장된 수신자, 수신자 그룹, 검색 preset, 구독 템플릿을 백업 파일 내용으로 교체합니다. 계속할까요?",
        );
        if (!shouldImport) {
          return;
        }

        let bundle;
        try {
          bundle = JSON.parse(await file.text());
        } catch {
          throw new Error("설정 백업 파일 JSON을 해석하지 못했습니다.");
        }

        const response = await fetch("/api/newsletter/settings-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bundle),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "설정 복원에 실패했습니다.");
        }

        await reloadStoredNewsletterSettings();
        const counts = data.counts || {};
        setStatus(
          composerStatus,
          "설정 복원을 완료했습니다. 수신자 " + String(counts.recipients || 0) +
            "명, 그룹 " + String(counts.recipientGroups || 0) +
            "개, preset " + String(counts.searchPresets || 0) +
            "개, 구독 템플릿 " + String(counts.subscriptionTemplates || 0) + "개를 반영했습니다.",
          "success",
        );
      } catch (error) {
        setStatus(composerStatus, error.message || "설정 복원에 실패했습니다.", "error");
      } finally {
        settingsImportInput.value = "";
      }
    }

    async function reloadStoredNewsletterSettings() {
      await Promise.all([
        loadRecipients(),
        loadRecipientGroups(),
        loadSearchPresets(),
        loadSubscriptionTemplates(),
        loadSubscriptionActivities(),
        loadOperationalSummary(),
      ]);
    }

    async function addRecipient() {
      const value = recipientInput.value.trim();
      if (!value) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setStatus(composerStatus, "이메일 형식이 올바르지 않습니다.", "error");
        return;
      }
      try {
        const response = await fetch("/api/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "이메일 저장에 실패했습니다.");
        }
        state.recipients = (data.items || []).map((item) => item.email);
        recipientInput.value = "";
        subscriptionRecipientGroupSelect.value = "";
        renderRecipients();
        updateComposerStatus();
      } catch (error) {
        setStatus(composerStatus, error.message || "이메일 저장에 실패했습니다.", "error");
      }
    }

    async function syncRecipients(recipients) {
      const response = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          replace: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "수신자 목록 저장에 실패했습니다.");
      }
      state.recipients = (data.items || []).map((item) => item.email);
      renderRecipients();
      updateComposerStatus();
    }

    function renderRecipients() {
      if (!state.recipients.length) {
        recipientList.innerHTML = '<span class="subtle">아직 추가된 이메일이 없습니다.</span>';
        return;
      }
      recipientList.innerHTML = state.recipients.map((recipient) => {
        return '<span class="chip">' + escapeHtml(recipient) + '<button type="button" data-remove="' + escapeHtml(recipient) + '">삭제</button></span>';
      }).join("");

      recipientList.querySelectorAll("button[data-remove]").forEach((button) => {
        button.addEventListener("click", async () => {
          try {
            const response = await fetch("/api/recipients?email=" + encodeURIComponent(button.dataset.remove), {
              method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "이메일 삭제에 실패했습니다.");
            }
            state.recipients = (data.items || []).map((item) => item.email);
            subscriptionRecipientGroupSelect.value = "";
            renderRecipients();
            updateComposerStatus();
          } catch (error) {
            setStatus(composerStatus, error.message || "이메일 삭제에 실패했습니다.", "error");
          }
        });
      });
    }

    function renderRecipientGroups() {
      renderRecipientGroupOptions();

      if (!state.recipientGroups.length) {
        savedRecipientGroupList.innerHTML = '<span class="subtle">저장된 수신자 그룹이 없습니다.</span>';
        return;
      }

      savedRecipientGroupList.innerHTML = state.recipientGroups.map((group) => {
        return '<div class="saved-preset-item">' +
          '<div>' +
          '<strong>' + escapeHtml(group.name) + '</strong>' +
          '<div class="saved-preset-meta">' + escapeHtml(getRecipientGroupSummary(group)) + '</div>' +
          '</div>' +
          '<div class="saved-preset-actions">' +
          '<button type="button" class="ghost-btn" data-load-group="' + escapeHtml(group.id) + '">불러오기</button>' +
          '<button type="button" class="ghost-btn" data-append-group="' + escapeHtml(group.id) + '">추가하기</button>' +
          '<button type="button" class="danger-btn" data-delete-group="' + escapeHtml(group.id) + '">삭제</button>' +
          '</div>' +
          '</div>';
      }).join("");

      savedRecipientGroupList.querySelectorAll("button[data-load-group]").forEach((button) => {
        button.addEventListener("click", async () => {
          await applyRecipientGroup(button.dataset.loadGroup, "replace");
        });
      });

      savedRecipientGroupList.querySelectorAll("button[data-append-group]").forEach((button) => {
        button.addEventListener("click", async () => {
          await applyRecipientGroup(button.dataset.appendGroup, "append");
        });
      });

      savedRecipientGroupList.querySelectorAll("button[data-delete-group]").forEach((button) => {
        button.addEventListener("click", async () => {
          await deleteRecipientGroup(button.dataset.deleteGroup);
        });
      });
    }

    function renderRecipientGroupOptions() {
      const currentValue = subscriptionRecipientGroupSelect.value;
      const options = ['<option value="">현재 수신자 목록 스냅샷 사용</option>'].concat(
        state.recipientGroups.map((group) =>
          '<option value="' + escapeHtml(group.id) + '">' + escapeHtml(group.name) + '</option>'
        ),
      );
      subscriptionRecipientGroupSelect.innerHTML = options.join("");
      const exists = state.recipientGroups.some((group) => group.id === currentValue);
      subscriptionRecipientGroupSelect.value = exists ? currentValue : "";
    }

    function getSelectedRecipientGroup() {
      if (!subscriptionRecipientGroupSelect.value) {
        return null;
      }

      return state.recipientGroups.find((group) => group.id === subscriptionRecipientGroupSelect.value) || null;
    }

    function getRecipientGroupSummary(group) {
      const previewEmails = (group.emails || []).slice(0, 3).join(", ");
      const moreCount = Math.max((group.emails || []).length - 3, 0);
      const extraLabel = moreCount > 0 ? " 외 " + moreCount + "명" : "";
      const updatedAt = group.updatedAt ? " · 업데이트 " + group.updatedAt : "";
      return (group.emails || []).length + "명 · " + (previewEmails || "이메일 없음") + extraLabel + updatedAt;
    }

    async function saveRecipientGroup() {
      if (!groupNameInput.value.trim()) {
        setStatus(composerStatus, "저장할 수신자 그룹 이름을 입력해 주세요.", "error");
        return;
      }
      if (!state.recipients.length) {
        setStatus(composerStatus, "저장할 수신자 이메일을 먼저 1개 이상 추가해 주세요.", "error");
        return;
      }

      try {
        const response = await fetch("/api/recipient-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupNameInput.value.trim(),
            recipients: state.recipients,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "수신자 그룹 저장에 실패했습니다.");
        }

        state.recipientGroups = data.items || [];
        renderRecipientGroups();
        groupNameInput.value = "";
        setStatus(composerStatus, "수신자 그룹을 저장했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "수신자 그룹 저장에 실패했습니다.", "error");
      }
    }

    async function applyRecipientGroup(id, mode) {
      if (!id) return;

      const group = state.recipientGroups.find((item) => item.id === id);
      if (!group) {
        setStatus(composerStatus, "선택한 수신자 그룹을 찾지 못했습니다.", "error");
        return;
      }

      const nextRecipients = mode === "append"
        ? Array.from(new Set([].concat(state.recipients || [], group.emails || [])))
        : Array.from(group.emails || []);

      try {
        await syncRecipients(nextRecipients);
        if (mode === "replace") {
          subscriptionRecipientGroupSelect.value = group.id;
        } else {
          subscriptionRecipientGroupSelect.value = "";
        }
        setStatus(
          composerStatus,
          mode === "append"
            ? '수신자 그룹 "' + group.name + '"을 현재 목록에 추가했습니다.'
            : '수신자 그룹 "' + group.name + '"으로 현재 목록을 불러왔습니다.',
          "success",
        );
      } catch (error) {
        setStatus(composerStatus, error.message || "수신자 그룹 적용에 실패했습니다.", "error");
      }
    }

    async function deleteRecipientGroup(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/recipient-groups?id=" + encodeURIComponent(id), {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "수신자 그룹 삭제에 실패했습니다.");
        }

        state.recipientGroups = data.items || [];
        renderRecipientGroups();
        setStatus(composerStatus, "수신자 그룹을 삭제했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "수신자 그룹 삭제에 실패했습니다.", "error");
      }
    }

    function renderSendLogs() {
      const filteredLogs = state.sendLogs.filter((log) => matchesSendLogFilter(log));
      sendLogFilterMeta.textContent = getSendLogFilterMetaText(filteredLogs.length, state.sendLogs.length);

      if (!state.sendLogs.length) {
        sendLogList.innerHTML = '<span class="subtle">아직 발송 로그가 없습니다.</span>';
        return;
      }

      if (!filteredLogs.length) {
        sendLogList.innerHTML = '<span class="subtle">조건에 맞는 발송 로그가 없습니다.</span>';
        return;
      }

      sendLogList.innerHTML = filteredLogs.map((log) => {
        const tone = log.status === "failed" ? "failed" : "sent";
        const label = getSendLogStatusLabel(log.status);
        const detail = log.errorMessage ? '<div class="log-meta">' + escapeHtml(log.errorMessage) + '</div>' : '';
        const keywordMeta = log.keyword ? ' · 키워드 ' + escapeHtml(log.keyword) : '';
        const actions = log.snapshotAvailable
          ? '<div class="saved-preset-actions" style="justify-content: flex-start;">' +
              '<button type="button" class="ghost-btn" data-open-log-html="' + escapeHtml(log.jobId) + '">HTML 보기</button>' +
              '<button type="button" class="ghost-btn" data-download-log-markdown="' + escapeHtml(log.jobId) + '">Markdown 저장</button>' +
              (log.status === "failed"
                ? '<button type="button" class="ghost-btn" data-retry-failed-log="' + escapeHtml(log.id) + '">이 수신자 재시도</button>'
                : '') +
              '<button type="button" class="ghost-btn" data-resend-log="' + escapeHtml(log.jobId) + '">현재 수신자에게 재전송</button>' +
            '</div>'
          : '<div class="log-meta">발송 스냅샷이 없습니다.</div>';
        return '<div class="log-item">' +
          '<strong>' + escapeHtml(log.subject || "입법예고 뉴스레터") + '</strong>' +
          '<div class="log-meta">수신자 ' + escapeHtml(log.recipientEmail) + keywordMeta +
            ' · 법안 ' + escapeHtml(String(log.itemCount || 0)) + '건 · ' + escapeHtml(log.sentAt || "") + '</div>' +
          '<div class="log-status ' + tone + '">' + label + '</div>' +
          detail +
          actions +
          '</div>';
      }).join("");

      sendLogList.querySelectorAll("button[data-open-log-html]").forEach((button) => {
        button.addEventListener("click", async () => {
          await openSendLogHtml(button.dataset.openLogHtml);
        });
      });

      sendLogList.querySelectorAll("button[data-download-log-markdown]").forEach((button) => {
        button.addEventListener("click", async () => {
          await downloadSendLogMarkdown(button.dataset.downloadLogMarkdown);
        });
      });

      sendLogList.querySelectorAll("button[data-retry-failed-log]").forEach((button) => {
        button.addEventListener("click", async () => {
          await retryFailedSendLog(button.dataset.retryFailedLog);
        });
      });

      sendLogList.querySelectorAll("button[data-resend-log]").forEach((button) => {
        button.addEventListener("click", async () => {
          await resendSendLog(button.dataset.resendLog);
        });
      });
    }

    function matchesSendLogFilter(log) {
      const filterText = (state.sendLogFilterText || "").trim().toLowerCase();
      if (filterText) {
        const haystack = [
          log.recipientEmail,
          log.subject,
          log.keyword,
          log.errorMessage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(filterText)) {
          return false;
        }
      }

      const filterStatus = state.sendLogFilterStatus || "all";
      if (filterStatus !== "all" && log.status !== filterStatus) {
        return false;
      }

      return true;
    }

    function getSendLogFilterMetaText(visibleCount, totalCount) {
      const statusLabel = getSendLogFilterStatusLabel(state.sendLogFilterStatus || "all");
      if (!totalCount) {
        return "발송 로그가 없습니다.";
      }
      return "표시 중 " + String(visibleCount) + " / " + String(totalCount) + "건 · 상태 " + statusLabel;
    }

    function getSendLogStatusLabel(value) {
      return value === "failed" ? "발송 실패" : "발송 완료";
    }

    function getSendLogFilterStatusLabel(value) {
      if (value === "failed") return "발송 실패";
      if (value === "sent") return "발송 완료";
      return "전체";
    }

    function renderOperationalSummary() {
      const summary = state.operationalSummary;
      if (!summary) {
        operationalSummaryGrid.innerHTML = [
          createSummaryCard("현재 수신자", "-", "수신자와 그룹 현황을 불러오는 중입니다."),
          createSummaryCard("검색 저장", "-", "검색 preset과 구독 템플릿 수를 계산합니다."),
          createSummaryCard("활성 예약", "-", "대기/발송 중 예약을 집계합니다."),
          createSummaryCard("일시정지 예약", "-", "일시정지/실패 예약을 확인합니다."),
          createSummaryCard("최근 7일 예약 성공", "-", "예약 실행 이력에서 성공 건수를 집계합니다."),
          createSummaryCard("최근 7일 메일 발송", "-", "수신자 단위 발송 로그를 집계합니다."),
        ].join("");
        return;
      }

      operationalSummaryGrid.innerHTML = [
        createSummaryCard(
          "현재 수신자",
          String(summary.recipientCount) + "명",
          "수신자 그룹 " + String(summary.recipientGroupCount) + "개",
        ),
        createSummaryCard(
          "검색 저장",
          "preset " + String(summary.searchPresetCount) + "개",
          "구독 템플릿 " + String(summary.subscriptionTemplateCount) + "개",
        ),
        createSummaryCard(
          "활성 예약",
          String(summary.scheduleCounts.active) + "개",
          "전체 예약 " + String(summary.scheduleCounts.total) + "개",
        ),
        createSummaryCard(
          "일시정지 예약",
          String(summary.scheduleCounts.paused) + "개",
          "실패 상태 " + String(summary.scheduleCounts.failed) + "개",
        ),
        createSummaryCard(
          "최근 " + String(summary.scheduleRunWindowDays) + "일 예약 성공",
          String(summary.scheduleRunCounts.sent) + "회",
          "건너뜀 " + String(summary.scheduleRunCounts.skipped) + "회 · 실패 " + String(summary.scheduleRunCounts.failed) + "회",
        ),
        createSummaryCard(
          "최근 " + String(summary.scheduleRunWindowDays) + "일 메일 발송",
          String(summary.sendLogCounts.sent) + "건",
          "실패 " + String(summary.sendLogCounts.failed) + "건 · 기준 " + summary.asOf,
        ),
      ].join("");
    }

    function createSummaryCard(label, value, note) {
      return '<div class="summary-card">' +
        '<div class="summary-kicker">' + escapeHtml(label) + '</div>' +
        '<div class="summary-value">' + escapeHtml(value) + '</div>' +
        '<div class="summary-note">' + escapeHtml(note) + '</div>' +
        '</div>';
    }

    function renderScheduleJobs() {
      if (!state.scheduleJobs.length) {
        scheduleList.innerHTML = '<span class="subtle">예약된 발송 작업이 없습니다.</span>';
        return;
      }

      scheduleList.innerHTML = state.scheduleJobs.map((job) => {
        const status = getScheduleStatusLabel(job.status);
        const lastProcessed = job.processedAt
          ? '<div class="log-meta">최근 실행 ' + escapeHtml(job.processedAt) + '</div>'
          : '';
        const lastResult = job.lastRunStatus
          ? '<div class="log-meta">최근 결과 ' + escapeHtml(getScheduleRunResultLabel(job.lastRunStatus)) +
            (job.lastRunMessage ? ' · ' + escapeHtml(job.lastRunMessage) : '') +
            '</div>'
          : '';
        const actionButtons = [];
        actionButtons.push(
          '<button type="button" class="ghost-btn" data-show-schedule-history="' + escapeHtml(job.id) + '">' +
            escapeHtml(state.scheduleRunFilterJobId === job.id ? "이력 보는 중" : "이력 보기") +
          '</button>',
        );
        if (job.status === "pending") {
          actionButtons.push(
            '<button type="button" class="ghost-btn" data-pause-schedule="' + escapeHtml(job.id) + '">일시정지</button>',
          );
        }
        if (job.status === "paused" || job.status === "failed") {
          actionButtons.push(
            '<button type="button" class="ghost-btn" data-resume-schedule="' + escapeHtml(job.id) + '">' +
              escapeHtml(job.status === "failed" ? "다시 대기" : "재개") +
            '</button>',
          );
        }
        if (job.status === "pending" || job.status === "paused" || job.status === "failed") {
          actionButtons.push(
            '<button type="button" class="danger-btn" data-cancel-schedule="' + escapeHtml(job.id) + '">예약 취소</button>',
          );
        }
        const presetMeta = job.payload.searchPresetName
          ? ' · 기준 preset ' + escapeHtml(job.payload.searchPresetName)
          : '';
        const subscriptionMeta = job.payload.subscriptionTemplateName
          ? ' · 구독 템플릿 ' + escapeHtml(job.payload.subscriptionTemplateName)
          : '';
        const recipientGroupMeta = job.payload.recipientGroupName
          ? ' · 수신자 그룹 ' + escapeHtml(job.payload.recipientGroupName)
          : '';
        const newOnlyMeta = job.payload.onlyNewResults
          ? ' · 새 법안만'
          : '';
        return '<div class="log-item">' +
          '<strong>' + escapeHtml(job.payload.subject || "입법예고 뉴스레터") + '</strong>' +
          '<div class="log-meta">예약 시각 ' + escapeHtml(formatScheduledAt(job.scheduledAt)) +
          ' · 반복 ' + escapeHtml(getScheduleRecurrenceLabel(job.recurrence)) +
          presetMeta +
          subscriptionMeta +
          recipientGroupMeta +
          newOnlyMeta +
          ' · 수신자 ' + escapeHtml(String((job.payload.recipients || []).length)) + '명' +
          ' · 대상 ' + escapeHtml(getScheduledJobTargetLabel(job)) + '</div>' +
          '<div class="log-status ' + escapeHtml(job.status) + '">' + escapeHtml(status) + '</div>' +
          lastProcessed +
          lastResult +
          (actionButtons.length
            ? '<div class="saved-preset-actions" style="justify-content: flex-start;">' + actionButtons.join("") + '</div>'
            : '') +
          '</div>';
      }).join("");

      scheduleList.querySelectorAll("button[data-pause-schedule]").forEach((button) => {
        button.addEventListener("click", async () => {
          await pauseScheduledJob(button.dataset.pauseSchedule);
        });
      });

      scheduleList.querySelectorAll("button[data-show-schedule-history]").forEach((button) => {
        button.addEventListener("click", async () => {
          await setScheduleRunFilter(button.dataset.showScheduleHistory || "");
        });
      });

      scheduleList.querySelectorAll("button[data-resume-schedule]").forEach((button) => {
        button.addEventListener("click", async () => {
          await resumeScheduledJob(button.dataset.resumeSchedule);
        });
      });

      scheduleList.querySelectorAll("button[data-cancel-schedule]").forEach((button) => {
        button.addEventListener("click", async () => {
          await cancelScheduledJob(button.dataset.cancelSchedule);
        });
      });
    }

    function renderScheduleRuns() {
      renderScheduleRunFilterBar();
      const filteredRuns = state.scheduleRunLogs.filter((run) => matchesScheduleRunFilter(run));
      scheduleRunFilterMeta.textContent = getScheduleRunFilterMetaText(filteredRuns.length, state.scheduleRunLogs.length);

      if (!state.scheduleRunLogs.length) {
        scheduleRunList.innerHTML = '<span class="subtle">' +
          escapeHtml(
            state.scheduleRunFilterJobId
              ? "선택한 예약의 실행 이력이 아직 없습니다."
              : "아직 예약 실행 이력이 없습니다.",
          ) +
        '</span>';
        return;
      }

      if (!filteredRuns.length) {
        scheduleRunList.innerHTML = '<span class="subtle">조건에 맞는 예약 실행 이력이 없습니다.</span>';
        return;
      }

      scheduleRunList.innerHTML = filteredRuns.map((run) => {
        const statusLabel = getScheduleRunResultLabel(run.status);
        const statusTone = run.status === "failed"
          ? "failed"
          : (run.status === "skipped" ? "skipped" : "sent");
        const recipientResult = run.status === "sent"
          ? '발송 성공 ' + escapeHtml(String(run.sentCount || 0)) + '건 / 실패 ' + escapeHtml(String(run.failedCount || 0)) + '건'
          : '발송 성공 0건 / 실패 0건';
        const detail = run.message
          ? '<div class="log-meta">' + escapeHtml(run.message) + '</div>'
          : '';
        const snapshotActions = run.deliveryJobId
          ? '<div class="saved-preset-actions" style="justify-content: flex-start;">' +
              '<button type="button" class="ghost-btn" data-open-schedule-run-html="' + escapeHtml(run.deliveryJobId) + '">HTML 보기</button>' +
              '<button type="button" class="ghost-btn" data-download-schedule-run-markdown="' + escapeHtml(run.deliveryJobId) + '">Markdown 저장</button>' +
            '</div>'
          : '';

        return '<div class="log-item">' +
          '<strong>' + escapeHtml(run.scheduleSubject || "입법예고 뉴스레터") + '</strong>' +
          '<div class="log-meta">실행 ' + escapeHtml(run.runAt || "") +
            ' · 반복 ' + escapeHtml(getScheduleRecurrenceLabel(run.recurrence)) +
            (run.keyword ? ' · 키워드 ' + escapeHtml(run.keyword) : '') +
            ' · 법안 ' + escapeHtml(String(run.itemCount || 0)) + '건' +
            ' · ' + recipientResult + '</div>' +
          '<div class="log-status ' + escapeHtml(statusTone) + '">' + escapeHtml(statusLabel) + '</div>' +
          detail +
          snapshotActions +
          '</div>';
      }).join("");

      scheduleRunList.querySelectorAll("button[data-open-schedule-run-html]").forEach((button) => {
        button.addEventListener("click", async () => {
          await openSendLogHtml(button.dataset.openScheduleRunHtml);
        });
      });

      scheduleRunList.querySelectorAll("button[data-download-schedule-run-markdown]").forEach((button) => {
        button.addEventListener("click", async () => {
          await downloadSendLogMarkdown(button.dataset.downloadScheduleRunMarkdown);
        });
      });
    }

    function renderScheduleRunFilterBar() {
      if (!state.scheduleRunFilterJobId) {
        scheduleRunFilterBar.hidden = true;
        scheduleRunFilterBar.innerHTML = "";
        return;
      }

      const job = state.scheduleJobs.find((item) => item.id === state.scheduleRunFilterJobId);
      const label = job
        ? (job.payload.subject || "입법예고 뉴스레터")
        : "선택한 예약";
      scheduleRunFilterBar.hidden = false;
      scheduleRunFilterBar.innerHTML =
        '<span class="subtle">현재 "' + escapeHtml(label) + '" 예약 이력만 보는 중입니다.</span>' +
        '<button type="button" class="ghost-btn" data-clear-schedule-run-filter="true">전체 이력 보기</button>';

      scheduleRunFilterBar.querySelectorAll("button[data-clear-schedule-run-filter]").forEach((button) => {
        button.addEventListener("click", async () => {
          await clearScheduleRunFilter();
        });
      });
    }

    function matchesScheduleRunFilter(run) {
      const filterText = (state.scheduleRunFilterText || "").trim().toLowerCase();
      if (filterText) {
        const haystack = [
          run.scheduleSubject,
          run.keyword,
          run.message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(filterText)) {
          return false;
        }
      }

      const filterStatus = state.scheduleRunFilterStatus || "all";
      if (filterStatus !== "all" && run.status !== filterStatus) {
        return false;
      }

      return true;
    }

    function getScheduleRunFilterMetaText(visibleCount, totalCount) {
      const statusLabel = getScheduleRunFilterStatusLabel(state.scheduleRunFilterStatus || "all");
      if (!totalCount) {
        return state.scheduleRunFilterJobId
          ? "선택한 예약의 실행 이력이 아직 없습니다."
          : "예약 실행 이력이 없습니다.";
      }

      const jobLabel = state.scheduleRunFilterJobId ? " · 예약별 보기 적용 중" : "";
      return "표시 중 " + String(visibleCount) + " / " + String(totalCount) + "건 · 상태 " + statusLabel + jobLabel;
    }

    function getScheduleRunFilterStatusLabel(value) {
      if (value === "sent") return "발송 완료";
      if (value === "skipped") return "건너뜀";
      if (value === "failed") return "발송 실패";
      return "전체";
    }

    function formatScheduledAt(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value || "미정";
      }
      return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    }

    function getScheduleStatusLabel(status) {
      if (status === "pending") return "예약 대기";
      if (status === "processing") return "발송 중";
      if (status === "paused") return "일시정지";
      if (status === "sent") return "발송 완료";
      if (status === "skipped") return "건너뜀";
      if (status === "failed") return "발송 실패";
      return "예약 취소";
    }

    function getScheduleRunResultLabel(status) {
      if (status === "sent") return "발송 완료";
      if (status === "skipped") return "건너뜀";
      return "발송 실패";
    }

    function getScheduleRecurrenceLabel(value) {
      if (value === "daily") return "매일";
      if (value === "weekly") return "매주";
      return "한 번";
    }

    function getScheduledJobTargetLabel(job) {
      if (job.payload.includeAllResults) {
        return "전체 결과";
      }
      if ((job.payload.selectedBillIds || []).length > 0) {
        return "선택 " + job.payload.selectedBillIds.length + "건";
      }
      if ((job.payload.items || []).length > 0) {
        return "저장된 " + job.payload.items.length + "건";
      }
      return "검색 조건";
    }

    async function openHtmlPreview() {
      try {
        const response = await fetch("/api/newsletter/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNewsletterPayload({
            includeAll: false,
            useCurrentPageItems: state.selectedBillIds.size === 0,
          })),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "미리보기를 생성하지 못했습니다.");
        }
        previewFrame.srcdoc = data.html;
        previewModal.classList.add("open");
      } catch (error) {
        setStatus(composerStatus, error.message || "미리보기를 생성하지 못했습니다.", "error");
      }
    }

    async function openSendLogHtml(jobId) {
      try {
        if (!jobId) {
          throw new Error("열어볼 발송 로그 jobId가 없습니다.");
        }
        const response = await fetch("/api/newsletter/send-log-artifact?jobId=" + encodeURIComponent(jobId) + "&format=html");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "발송 HTML 스냅샷을 불러오지 못했습니다.");
        }
        const html = await response.text();
        previewFrame.srcdoc = html;
        previewModal.classList.add("open");
      } catch (error) {
        setStatus(composerStatus, error.message || "발송 HTML 스냅샷을 불러오지 못했습니다.", "error");
      }
    }

    async function downloadSendLogMarkdown(jobId) {
      try {
        if (!jobId) {
          throw new Error("내려받을 발송 로그 jobId가 없습니다.");
        }
        const response = await fetch("/api/newsletter/send-log-artifact?jobId=" + encodeURIComponent(jobId) + "&format=markdown");
        await downloadResponseFile(response, "sent-newsletter.md", "발송 Markdown 스냅샷을 불러오지 못했습니다.");
        setStatus(composerStatus, "발송 Markdown 스냅샷을 내려받았습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "발송 Markdown 스냅샷을 불러오지 못했습니다.", "error");
      }
    }

    async function downloadSendLogsCsv() {
      try {
        const params = new URLSearchParams({ limit: "500" });
        if ((state.sendLogFilterText || "").trim()) {
          params.set("text", state.sendLogFilterText.trim());
        }
        if ((state.sendLogFilterStatus || "all") !== "all") {
          params.set("status", state.sendLogFilterStatus);
        }

        const response = await fetch("/api/newsletter/send-logs-export?" + params.toString());
        await downloadResponseFile(response, "send-logs.csv", "발송 로그 CSV를 생성하지 못했습니다.");
        setStatus(composerStatus, "현재 발송 로그 CSV를 내려받았습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "발송 로그 CSV를 생성하지 못했습니다.", "error");
      }
    }

    async function downloadScheduleRunsCsv() {
      try {
        const params = new URLSearchParams({ limit: "500" });
        if (state.scheduleRunFilterJobId) {
          params.set("scheduleJobId", state.scheduleRunFilterJobId);
        }
        if ((state.scheduleRunFilterText || "").trim()) {
          params.set("text", state.scheduleRunFilterText.trim());
        }
        if ((state.scheduleRunFilterStatus || "all") !== "all") {
          params.set("status", state.scheduleRunFilterStatus);
        }

        const response = await fetch("/api/newsletter/schedule-runs-export?" + params.toString());
        await downloadResponseFile(response, "schedule-runs.csv", "예약 실행 이력 CSV를 생성하지 못했습니다.");
        setStatus(composerStatus, "현재 예약 실행 이력 CSV를 내려받았습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 실행 이력 CSV를 생성하지 못했습니다.", "error");
      }
    }

    async function downloadResponseFile(response, fallbackFilename, errorMessage) {
      if (!response.ok) {
        let message = errorMessage;
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          message = errorMessage;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      link.href = url;
      link.download = match ? match[1] : fallbackFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    async function resendSendLog(jobId) {
      try {
        if (!jobId) {
          throw new Error("재전송할 발송 로그 jobId가 없습니다.");
        }
        if (!state.recipients.length) {
          throw new Error("재전송할 수신자 이메일을 먼저 1개 이상 추가해 주세요.");
        }

        const response = await fetch("/api/newsletter/send-log-resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            recipients: state.recipients,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "발송 로그 재전송에 실패했습니다.");
        }

        setStatus(
          composerStatus,
          "발송 로그 재전송 완료 · 성공 " + data.sent + "건 / 실패 " + data.failed + "건",
          data.failed === 0 ? "success" : "error",
        );
        await loadRecipients();
        await loadSendLogs();
      } catch (error) {
        setStatus(composerStatus, error.message || "발송 로그 재전송에 실패했습니다.", "error");
      }
    }

    async function retryFailedSendLog(logId) {
      try {
        if (!logId) {
          throw new Error("재시도할 발송 로그 id가 없습니다.");
        }

        const response = await fetch("/api/newsletter/send-log-retry-failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "실패 수신자 재시도에 실패했습니다.");
        }

        setStatus(
          composerStatus,
          "실패 수신자 재시도 완료 · 성공 " + data.sent + "건 / 실패 " + data.failed + "건",
          data.failed === 0 ? "success" : "error",
        );
        await loadSendLogs();
      } catch (error) {
        setStatus(composerStatus, error.message || "실패 수신자 재시도에 실패했습니다.", "error");
      }
    }

    async function sendNewsletter(includeAll) {
      try {
        if (!includeAll && state.selectedBillIds.size === 0) {
          throw new Error("선택 항목 이메일 발송은 법안을 1건 이상 선택해야 합니다.");
        }
        const response = await fetch("/api/newsletter/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNewsletterPayload({ includeAll })),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "이메일 발송에 실패했습니다.");
        }
        setStatus(
          composerStatus,
          "이메일 발송 완료 · 성공 " + data.sent + "건 / 실패 " + data.failed + "건",
          data.failed === 0 ? "success" : "error",
        );
        await loadRecipients();
        await loadSendLogs();
        await loadOperationalSummary();
      } catch (error) {
        setStatus(composerStatus, error.message || "이메일 발송에 실패했습니다.", "error");
      }
    }

    async function scheduleNewsletter(includeAll) {
      try {
        if (!includeAll && state.selectedBillIds.size === 0) {
          throw new Error("선택 항목 예약 발송은 법안을 1건 이상 선택해야 합니다.");
        }
        if (!scheduleAtInput.value) {
          throw new Error("예약 발송 시각을 입력해 주세요.");
        }
        const schedulePreset = includeAll && schedulePresetSelect.value
          ? state.searchPresets.find((item) => item.id === schedulePresetSelect.value) || null
          : null;
        const onlyNewResults = includeAll && scheduleOnlyNewInput.checked;

        const response = await fetch("/api/newsletter/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: scheduleAtInput.value,
            recurrence: scheduleRecurrenceSelect.value,
            payload: buildNewsletterPayload({ includeAll, schedulePreset, onlyNewResults }),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 등록에 실패했습니다.");
        }

        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        scheduleAtInput.value = getDefaultScheduleAtValue();
        scheduleRecurrenceSelect.value = "once";
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(
          composerStatus,
          buildScheduleRegisteredMessage(schedulePreset, onlyNewResults),
          "success",
        );
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 발송 등록에 실패했습니다.", "error");
      }
    }

    async function downloadMarkdown(includeAll) {
      try {
        if (!includeAll && state.selectedBillIds.size === 0) {
          throw new Error("선택 항목 Markdown 저장은 법안을 1건 이상 선택해야 합니다.");
        }
        const response = await fetch("/api/newsletter/markdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNewsletterPayload({ includeAll })),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Markdown 생성에 실패했습니다.");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="([^"]+)"/);
        link.href = url;
        link.download = match ? match[1] : "legislation-newsletter.md";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus(composerStatus, "Markdown 파일을 생성했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "Markdown 생성에 실패했습니다.", "error");
      }
    }

    function buildQuerySourceFromState() {
      return {
        keyword: state.query.keyword || null,
        datePreset: state.query.datePreset,
        dateFrom: state.query.dateFrom || null,
        dateTo: state.query.dateTo || null,
        noticeScope: state.query.noticeScope,
        sortBy: state.query.sortBy,
        pageSize: state.query.pageSize,
      };
    }

    function buildNewsletterPayloadFromSource(querySource, options) {
      const includeAll = Boolean(options && options.includeAll);
      const useCurrentPageItems = Boolean(options && options.useCurrentPageItems);
      const schedulePreset = options && options.schedulePreset ? options.schedulePreset : null;
      const onlyNewResults = Boolean(options && options.onlyNewResults);
      const recipients = options && Array.isArray(options.recipients)
        ? options.recipients
        : state.recipients;
      const subject = options && typeof options.subject === "string"
        ? options.subject
        : subjectInput.value.trim();
      const introText = options && typeof options.introText === "string"
        ? options.introText
        : introInput.value.trim();
      const outroText = options && typeof options.outroText === "string"
        ? options.outroText
        : outroInput.value.trim();
      const searchPresetId = schedulePreset
        ? schedulePreset.id
        : (options && typeof options.searchPresetId === "string" ? options.searchPresetId : null);
      const searchPresetName = schedulePreset
        ? schedulePreset.name
        : (options && typeof options.searchPresetName === "string" ? options.searchPresetName : null);
      const subscriptionTemplateId = options && typeof options.subscriptionTemplateId === "string"
        ? options.subscriptionTemplateId
        : null;
      const subscriptionTemplateName = options && typeof options.subscriptionTemplateName === "string"
        ? options.subscriptionTemplateName
        : null;
      const selectedRecipientGroup = getSelectedRecipientGroup();
      const hasRecipientGroupId = Boolean(
        options && Object.prototype.hasOwnProperty.call(options, "recipientGroupId"),
      );
      const hasRecipientGroupName = Boolean(
        options && Object.prototype.hasOwnProperty.call(options, "recipientGroupName"),
      );
      const recipientGroupId = hasRecipientGroupId
        ? (options.recipientGroupId || null)
        : (selectedRecipientGroup ? selectedRecipientGroup.id : null);
      const recipientGroupName = hasRecipientGroupName
        ? (options.recipientGroupName || null)
        : (selectedRecipientGroup ? selectedRecipientGroup.name : null);
      const selectedIds = Array.from(state.selectedBillIds);

      return {
        query: {
          keyword: querySource.keyword || undefined,
          datePreset: querySource.datePreset,
          dateFrom: querySource.dateFrom || undefined,
          dateTo: querySource.dateTo || undefined,
          noticeScope: querySource.noticeScope,
          sortBy: querySource.sortBy,
          page: includeAll ? 1 : state.query.page,
          pageSize: includeAll
            ? (schedulePreset ? querySource.pageSize : Math.max(state.total, querySource.pageSize || DEFAULT_PAGE_SIZE))
            : querySource.pageSize,
        },
        items: includeAll
          ? []
          : (useCurrentPageItems ? state.items : Array.from(state.itemCache.values())),
        selectedBillIds: includeAll ? [] : selectedIds,
        recipients,
        subject,
        introText,
        outroText,
        includeAllResults: includeAll,
        onlyNewResults,
        excludeBillIds: [],
        recipientGroupId,
        recipientGroupName,
        searchPresetId,
        searchPresetName,
        subscriptionTemplateId,
        subscriptionTemplateName,
      };
    }

    function buildNewsletterPayload(options) {
      const schedulePreset = options && options.schedulePreset ? options.schedulePreset : null;
      const querySource = schedulePreset
        ? buildSearchQueryFromPreset(schedulePreset)
        : buildQuerySourceFromState();

      return buildNewsletterPayloadFromSource(querySource, options);
    }

    function buildSavedSearchPresetPayload() {
      const isCustom = state.query.datePreset === "custom";
      return {
        keyword: state.query.keyword || null,
        datePreset: state.query.datePreset,
        dateFrom: isCustom ? (state.query.dateFrom || null) : null,
        dateTo: isCustom ? (state.query.dateTo || null) : null,
        noticeScope: state.query.noticeScope,
        sortBy: state.query.sortBy,
        pageSize: state.query.pageSize,
      };
    }

    function buildSubscriptionTemplatePayload() {
      const recipientGroup = getSelectedRecipientGroup();
      const linkedPreset = schedulePresetSelect.value
        ? state.searchPresets.find((item) => item.id === schedulePresetSelect.value) || null
        : null;

      return {
        query: buildSavedSearchPresetPayload(),
        recipientGroupId: recipientGroup ? recipientGroup.id : null,
        recipientGroupName: recipientGroup ? recipientGroup.name : null,
        searchPresetId: linkedPreset ? linkedPreset.id : null,
        searchPresetName: linkedPreset ? linkedPreset.name : null,
        recipients: state.recipients,
        subject: subjectInput.value.trim(),
        introText: introInput.value.trim(),
        outroText: outroInput.value.trim(),
        recurrence: scheduleRecurrenceSelect.value,
        onlyNewResults: scheduleOnlyNewInput.checked,
      };
    }

    async function saveSearchPreset() {
      syncQueryFromInputs();

      if (!presetNameInput.value.trim()) {
        setStatus(searchStatus, "저장할 preset 이름을 입력해 주세요.", "error");
        return;
      }

      if (state.query.datePreset === "custom" && (!state.query.dateFrom || !state.query.dateTo)) {
        setStatus(searchStatus, "직접 지정 기간 preset은 시작일과 종료일을 모두 입력해야 합니다.", "error");
        return;
      }

      try {
        const response = await fetch("/api/search-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: presetNameInput.value.trim(),
            query: buildSavedSearchPresetPayload(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "검색 preset 저장에 실패했습니다.");
        }
        state.searchPresets = data.items || [];
        renderSearchPresets();
        await loadOperationalSummary();
        setStatus(searchStatus, "검색 preset을 저장했습니다.", "success");
      } catch (error) {
        setStatus(searchStatus, error.message || "검색 preset 저장에 실패했습니다.", "error");
      }
    }

    async function saveSubscriptionTemplate() {
      syncQueryFromInputs();

      if (!subscriptionNameInput.value.trim()) {
        setStatus(composerStatus, "저장할 구독 템플릿 이름을 입력해 주세요.", "error");
        return;
      }

      if (!state.recipients.length) {
        setStatus(composerStatus, "구독 템플릿에 포함할 수신자 이메일을 먼저 1개 이상 추가해 주세요.", "error");
        return;
      }

      if (state.query.datePreset === "custom" && (!state.query.dateFrom || !state.query.dateTo)) {
        setStatus(composerStatus, "직접 지정 기간 구독 템플릿은 시작일과 종료일을 모두 입력해야 합니다.", "error");
        return;
      }

      try {
        const response = await fetch("/api/newsletter-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subscriptionNameInput.value.trim(),
            ...buildSubscriptionTemplatePayload(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 저장에 실패했습니다.");
        }

        state.subscriptionTemplates = data.items || [];
        renderSubscriptionTemplates();
        subscriptionNameInput.value = "";
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(composerStatus, "구독 템플릿을 저장했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 저장에 실패했습니다.", "error");
      }
    }

    async function deleteSearchPreset(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/search-presets?id=" + encodeURIComponent(id), {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "검색 preset 삭제에 실패했습니다.");
        }
        state.searchPresets = data.items || [];
        renderSearchPresets();
        await loadOperationalSummary();
        setStatus(searchStatus, "검색 preset을 삭제했습니다.", "success");
      } catch (error) {
        setStatus(searchStatus, error.message || "검색 preset 삭제에 실패했습니다.", "error");
      }
    }

    function applySavedSearchPreset(preset) {
      presetNameInput.value = preset.name;
      applyQuerySnapshot(preset.query, {
        linkedPresetId: preset.id,
        statusMessage: "저장된 검색 preset을 불러왔습니다.",
      });
    }

    function buildSearchQueryFromPreset(preset) {
      return {
        keyword: preset.query.keyword || null,
        datePreset: preset.query.datePreset,
        dateFrom: preset.query.dateFrom || null,
        dateTo: preset.query.dateTo || null,
        noticeScope: preset.query.noticeScope,
        sortBy: preset.query.sortBy,
        pageSize: preset.query.pageSize || DEFAULT_PAGE_SIZE,
      };
    }

    function resolveSubscriptionQuerySource(subscription) {
      const linkedPreset = subscription.searchPresetId
        ? state.searchPresets.find((item) => item.id === subscription.searchPresetId) || null
        : null;
      const linkedRecipientGroup = subscription.recipientGroupId
        ? state.recipientGroups.find((item) => item.id === subscription.recipientGroupId) || null
        : null;

      return {
        linkedRecipientGroup,
        linkedPreset,
        querySource: linkedPreset ? buildSearchQueryFromPreset(linkedPreset) : {
          keyword: subscription.query.keyword || null,
          datePreset: subscription.query.datePreset,
          dateFrom: subscription.query.dateFrom || null,
          dateTo: subscription.query.dateTo || null,
          noticeScope: subscription.query.noticeScope,
          sortBy: subscription.query.sortBy,
          pageSize: subscription.query.pageSize || DEFAULT_PAGE_SIZE,
        },
      };
    }

    async function loadSubscriptionTemplate(id) {
      if (!id) return;

      const subscription = state.subscriptionTemplates.find((item) => item.id === id);
      if (!subscription) {
        setStatus(composerStatus, "선택한 구독 템플릿을 찾지 못했습니다.", "error");
        return;
      }

      const resolved = resolveSubscriptionQuerySource(subscription);
      subscriptionNameInput.value = subscription.name;
      subjectInput.value = subscription.subject || "";
      introInput.value = subscription.introText || "";
      outroInput.value = subscription.outroText || "";
      scheduleRecurrenceSelect.value = subscription.recurrence || "once";
      scheduleOnlyNewInput.checked = subscription.onlyNewResults === true;
      subscriptionRecipientGroupSelect.value = resolved.linkedRecipientGroup ? resolved.linkedRecipientGroup.id : "";
      if (resolved.linkedPreset) {
        presetNameInput.value = resolved.linkedPreset.name;
      }

      applyQuerySnapshot(resolved.linkedPreset ? resolved.linkedPreset.query : subscription.query, {
        linkedPresetId: resolved.linkedPreset ? resolved.linkedPreset.id : "",
        statusMessage: '구독 템플릿 "' + subscription.name + '"을 불러왔습니다.',
      });

      try {
        await syncRecipients(
          resolved.linkedRecipientGroup
            ? (resolved.linkedRecipientGroup.emails || [])
            : (subscription.recipients || []),
        );
        setStatus(composerStatus, '구독 템플릿 "' + subscription.name + '"을 불러왔습니다.', "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 수신자 불러오기에 실패했습니다.", "error");
      }
    }

    function buildNewsletterPayloadFromSubscription(subscription) {
      const resolved = resolveSubscriptionQuerySource(subscription);

      return buildNewsletterPayloadFromSource(resolved.querySource, {
        includeAll: true,
        schedulePreset: resolved.linkedPreset,
        recipients: resolved.linkedRecipientGroup
          ? (resolved.linkedRecipientGroup.emails || [])
          : (subscription.recipients || []),
        subject: subscription.subject || "",
        introText: subscription.introText || "",
        outroText: subscription.outroText || "",
        onlyNewResults: subscription.onlyNewResults === true,
        recipientGroupId: resolved.linkedRecipientGroup
          ? resolved.linkedRecipientGroup.id
          : (subscription.recipientGroupId || null),
        recipientGroupName: resolved.linkedRecipientGroup
          ? resolved.linkedRecipientGroup.name
          : (subscription.recipientGroupName || null),
        searchPresetId: resolved.linkedPreset ? resolved.linkedPreset.id : (subscription.searchPresetId || null),
        searchPresetName: resolved.linkedPreset ? resolved.linkedPreset.name : (subscription.searchPresetName || null),
        subscriptionTemplateId: subscription.id,
        subscriptionTemplateName: subscription.name,
      });
    }

    async function scheduleSubscriptionTemplate(id) {
      if (!id) return;
      if (!scheduleAtInput.value) {
        setStatus(composerStatus, "예약 발송 시각을 입력해 주세요.", "error");
        return;
      }

      const subscription = state.subscriptionTemplates.find((item) => item.id === id);
      if (!subscription) {
        setStatus(composerStatus, "선택한 구독 템플릿을 찾지 못했습니다.", "error");
        return;
      }

      try {
        const resolved = resolveSubscriptionQuerySource(subscription);
        const response = await fetch("/api/newsletter/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: scheduleAtInput.value,
            recurrence: subscription.recurrence || "once",
            payload: buildNewsletterPayloadFromSubscription(subscription),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 예약 등록에 실패했습니다.");
        }

        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        scheduleAtInput.value = getDefaultScheduleAtValue();
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(
          composerStatus,
          buildScheduleRegisteredMessage(resolved.linkedPreset, subscription.onlyNewResults) +
            ' 구독 템플릿 "' + subscription.name + '"을 사용했습니다.',
          "success",
        );
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 예약 등록에 실패했습니다.", "error");
      }
    }

    async function sendSubscriptionTemplate(id) {
      if (!id) return;

      const subscription = state.subscriptionTemplates.find((item) => item.id === id);
      if (!subscription) {
        setStatus(composerStatus, "선택한 구독 템플릿을 찾지 못했습니다.", "error");
        return;
      }

      try {
        const response = await fetch("/api/newsletter/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNewsletterPayloadFromSubscription(subscription)),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 즉시 발송에 실패했습니다.");
        }

        setStatus(
          composerStatus,
          '구독 템플릿 "' + subscription.name + '" 즉시 발송 완료 · 성공 ' + data.sent + '건 / 실패 ' + data.failed + '건',
          data.failed === 0 ? "success" : "error",
        );
        await loadRecipients();
        await loadSendLogs();
        await loadOperationalSummary();
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 즉시 발송에 실패했습니다.", "error");
      }
    }

    async function downloadSubscriptionMarkdown(id) {
      if (!id) return;

      const subscription = state.subscriptionTemplates.find((item) => item.id === id);
      if (!subscription) {
        setStatus(composerStatus, "선택한 구독 템플릿을 찾지 못했습니다.", "error");
        return;
      }

      try {
        const response = await fetch("/api/newsletter/markdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNewsletterPayloadFromSubscription(subscription)),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "구독 템플릿 Markdown 생성에 실패했습니다.");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="([^"]+)"/);
        link.href = url;
        link.download = match ? match[1] : "legislation-newsletter.md";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus(
          composerStatus,
          '구독 템플릿 "' + subscription.name + '" Markdown 파일을 생성했습니다.',
          "success",
        );
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 Markdown 생성에 실패했습니다.", "error");
      }
    }

    async function deleteSubscriptionTemplate(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/newsletter-subscriptions?id=" + encodeURIComponent(id), {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 삭제에 실패했습니다.");
        }

        state.subscriptionTemplates = data.items || [];
        renderSubscriptionTemplates();
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(composerStatus, "구독 템플릿을 삭제했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "구독 템플릿 삭제에 실패했습니다.", "error");
      }
    }

    function buildScheduleRegisteredMessage(schedulePreset, onlyNewResults) {
      const base = schedulePreset
        ? 'preset "' + schedulePreset.name + '" 기준 예약 발송을 등록했습니다.'
        : "예약 발송을 등록했습니다.";
      return onlyNewResults ? (base + " 새로 발견된 법안만 발송합니다.") : base;
    }

    function updateComposerStatus() {
      const selectedCount = state.selectedBillIds.size;
      const base =
        "현재 페이지 " + state.items.length + "건 · 전체 " + state.total + "건 · 선택 " + selectedCount + "건 · 수신자 " + state.recipients.length + "명";
      setStatus(composerStatus, base, "success");
    }

    function getNoticeScopeLabel(value) {
      return value === "active_only" ? "진행중만" : "진행중 + 종료 포함";
    }

    function getSortByLabel(value) {
      if (value === "notice_end_desc") return "종료일 최신순";
      if (value === "notice_end_asc") return "종료일 오래된순";
      return "관련도 순";
    }

    async function loadSearchPresets() {
      try {
        const response = await fetch("/api/search-presets");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "검색 preset 목록을 불러오지 못했습니다.");
        }
        state.searchPresets = data.items || [];
        renderSearchPresets();
      } catch (error) {
        savedSearchList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "검색 preset 목록을 불러오지 못했습니다.") + '</span>';
      }
    }

    async function loadRecipients() {
      try {
        const response = await fetch("/api/recipients");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "수신자 목록을 불러오지 못했습니다.");
        }
        state.recipients = (data.items || []).map((item) => item.email);
        renderRecipients();
        updateComposerStatus();
      } catch (error) {
        setStatus(composerStatus, error.message || "수신자 목록을 불러오지 못했습니다.", "error");
      }
    }

    async function loadRecipientGroups() {
      try {
        const response = await fetch("/api/recipient-groups");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "수신자 그룹 목록을 불러오지 못했습니다.");
        }
        state.recipientGroups = data.items || [];
        renderRecipientGroups();
      } catch (error) {
        savedRecipientGroupList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "수신자 그룹 목록을 불러오지 못했습니다.") + '</span>';
      }
    }

    async function loadSubscriptionTemplates() {
      try {
        const response = await fetch("/api/newsletter-subscriptions");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 목록을 불러오지 못했습니다.");
        }
        state.subscriptionTemplates = data.items || [];
        renderSubscriptionTemplates();
      } catch (error) {
        subscriptionFilterMeta.textContent = error.message || "구독 템플릿 목록을 불러오지 못했습니다.";
        savedSubscriptionList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "구독 템플릿 목록을 불러오지 못했습니다.") + '</span>';
      }
    }

    async function loadSubscriptionActivities() {
      try {
        const response = await fetch("/api/newsletter-subscription-activity");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "구독 템플릿 활동 요약을 불러오지 못했습니다.");
        }

        const activityById = {};
        (data.items || []).forEach((item) => {
          if (item && typeof item.subscriptionId === "string" && item.subscriptionId) {
            activityById[item.subscriptionId] = item;
          }
        });
        state.subscriptionActivityById = activityById;
        renderSubscriptionTemplates();
      } catch {
        state.subscriptionActivityById = {};
        renderSubscriptionTemplates();
      }
    }

    async function loadOperationalSummary() {
      try {
        const response = await fetch("/api/newsletter/summary");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "운영 요약을 불러오지 못했습니다.");
        }
        state.operationalSummary = data;
        renderOperationalSummary();
      } catch (error) {
        if (!state.operationalSummary) {
          operationalSummaryGrid.innerHTML =
            '<div class="summary-empty">' + escapeHtml(error.message || "운영 요약을 불러오지 못했습니다.") + '</div>';
        }
      }
    }

    async function loadSchedules() {
      try {
        const response = await fetch("/api/newsletter/schedules?limit=8");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 목록을 불러오지 못했습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        await loadSubscriptionActivities();
      } catch (error) {
        scheduleList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "예약 발송 목록을 불러오지 못했습니다.") + '</span>';
      }
    }

    async function loadScheduleRuns() {
      try {
        const params = new URLSearchParams({ limit: "8" });
        if (state.scheduleRunFilterJobId) {
          params.set("scheduleJobId", state.scheduleRunFilterJobId);
        }
        const response = await fetch("/api/newsletter/schedule-runs?" + params.toString());
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 실행 이력을 불러오지 못했습니다.");
        }
        state.scheduleRunLogs = data.items || [];
        renderScheduleRuns();
        await loadSubscriptionActivities();
      } catch (error) {
        scheduleRunFilterMeta.textContent = error.message || "예약 실행 이력을 불러오지 못했습니다.";
        scheduleRunList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "예약 실행 이력을 불러오지 못했습니다.") + '</span>';
      }
    }

    async function setScheduleRunFilter(jobId) {
      state.scheduleRunFilterJobId = jobId || "";
      renderScheduleJobs();
      await loadScheduleRuns();
    }

    async function clearScheduleRunFilter() {
      state.scheduleRunFilterJobId = "";
      renderScheduleJobs();
      await loadScheduleRuns();
    }

    async function cancelScheduledJob(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/newsletter/schedules?id=" + encodeURIComponent(id), {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 취소에 실패했습니다.");
        }
        if (!data.cancelled) {
          throw new Error("대기 중이거나 일시정지된 예약만 취소할 수 있습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(composerStatus, "예약 발송을 취소했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 발송 취소에 실패했습니다.", "error");
      }
    }

    async function pauseScheduledJob(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/newsletter/schedules/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 일시정지에 실패했습니다.");
        }
        if (!data.paused) {
          throw new Error("대기 중인 예약만 일시정지할 수 있습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(composerStatus, "예약 발송을 일시정지했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 발송 일시정지에 실패했습니다.", "error");
      }
    }

    async function resumeScheduledJob(id) {
      if (!id) return;

      try {
        const response = await fetch("/api/newsletter/schedules/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 재개에 실패했습니다.");
        }
        if (!data.resumed) {
          throw new Error("일시정지 또는 실패 상태의 예약만 다시 대기할 수 있습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        await loadSubscriptionActivities();
        await loadOperationalSummary();
        setStatus(composerStatus, "예약 발송을 다시 대기 상태로 돌렸습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 발송 재개에 실패했습니다.", "error");
      }
    }

    async function loadSendLogs() {
      try {
        const response = await fetch("/api/newsletter/send-logs?limit=8");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "발송 로그를 불러오지 못했습니다.");
        }
        state.sendLogs = data.items || [];
        renderSendLogs();
      } catch (error) {
        sendLogFilterMeta.textContent = error.message || "발송 로그를 불러오지 못했습니다.";
        sendLogList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "발송 로그를 불러오지 못했습니다.") + '</span>';
      }
    }

    function setStatus(element, message, tone) {
      element.textContent = message || "";
      element.className = "status-line" + (tone ? " " + tone : "");
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }
  </script>
</body>
</html>`;
}
