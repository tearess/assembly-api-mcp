# 입법예고 뉴스레터 GUI 시스템 개발계획서

작성일: 2026-04-20
대상 저장소: `assembly-api-mcp`

## 1. 프로젝트 개요

이 시스템의 목적은 사용자가 입력한 키워드와 기간을 기준으로 국회 입법예고 법안을 검색하고, 관련 법안 목록을 GUI에서 확인한 뒤 HTML 이메일 뉴스레터로 발송하거나 Markdown 문서로 내려받을 수 있게 하는 것입니다.

현재 저장소는 국회 Open API를 감싼 TypeScript 기반 MCP/HTTP 서버이므로, 이번 기능은 기존 국회 API 접근 로직을 재사용하면서 별도의 웹 UI와 이메일 발송 계층을 추가하는 방식으로 설계하는 것이 가장 안전합니다.

## 2. 목표

### 핵심 목표

- 키워드와 날짜 조건으로 입법예고 법안 검색
- 기본 기간은 "현재 시점 기준 최근 1개월"
- 날짜 프리셋 제공: `6개월`, `3개월`, `1개월`, `3주`, `2주`, `1주`
- 사용자가 직접 시작일과 종료일 지정 가능
- 검색 결과를 GUI 리스트로 표시
- 검색 결과 전체 또는 일부 선택 후 HTML 이메일 발송
- 같은 결과를 Markdown 파일로 저장
- 이메일 수신자는 여러 명을 자유롭게 추가 가능

### 결과 리스트에 포함할 정보

- 입법예고 법률 제목
- 발의한 의원
- 발의한 또는 심의하는 소관 상임위원회
- 현재 입법예고 단계
- 입법예고안의 내용

## 3. 요구사항 정리

### 사용자 흐름

1. 사용자가 키워드를 입력한다.
2. 사용자가 날짜 프리셋을 선택하거나 직접 기간을 지정한다.
3. 검색 버튼을 누르면 관련 입법예고 리스트가 나타난다.
4. 사용자는 결과 전체를 이메일로 보내거나, 일부 항목만 선택해서 보낼 수 있다.
5. 사용자는 동일한 결과를 Markdown 파일로도 저장할 수 있다.
6. 수신 이메일은 1개 이상 자유롭게 추가할 수 있다.

### MVP 범위

- 수동 검색
- 수동 선택
- 수동 이메일 발송
- Markdown 다운로드
- 다중 수신자 관리
- 검색 결과 미리보기

### 2차 확장 범위

- 저장된 키워드/수신자 조합
- 정기 뉴스레터 자동 발송
- 발송 이력 관리
- 키워드별 구독 그룹
- 중복 발송 방지

## 4. 기존 코드와의 연결 방식

현재 저장소에는 이미 다음 자산이 있습니다.

- 국회 Open API 공통 클라이언트: `src/api/client.ts`
- 입법예고 조회 도구: `src/tools/legislation.ts`
- 의안 상세 조회 도구: `src/tools/bills.ts`
- 의안 심사/이력 조회 도구: `src/tools/bill-extras.ts`
- HTTP 서버 진입점: `src/server.ts`

즉, 이번 기능은 국회 데이터 수집 로직을 새로 만들기보다, 기존 API 클라이언트를 재사용하는 서비스 계층을 추가하는 형태가 적합합니다.

권장 방향은 다음과 같습니다.

- MCP 서버는 유지
- 별도의 웹 애플리케이션 계층 추가
- 웹 계층은 기존 `createApiClient()`를 직접 사용
- 이메일 렌더링과 Markdown 렌더링은 같은 데이터 모델을 공유

## 5. 권장 아키텍처

### 전체 구조

1. `국회 API 수집 계층`
2. `입법예고 정규화/보강 계층`
3. `검색 및 관련도 판정 계층`
4. `HTML 이메일/Markdown 렌더링 계층`
5. `웹 GUI`
6. `이메일 발송 및 로그 저장 계층`

