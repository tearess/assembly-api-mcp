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

    .saved-preset-meta {
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.5;
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

    .log-status.failed {
      color: var(--danger);
    }

    .log-status.cancelled {
      color: var(--muted);
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

          <div class="recipient-row">
            <input id="recipientInput" type="email" placeholder="recipient@example.com">
            <button id="addRecipientBtn" class="accent-btn" type="button">이메일 추가</button>
          </div>
          <div class="chip-list" id="recipientList"></div>

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
          <div class="status-line" id="composerStatus"></div>
          <div class="log-list" id="scheduleList">
            <span class="subtle">예약 발송 목록을 불러오는 중입니다.</span>
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
      scheduleJobs: [],
      recipients: [],
      sendLogs: [],
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
    const scheduleAtInput = document.getElementById("scheduleAtInput");
    const scheduleRecurrenceSelect = document.getElementById("scheduleRecurrenceSelect");
    const schedulePresetSelect = document.getElementById("schedulePresetSelect");
    const scheduleOnlyNewInput = document.getElementById("scheduleOnlyNewInput");
    const scheduleList = document.getElementById("scheduleList");
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
    renderRecipients();
    renderScheduleJobs();
    renderSendLogs();
    renderResults();
    renderPagination();
    renderSearchPresets();
    renderSchedulePresetOptions();
    void loadSearchPresets();
    void loadSchedules();
    void loadRecipients();
    void loadSendLogs();
    window.setInterval(() => {
      void loadSchedules();
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
        renderRecipients();
        updateComposerStatus();
      } catch (error) {
        setStatus(composerStatus, error.message || "이메일 저장에 실패했습니다.", "error");
      }
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
            renderRecipients();
            updateComposerStatus();
          } catch (error) {
            setStatus(composerStatus, error.message || "이메일 삭제에 실패했습니다.", "error");
          }
        });
      });
    }

    function renderSendLogs() {
      if (!state.sendLogs.length) {
        sendLogList.innerHTML = '<span class="subtle">아직 발송 로그가 없습니다.</span>';
        return;
      }

      sendLogList.innerHTML = state.sendLogs.map((log) => {
        const tone = log.status === "failed" ? "failed" : "sent";
        const label = log.status === "failed" ? "발송 실패" : "발송 완료";
        const detail = log.errorMessage ? '<div class="log-meta">' + escapeHtml(log.errorMessage) + '</div>' : '';
        const actions = log.snapshotAvailable
          ? '<div class="saved-preset-actions" style="justify-content: flex-start;">' +
              '<button type="button" class="ghost-btn" data-open-log-html="' + escapeHtml(log.jobId) + '">HTML 보기</button>' +
              '<button type="button" class="ghost-btn" data-download-log-markdown="' + escapeHtml(log.jobId) + '">Markdown 저장</button>' +
              '<button type="button" class="ghost-btn" data-resend-log="' + escapeHtml(log.jobId) + '">현재 수신자에게 재전송</button>' +
            '</div>'
          : '<div class="log-meta">발송 스냅샷이 없습니다.</div>';
        return '<div class="log-item">' +
          '<strong>' + escapeHtml(log.subject || "입법예고 뉴스레터") + '</strong>' +
          '<div class="log-meta">수신자 ' + escapeHtml(log.recipientEmail) + ' · 법안 ' + escapeHtml(String(log.itemCount || 0)) + '건 · ' + escapeHtml(log.sentAt || "") + '</div>' +
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

      sendLogList.querySelectorAll("button[data-resend-log]").forEach((button) => {
        button.addEventListener("click", async () => {
          await resendSendLog(button.dataset.resendLog);
        });
      });
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
        const cancelButton = (job.status === "pending" || job.status === "failed")
          ? '<button type="button" class="danger-btn" data-cancel-schedule="' + escapeHtml(job.id) + '">예약 취소</button>'
          : '';
        const presetMeta = job.payload.searchPresetName
          ? ' · 기준 preset ' + escapeHtml(job.payload.searchPresetName)
          : '';
        const newOnlyMeta = job.payload.onlyNewResults
          ? ' · 새 법안만'
          : '';
        return '<div class="log-item">' +
          '<strong>' + escapeHtml(job.payload.subject || "입법예고 뉴스레터") + '</strong>' +
          '<div class="log-meta">예약 시각 ' + escapeHtml(formatScheduledAt(job.scheduledAt)) +
          ' · 반복 ' + escapeHtml(getScheduleRecurrenceLabel(job.recurrence)) +
          presetMeta +
          newOnlyMeta +
          ' · 수신자 ' + escapeHtml(String((job.payload.recipients || []).length)) + '명' +
          ' · 대상 ' + escapeHtml(getScheduledJobTargetLabel(job)) + '</div>' +
          '<div class="log-status ' + escapeHtml(job.status) + '">' + escapeHtml(status) + '</div>' +
          lastProcessed +
          lastResult +
          (cancelButton ? '<div class="saved-preset-actions" style="justify-content: flex-start;">' + cancelButton + '</div>' : '') +
          '</div>';
      }).join("");

      scheduleList.querySelectorAll("button[data-cancel-schedule]").forEach((button) => {
        button.addEventListener("click", async () => {
          await cancelScheduledJob(button.dataset.cancelSchedule);
        });
      });
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
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "발송 Markdown 스냅샷을 불러오지 못했습니다.");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="([^"]+)"/);
        link.href = url;
        link.download = match ? match[1] : "sent-newsletter.md";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus(composerStatus, "발송 Markdown 스냅샷을 내려받았습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "발송 Markdown 스냅샷을 불러오지 못했습니다.", "error");
      }
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

    function buildNewsletterPayload(options) {
      const includeAll = Boolean(options && options.includeAll);
      const useCurrentPageItems = Boolean(options && options.useCurrentPageItems);
      const schedulePreset = options && options.schedulePreset ? options.schedulePreset : null;
      const onlyNewResults = Boolean(options && options.onlyNewResults);
      const querySource = schedulePreset
        ? buildSearchQueryFromPreset(schedulePreset)
        : {
            keyword: state.query.keyword || null,
            datePreset: state.query.datePreset,
            dateFrom: state.query.dateFrom || null,
            dateTo: state.query.dateTo || null,
            noticeScope: state.query.noticeScope,
            sortBy: state.query.sortBy,
            pageSize: state.query.pageSize,
          };
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
            ? (schedulePreset ? querySource.pageSize : Math.max(state.total, state.query.pageSize))
            : querySource.pageSize,
        },
        items: includeAll
          ? []
          : (useCurrentPageItems ? state.items : Array.from(state.itemCache.values())),
        selectedBillIds: includeAll ? [] : selectedIds,
        recipients: state.recipients,
        subject: subjectInput.value.trim(),
        introText: introInput.value.trim(),
        outroText: outroInput.value.trim(),
        includeAllResults: includeAll,
        onlyNewResults,
        excludeBillIds: [],
        searchPresetId: schedulePreset ? schedulePreset.id : null,
        searchPresetName: schedulePreset ? schedulePreset.name : null,
      };
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
        setStatus(searchStatus, "검색 preset을 저장했습니다.", "success");
      } catch (error) {
        setStatus(searchStatus, error.message || "검색 preset 저장에 실패했습니다.", "error");
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
        setStatus(searchStatus, "검색 preset을 삭제했습니다.", "success");
      } catch (error) {
        setStatus(searchStatus, error.message || "검색 preset 삭제에 실패했습니다.", "error");
      }
    }

    function applySavedSearchPreset(preset) {
      presetNameInput.value = preset.name;
      schedulePresetSelect.value = preset.id;
      keywordInput.value = preset.query.keyword || "";
      noticeScopeSelect.value = preset.query.noticeScope;
      sortBySelect.value = preset.query.sortBy;
      pageSizeSelect.value = String(preset.query.pageSize || DEFAULT_PAGE_SIZE);

      if (preset.query.datePreset === "custom") {
        applyPreset("custom");
        dateFromInput.value = preset.query.dateFrom || "";
        dateToInput.value = preset.query.dateTo || "";
        state.query.dateFrom = preset.query.dateFrom || "";
        state.query.dateTo = preset.query.dateTo || "";
      } else {
        applyPreset(preset.query.datePreset);
      }

      startNewSearch();
      setStatus(searchStatus, "저장된 검색 preset을 불러왔습니다.", "success");
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

    async function loadSchedules() {
      try {
        const response = await fetch("/api/newsletter/schedules?limit=8");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "예약 발송 목록을 불러오지 못했습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
      } catch (error) {
        scheduleList.innerHTML = '<span class="subtle">' + escapeHtml(error.message || "예약 발송 목록을 불러오지 못했습니다.") + '</span>';
      }
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
          throw new Error("대기 중인 예약만 취소할 수 있습니다.");
        }
        state.scheduleJobs = data.items || [];
        renderScheduleJobs();
        setStatus(composerStatus, "예약 발송을 취소했습니다.", "success");
      } catch (error) {
        setStatus(composerStatus, error.message || "예약 발송 취소에 실패했습니다.", "error");
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