### 권장 기술 스택

- 백엔드: Node.js + TypeScript
- 웹 UI: React + TypeScript + Vite
- API 서버: Fastify 또는 Express
- 이메일 발송: SMTP 기반 `nodemailer` 또는 이메일 제공자 어댑터
- 저장소: SQLite로 시작, 운영 시 PostgreSQL 전환 가능 구조 권장

### 권장 저장 구조

- `recipients`: 수신자 목록
- `recipient_groups`: 수신자 그룹
- `newsletter_jobs`: 생성된 뉴스레터 메타데이터
- `newsletter_items`: 뉴스레터에 포함된 법안 항목
- `send_logs`: 발송 결과 로그

## 6. 데이터 수집 및 보강 설계

### 1차 수집

우선 진행중 입법예고 API를 사용해 후보 목록을 조회합니다.

- 기본 소스: `LEGISLATION_ACTIVE`
- 필요 시 종료 입법예고까지 확장: `LEGISLATION_CLOSED`

### 2차 보강

입법예고 API만으로는 사용자가 원하는 정보가 충분하지 않을 수 있으므로, 아래 API를 조합해 보강합니다.

- 의안 상세: `BILLINFODETAIL`
- 의안 접수/처리 이력: `BILLRCP`
- 의안 심사 정보: `BILLJUDGE`

### 필드 매핑 계획

| 화면/뉴스레터 필드 | 1차 소스 | 2차 보강 | 비고 |
|---|---|---|---|
| 법안 제목 | 입법예고 API `BILL_NAME` | - | 기본 사용 |
| 발의 의원 | 입법예고 API `PROPOSER` | 의안 상세 | 누락 시 보강 |
| 소관 상임위 | 입법예고 API `CURR_COMMITTEE` | 의안 심사/상세 | 표기 정규화 |
| 현재 단계 | 입법예고 API + 의안 이력 | 심사/처리 이력 | 단계 매핑 룰 필요 |
| 입법예고안 내용 | 의안 상세 `제안이유/주요내용` | `LINK_URL` 본문 추출 검토 | 가장 중요한 보강 항목 |
| 상세 링크 | 입법예고 API `LINK_URL` | 의안 상세 링크 | 이메일/미리보기에서 사용 |

### 관련성 판정 방식

사용자가 말한 "관련성이 있는" 검색을 구현하려면 단순 제목 검색만으로는 부족할 수 있습니다.

권장 방식은 아래와 같습니다.

1. 제목 기반 1차 필터
2. 제안이유/주요내용 기반 2차 키워드 매칭
3. 점수화 후 관련도 순 정렬

MVP에서는 규칙 기반 검색으로 시작합니다.

- 법안명 일치 가중치
- 주요내용 일치 가중치
- 위원회/발의자 메타데이터 보조 점수

고도화 단계에서는 의미 기반 검색을 별도 옵션으로 붙일 수 있습니다.

## 7. 날짜 처리 설계

### 기본 동작

- 사용자가 날짜를 지정하지 않으면 실행 시점 기준 최근 1개월
- 시간대 기준은 `Asia/Seoul`

### 프리셋 버튼

- 최근 6개월
- 최근 3개월
- 최근 1개월
- 최근 3주
- 최근 2주
- 최근 1주

### 사용자 지정

- 시작일
- 종료일

### 주의사항

현재 코드의 `get_legislation_notices`는 `START_DT`, `END_DT`를 전달하도록 되어 있지만, 문서상 확인된 주요 파라미터는 `NOTI_ED_DT` 중심입니다. 따라서 실제 API가 기간 파라미터를 안정적으로 지원하는지 먼저 재검증해야 합니다.

기간 파라미터가 충분하지 않으면 다음 방식으로 우회합니다.

- 페이지 단위로 데이터를 수집
- `NOTI_ED_DT` 기준 클라이언트 또는 서버에서 후처리 필터링

## 8. GUI 설계

### 화면 구성

#### A. 검색 패널

- 키워드 입력창
- 날짜 프리셋 버튼 그룹
- 시작일/종료일 직접 입력
- 검색 버튼
- 초기화 버튼

#### B. 결과 리스트

- 체크박스 선택
- 법안 제목
- 발의 의원
- 소관 상임위
- 현재 단계
- 입법예고 종료일
- 관련도 점수
- 상세 보기 버튼

#### C. 상세 미리보기 패널

- 법안 기본 정보
- 입법예고안 내용 요약
- 원문 링크
- 이메일 포함 여부 토글

#### D. 발송/내보내기 패널

- 수신 이메일 다중 입력
- 저장된 수신자 그룹 선택
- 전체 발송 버튼
- 선택 항목만 발송 버튼
- Markdown 다운로드 버튼
- HTML 미리보기 버튼

### UX 원칙

- 기본값만으로 바로 검색 가능해야 함
- 선택/해제 흐름이 단순해야 함
- 이메일 발송 전에 미리보기 확인 가능해야 함
- 수신자 추가는 태그 입력 방식이 적합

## 9. 이메일 및 Markdown 설계

### 렌더링 원칙

같은 뉴스레터 데이터 모델에서 아래 두 포맷을 동시에 생성합니다.

- HTML 이메일 본문
- Markdown 다운로드 파일

이렇게 해야 HTML과 Markdown 내용이 서로 어긋나지 않습니다.

### 이메일 구성 예시

- 뉴스레터 제목
- 검색 조건 요약
- 생성 시각
- 법안 카드 또는 표 형식 목록
- 각 법안별 핵심 정보
- 원문 링크

### Markdown 구성 예시

- 제목
- 기간/키워드
- 총 결과 수
- 선택된 법안 목록
- 각 법안별 요약 섹션

### 발송 방식

1. 전체 검색 결과 발송
2. 사용자가 체크한 선택 결과만 발송

### 이메일 수신자 설계

- 자유 입력 다중 이메일
- 이메일 주소 검증
- 중복 제거
- 수신자 그룹 저장
- 추후 `To`, `Cc`, `Bcc` 확장 가능 구조

## 10. 백엔드 API 설계 초안

### 검색 API

- `POST /api/legislation/search`
- 입력: `keyword`, `datePreset`, `dateFrom`, `dateTo`, `page`, `pageSize`
- 출력: 정규화된 입법예고 리스트

### 상세 보강 API

- `GET /api/legislation/:billId`
- 출력: 법안 상세, 현재 단계, 입법예고안 내용 요약

### 이메일 발송 API

- `POST /api/newsletters/send`
- 입력: 수신자 목록, 검색 조건, 선택한 billId 목록, 메일 제목
- 출력: 발송 결과, 실패 대상, 로그 ID

### Markdown 생성 API

- `POST /api/newsletters/markdown`
- 입력: 검색 조건 또는 선택한 billId 목록
- 출력: Markdown 파일 스트림 또는 텍스트

### 수신자 관리 API

- `GET /api/recipients`
- `POST /api/recipients`
- `PATCH /api/recipients/:id`
- `DELETE /api/recipients/:id`

## 11. 제안 디렉터리 구조

```text
src/
  api/
  newsletter/
    legislation-search.ts
    legislation-enricher.ts
    legislation-stage.ts
    relevance.ts
    types.ts
    render/
      html.ts
      markdown.ts
    email/
      sender.ts
      templates.ts
    repositories/
      recipients.ts
      send-logs.ts
  web-api/
    routes/
      legislation.ts
      newsletters.ts
      recipients.ts
web/
  src/
    pages/
      LegislationNewsletterPage.tsx
    components/
      SearchPanel.tsx
      DatePresetBar.tsx
      LegislationTable.tsx
      BillPreviewDrawer.tsx
      RecipientInput.tsx
      NewsletterPreviewModal.tsx
```

## 12. 개발 단계

### Phase 1. 데이터 검증 및 설계 확정

- 입법예고 API 실제 기간 필터 동작 검증
- `입법예고안 내용` 확보 경로 검증
- `현재 단계` 산출 규칙 정의
- 이메일 발송 인프라 선택

완료 기준:

- 필요한 필드별 데이터 출처가 확정됨
- 누락 필드에 대한 fallback 전략이 문서화됨

### Phase 2. 백엔드 검색/정규화 계층 구현

- 입법예고 검색 서비스 작성
- 의안 상세/심사/이력 보강 작성
- 관련도 점수 계산 작성
- 응답 DTO 정규화

완료 기준:

- 키워드/기간으로 결과를 안정적으로 반환
- 리스트에 필요한 핵심 필드가 모두 채워짐

### Phase 3. GUI 구현

- 검색 화면 구성
- 결과 리스트 및 체크 선택 구현
- 상세 미리보기 구현
- 수신자 입력 UI 구현

완료 기준:

- GUI에서 검색, 선택, 미리보기까지 가능

### Phase 4. 이메일/Markdown 구현

- HTML 뉴스레터 렌더러 구현
- Markdown 렌더러 구현
- 이메일 발송 서비스 구현
- 발송 결과 화면 반영

완료 기준:

- 전체/선택 발송 가능
- Markdown 다운로드 가능

### Phase 5. 수신자/로그 관리

- 수신자 저장
- 수신자 그룹 저장
- 발송 로그 저장
- 실패 재시도 정책 추가

완료 기준:

- 이메일 추가/수정/삭제 가능
- 발송 이력 추적 가능

### Phase 6. 테스트 및 배포

- 단위 테스트
- API 통합 테스트
- 렌더링 스냅샷 테스트
- SMTP 또는 제공자 샌드박스 테스트
- 운영 배포 문서화

완료 기준:

- 핵심 시나리오가 테스트로 보호됨
- 운영 환경 변수와 배포 절차가 정리됨

## 13. 주요 리스크와 대응

### 1. 입법예고 API의 필드 부족

위험:
- 사용자가 원하는 "입법예고안 내용"이 직접 제공되지 않을 수 있음

대응:
- `BILLINFODETAIL` 우선 사용
- 부족하면 `LINK_URL` 기반 본문 추출 검토
- 내용 요약 필드를 별도 정규화

### 2. 날짜 필터의 불확실성

위험:
- 실제 API에서 기간 파라미터가 제한적일 수 있음

대응:
- API 파라미터 검증
- 후처리 필터링
- 페이지네이션/캐시 설계

### 3. API 월간 호출 한도

위험:
- 개발계정 기준 월 10,000회 제한으로 보강 조회가 많으면 금방 소진될 수 있음

대응:
- 검색 결과 캐싱
- 상세 보강 지연 로딩
- 선택된 항목 우선 보강
- 발송 직전 최종 보강

### 4. 이메일 호환성

위험:
- 이메일 클라이언트별 HTML 렌더링 차이

대응:
- 단순한 구조의 인라인 스타일 사용
- Outlook/Gmail 기준 테스트
- Markdown 다운로드를 보조 수단으로 제공

## 14. 비기능 요구사항

- 모든 날짜는 KST 기준으로 처리
- 검색 응답은 가능한 한 3초 이내 목표
- 결과 리스트는 페이지네이션 지원
- 이메일 주소 형식 검증 필수
- 실패한 발송 대상은 사용자에게 명확히 표시
- 민감 정보는 `.env`로 분리
- API 키와 메일 인증 정보는 로그에 남기지 않음

## 15. 구현 우선순위 제안

### 1순위

- 검색
- 결과 리스트
- 선택 발송
- Markdown 다운로드

### 2순위

- 수신자 그룹 관리
- HTML 미리보기 개선
- 발송 로그

### 3순위

- 자동 스케줄 발송
- 키워드별 구독
- 고도화된 관련도 검색

## 16. 확인 질문

아래 항목은 구현 전 확정이 필요합니다.

1. `현재 입법예고 단계`는 `진행중/종료` 같은 입법예고 상태를 의미하는지, 아니면 `접수-위원회 심사-법사위-본회의` 같은 국회 의안 처리 단계까지 포함해야 하는지 확인이 필요합니다.
2. 이메일 발송은 우선 사용자가 버튼을 눌러 보내는 수동 방식만 있으면 되는지, 아니면 매일/매주 자동 발송까지 처음부터 포함해야 하는지 확인이 필요합니다.
3. 이메일 발송 수단은 일반 SMTP를 사용할지, AWS SES/Resend/SendGrid 같은 외부 서비스 사용이 가능한지 확인이 필요합니다.
4. 이 도구가 내부 1인 사용 도구인지, 여러 사용자가 함께 쓰는 서비스인지에 따라 로그인/권한 설계 범위가 달라집니다.

## 17. 결론

이 기능은 현재 저장소를 완전히 갈아엎지 않고도 충분히 확장 가능합니다. 핵심은 `입법예고 목록 조회`만으로 끝내지 않고, `의안 상세/심사/이력`을 조합해 뉴스레터에 필요한 정보로 정규화하는 것입니다.

가장 현실적인 개발 순서는 `검색 서비스 확정 -> GUI 구현 -> 이메일/Markdown 렌더링 -> 수신자/로그 관리` 순서이며, 자동 발송은 2차 단계로 두는 것이 안정적입니다.

## 18. MVP 기본 결정안

질문에 대한 답을 기다리기보다 개발을 진행할 수 있도록, MVP 기준 기본 결정을 아래처럼 둡니다.

### 기본 가정

- 사용자 유형: 우선 `내부 1인 또는 소수 운영자용`
- 발송 방식: 우선 `수동 발송`
- 이메일 인프라: 우선 `SMTP 어댑터` 기반
- 로그인: MVP에서는 `없음`
- 현재 단계 표기: `입법예고 상태 + 의안 처리 상태`를 함께 보여주는 혼합형

### 단계 표기 권장안

사용자가 원하는 `현재 입법예고 단계`는 아래처럼 2단 구조로 보여주는 것이 가장 오해가 적습니다.

- 1차 배지: `입법예고 진행중`, `입법예고 종료`
- 2차 보조 텍스트: `접수`, `소관위 심사`, `법사위 심사`, `본회의`, `정부이송`, `공포`, `폐기` 등

예시:

- `입법예고 진행중 / 소관위 심사`
- `입법예고 종료 / 접수`
- `입법예고 종료 / 본회의 의결`

이 방식이면 입법예고 상태와 실제 의안 처리 상태를 동시에 보여줄 수 있습니다.

## 19. 화면 와이어프레임 초안

### 메인 페이지

```text
+--------------------------------------------------------------------------------------+
| 입법예고 뉴스레터 생성기                                               [설정] [도움말] |
+--------------------------------------------------------------------------------------+
| 키워드 [____________________________]  기간 [1개월▼]  [시작일] ~ [종료일]  [검색] [초기화] |
| 프리셋  [6개월] [3개월] [1개월] [3주] [2주] [1주]                                   |
+--------------------------------------------------------------------------------------+
| 검색 결과 24건                                                        [전체선택] [해제] |
|--------------------------------------------------------------------------------------|
| [ ] | 법안 제목                     | 발의 의원 | 소관위       | 상태                |
| [ ] | 인공지능 산업 진흥법 일부개정안 | 홍길동    | 과방위       | 진행중 / 소관위 심사 |
| [ ] | ...                                                                          |
|--------------------------------------------------------------------------------------|
| 페이지네이션                                                                     1 2 3 |
+------------------------------------------+-------------------------------------------+
| 상세 미리보기                             | 발송 및 저장                              |
|------------------------------------------|-------------------------------------------|
| 법안 제목                                 | 받는 사람                                 |
| 발의 의원 / 소관위 / 종료일               | [email1@example.com] [email2@example.com] |
| 상태 배지                                 | [+ 이메일 추가]                           |
| 입법예고안 내용 요약                      |                                           |
| 원문 링크                                 | 메일 제목                                 |
| [이 항목 포함]                            | [_______________________________]         |
|                                           |                                           |
|                                           | [선택 항목 이메일 발송]                  |
|                                           | [전체 결과 이메일 발송]                  |
|                                           | [선택 항목 Markdown 저장]                |
|                                           | [전체 결과 Markdown 저장]                |
+------------------------------------------+-------------------------------------------+
```

### 모바일 축약 구조

```text
1. 상단 검색 바
2. 날짜 프리셋 스크롤 버튼
3. 검색 결과 카드 리스트
4. 하단 고정 액션 바
   - 선택 발송
   - 전체 발송
   - Markdown 저장
```

## 20. 프론트엔드 컴포넌트 설계

### 페이지 단위

- `LegislationNewsletterPage`
- `RecipientManagementPage`
- `SendLogPage`

### 메인 페이지 컴포넌트

- `KeywordSearchInput`
- `DatePresetBar`
- `CustomDateRangePicker`
- `LegislationResultsTable`
- `LegislationResultRow`
- `LegislationPreviewPanel`
- `RecipientTagInput`
- `NewsletterActionsPanel`
- `NewsletterPreviewModal`
- `SendResultToast`

### 상태 관리 초안

```ts
type DatePreset = "6m" | "3m" | "1m" | "3w" | "2w" | "1w" | "custom";

interface SearchFormState {
  keyword: string;
  datePreset: DatePreset;
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

interface LegislationItem {
  billId: string;
  billNo: string;
  billName: string;
  proposer: string;
  committee: string;
  noticeStatus: "active" | "closed";
  billStage: string | null;
  stageLabel: string;
  noticeEndDate: string | null;
  summary: string;
  detailUrl: string | null;
  relevanceScore: number;
}

interface NewsletterComposerState {
  selectedBillIds: string[];
  recipients: string[];
  subject: string;
  includeAllResults: boolean;
}
```

## 21. 백엔드 DTO 설계 초안

### 검색 요청

```json
{
  "keyword": "인공지능",
  "datePreset": "1m",
  "dateFrom": "2026-03-20",
  "dateTo": "2026-04-20",
  "page": 1,
  "pageSize": 20
}
```

### 검색 응답

```json
{
  "query": {
    "keyword": "인공지능",
    "datePreset": "1m",
    "dateFrom": "2026-03-20",
    "dateTo": "2026-04-20"
  },
  "total": 24,
  "items": [
    {
      "billId": "PRC_XYZ",
      "billNo": "2201234",
      "billName": "인공지능 산업 진흥법 일부개정법률안",
      "proposer": "홍길동",
      "committee": "과학기술정보방송통신위원회",
      "noticeStatus": "active",
      "billStage": "committee_review",
      "stageLabel": "입법예고 진행중 / 소관위 심사",
      "noticeEndDate": "2026-04-28",
      "summary": "인공지능 산업의 안전성 기준과 지원 근거를 정비하는 내용",
      "detailUrl": "https://open.assembly.go.kr/...",
      "relevanceScore": 0.91
    }
  ]
}
```

### 이메일 발송 요청

```json
{
  "query": {
    "keyword": "인공지능",
    "dateFrom": "2026-03-20",
    "dateTo": "2026-04-20"
  },
  "billIds": ["PRC_XYZ", "PRC_ABC"],
  "recipients": ["a@example.com", "b@example.com"],
  "subject": "[입법예고 뉴스레터] 인공지능 관련 법안 브리핑"
}
```

### 이메일 발송 응답

```json
{
  "jobId": "newsletter_job_20260420_001",
  "sent": 2,
  "failed": 0,
  "failures": []
}
```

## 22. 내부 서비스 설계

### 핵심 서비스

- `LegislationSearchService`
- `LegislationEnrichmentService`
- `LegislationStageService`
- `LegislationRelevanceService`
- `NewsletterComposerService`
- `NewsletterRenderService`
- `MarkdownRenderService`
- `EmailSendService`
- `RecipientService`

### 서비스 책임 분리

#### `LegislationSearchService`

- 입법예고 원천 API 호출
- 기간/키워드 기본 필터 수행
- 캐시 조회 및 저장

#### `LegislationEnrichmentService`

- `BILLINFODETAIL`, `BILLRCP`, `BILLJUDGE` 조회
- 원천 필드 정규화
- 요약용 데이터 생성

#### `LegislationStageService`

- 원천 API 코드값을 사용자 친화 텍스트로 매핑
- `입법예고 상태`와 `의안 처리 상태`를 조합

#### `NewsletterComposerService`

- 전체 결과 또는 선택 결과를 받아 뉴스레터 데이터 모델 생성
- 수신자 검증 및 중복 제거

#### `NewsletterRenderService`

- HTML 이메일 생성
- 제목, 요약, 카드 섹션 렌더링

#### `MarkdownRenderService`

- Markdown 문자열 생성
- 다운로드용 파일명 규칙 생성

## 23. 단계 매핑 규칙 초안

실제 API 필드가 확정되면 매핑 테이블을 조정합니다. 우선은 아래처럼 설계합니다.

| 원천 상태 | 표시 라벨 |
|---|---|
| active + review unknown | 입법예고 진행중 |
| active + committee review | 입법예고 진행중 / 소관위 심사 |
| active + plenary pending | 입법예고 진행중 / 본회의 대기 |
| closed + received | 입법예고 종료 / 접수 |
| closed + committee review | 입법예고 종료 / 소관위 심사 |
| closed + plenary passed | 입법예고 종료 / 본회의 의결 |
| closed + promulgated | 입법예고 종료 / 공포 |
| closed + discarded | 입법예고 종료 / 폐기 |

## 24. 이메일 HTML 템플릿 구조 초안

### 상단 요약 블록

- 뉴스레터 제목
- 생성일시
- 검색 키워드
- 조회 기간
- 포함 법안 수

### 법안 카드 블록

각 카드에 아래 정보를 포함합니다.

- 법안 제목
- 발의 의원
- 소관 상임위
- 상태 배지
- 입법예고안 내용 요약
- 원문 링크

### 하단 블록

- 생성 시스템 표기
- 문의용 메모 또는 내부용 고지

## 25. Markdown 파일 예시 구조

```md
# 입법예고 뉴스레터

- 키워드: 인공지능
- 기간: 2026-03-20 ~ 2026-04-20
- 생성시각: 2026-04-20 10:30 KST
- 포함 법안 수: 3건

## 1. 인공지능 산업 진흥법 일부개정법률안

- 발의 의원: 홍길동
- 소관 상임위: 과학기술정보방송통신위원회
- 현재 단계: 입법예고 진행중 / 소관위 심사
- 입법예고 종료일: 2026-04-28
- 원문 링크: https://...

### 요약

인공지능 산업의 안전성 기준과 지원 근거를 정비하는 내용.
```

## 26. 데이터베이스 스키마 초안

### `recipients`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| email | text | 이메일 주소, unique |
| name | text | 선택 입력 |
| is_active | integer | 사용 여부 |
| created_at | datetime | 생성 시각 |
| updated_at | datetime | 수정 시각 |

### `recipient_groups`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| group_name | text | 그룹명 |
| description | text | 설명 |
| created_at | datetime | 생성 시각 |

### `recipient_group_members`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| group_id | text | 그룹 ID |
| recipient_id | text | 수신자 ID |

### `newsletter_jobs`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| keyword | text | 검색 키워드 |
| date_from | date | 시작일 |
| date_to | date | 종료일 |
| subject | text | 메일 제목 |
| result_count | integer | 포함 법안 수 |
| markdown_path | text | 저장 경로 또는 null |
| created_at | datetime | 생성 시각 |

### `newsletter_items`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| job_id | text | 뉴스레터 작업 ID |
| bill_id | text | 법안 ID |
| bill_no | text | 의안번호 |
| bill_name | text | 법안명 |
| proposer | text | 발의 의원 |
| committee | text | 위원회 |
| stage_label | text | 화면 표시용 상태 |
| summary | text | 요약 |
| detail_url | text | 링크 |

### `send_logs`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| job_id | text | 뉴스레터 작업 ID |
| recipient_email | text | 수신자 |
| status | text | sent, failed |
| error_message | text | 실패 메시지 |
| sent_at | datetime | 발송 시각 |

## 27. 실제 구현 순서 상세

### Step 1. API 검증

- 진행중 입법예고 API의 기간 조건 실제 동작 확인
- 종료 입법예고 API 병행 필요 여부 확인
- 의안 상세에서 `제안이유`, `주요내용` 확보 여부 확인

### Step 2. 서비스 계층 구현

- `src/newsletter/types.ts`
- `src/newsletter/legislation-search.ts`
- `src/newsletter/legislation-enricher.ts`
- `src/newsletter/legislation-stage.ts`
- `src/newsletter/relevance.ts`

### Step 3. 웹 API 추가

- `src/web-api/routes/legislation.ts`
- `src/web-api/routes/newsletters.ts`
- `src/web-api/routes/recipients.ts`

### Step 4. 웹 UI 스캐폴딩

- `web/` 디렉터리 생성
- Vite + React + TypeScript 구성
- 결과 테이블 및 상세 패널 구현

### Step 5. 발송/다운로드 기능 구현

- HTML 렌더러
- Markdown 렌더러
- 이메일 발송 어댑터

### Step 6. 저장 기능 추가

- SQLite 연결
- 수신자 및 발송 로그 저장

## 28. 수용 기준

### 검색

- 키워드 없이도 기본 1개월 범위 검색 가능해야 함
- 날짜 프리셋 클릭 시 시작일/종료일이 즉시 반영되어야 함
- 관련도 순 또는 종료일 순 정렬이 가능해야 함

### 리스트

- 사용자는 여러 법안을 선택할 수 있어야 함
- 선택 수량이 상단 또는 하단에 명확히 표시되어야 함
- 상세 미리보기는 클릭 즉시 열려야 함

### 이메일

- 1개 이상의 이메일 주소를 입력할 수 있어야 함
- 잘못된 이메일 형식은 발송 전에 막아야 함
- 전체 발송과 선택 발송이 모두 가능해야 함

### Markdown

- 전체 결과 또는 선택 결과 기준으로 저장 가능해야 함
- 파일명은 키워드와 날짜를 포함해야 함

## 29. 바로 다음 작업 제안

이 문서를 기준으로 실제 구현은 아래 순서로 바로 시작하는 것이 좋습니다.

1. `입법예고 검색/보강 서비스`부터 코드로 추가
2. `HTTP 라우트`를 만들어 웹에서 호출 가능하게 정리
3. `web/` 프론트엔드 스캐폴딩 생성
4. `이메일/Markdown 렌더러` 연결

가장 먼저 손대야 할 부분은 UI가 아니라 `입법예고 데이터 정규화`입니다. 이 부분이 안정돼야 검색 결과, 이메일, Markdown이 모두 같은 기준으로 움직일 수 있습니다.
