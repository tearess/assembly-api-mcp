# Test Scenarios: Phase 12 — 프로필 기반 통합 MCP 인터페이스

**Source**: Plans.md Phase 12 + src/tools/lite/*.ts 구현
**Total scenarios**: 35개
**Coverage**: Happy Path (14) / Edge Cases (8) / Error Handling (7) / Security (3) / Performance (3)

---

## A. 프로필 전환 (MCP_PROFILE)

### Scenario A-1: 기본 프로필은 Lite (7개 도구)
**Tests**: 12.5 — MCP_PROFILE 기본값
**Preconditions**: MCP_PROFILE 환경변수 미설정
**User role**: MCP 클라이언트 (Claude Desktop / Cursor)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | MCP_PROFILE 환경변수를 설정하지 않고 서버 시작 | 서버 정상 시작 |
| 2 | MCP tools/list 요청 | 7개 도구만 반환: search_members, search_bills, search_records, analyze_legislator, track_legislation, discover_apis, query_assembly |
| 3 | Full 전용 도구 (get_pending_bills 등) 호출 시도 | 도구를 찾을 수 없음 에러 |

**Priority**: Critical

---

### Scenario A-2: Full 프로필 전환
**Tests**: 12.5 — MCP_PROFILE=full
**Preconditions**: MCP_PROFILE=full 설정

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | MCP_PROFILE=full로 서버 시작 | 서버 정상 시작 |
| 2 | MCP tools/list 요청 | 23개 도구 전부 반환 |
| 3 | get_pending_bills 호출 | 정상 응답 (계류의안 목록) |
| 4 | Lite 전용 도구 (search_records 등) 호출 시도 | 도구를 찾을 수 없음 에러 (Full에는 Lite 도구 미등록) |

**Priority**: Critical

---

### Scenario A-3: 잘못된 프로필 값
**Tests**: 12.5 — 엣지 케이스
**Preconditions**: MCP_PROFILE=invalid 설정

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | MCP_PROFILE=invalid로 서버 시작 | Lite 프로필로 폴백 (기본값 동작) |
| 2 | tools/list 요청 | 7개 도구 반환 |

**Priority**: Medium

---

## B. search_members (의원 검색+상세 통합)

### Scenario B-1: 이름으로 의원 검색 — 단일 결과 → 상세 반환
**Tests**: 12.1 — name 단일결과시 상세 반환
**Preconditions**: API 키 유효, 서버 Lite 모드

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_members({ name: "고민정" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | "국회의원 상세정보" 헤더 포함 |
| 3 | 상세 필드 확인 | 이름, 정당, 선거구 + 약력, 연락처, 이메일, 보좌관 등 20개 필드 |

**Priority**: Critical

---

### Scenario B-2: 정당으로 검색 — 다수 결과 → 목록 반환
**Tests**: 12.1 — 다수 결과 목록 반환

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_members({ party: "더불어민주당" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | "국회의원 검색 결과 (총 N건)" 헤더 |
| 3 | 각 항목 확인 | 이름, 정당, 선거구, 당선횟수, 당선방법, 소속위원회 (6개 요약 필드) |

**Priority**: High

---

### Scenario B-3: 검색 결과 없음
**Tests**: 12.1 — 빈 결과 처리

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_members({ name: "존재하지않는의원" }) 호출 | 정상 응답 (isError=false) |
| 2 | 응답 텍스트 확인 | "검색 결과가 없습니다. (조건: 이름="존재하지않는의원")" |

**Priority**: High

---

### Scenario B-4: 대수(age) 파라미터 변환
**Tests**: 12.1 — UNIT_CD 변환 로직

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_members({ age: 22 }) 호출 | API에 UNIT_CD=10000022 전달 |
| 2 | search_members({ age: 9 }) 호출 | API에 UNIT_CD=10000009 전달 (padStart 4자리) |

**Priority**: Medium

---

## C. search_bills (의안 통합 검색)

### Scenario C-1: 의안명으로 기본 검색
**Tests**: 12.2 — 기본 검색 모드

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ bill_name: "교육" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | "의안 검색 결과 (총 N건)" |
| 3 | 각 항목 확인 | 의안ID, 의안번호, 의안명, 제안자, 대수, 소관위원회, 제안일, 처리상태 포함 |

**Priority**: Critical

---

### Scenario C-2: bill_id로 상세 조회
**Tests**: 12.2 — 상세 조회 모드

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ bill_id: "PRC_실제ID" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | "의안 상세정보" 헤더 |
| 3 | 상세 필드 확인 | 제안이유, 주요내용 등 포함 |

**Priority**: Critical

---

### Scenario C-3: 상태 필터 — 계류의안 (pending)
**Tests**: 12.2 — status별 API 라우팅

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ status: "pending" }) 호출 | API_CODES.BILL_PENDING 사용 |
| 2 | 응답 확인 | "계류의안 결과 (총 N건)" |
| 3 | AGE 파라미터 확인 | 전송되지 않음 (pending은 AGE 불필요) |

**Priority**: High

---

### Scenario C-4: 상태 필터 — 처리의안 (processed)
**Tests**: 12.2 — processed 라우팅

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ status: "processed", age: 22 }) 호출 | API_CODES.BILL_PROCESSED 사용, AGE=22 전송 |
| 2 | 응답 확인 | "처리의안 결과 (총 N건)" |

**Priority**: High

---

### Scenario C-5: 상태 필터 — 최근 본회의 (recent)
**Tests**: 12.2 — recent 라우팅

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ status: "recent" }) 호출 | "nxjuyqnxadtotdrbw" API 코드 사용 |
| 2 | 응답 확인 | "최근 본회의 처리의안 결과 (총 N건)" |

**Priority**: High

---

### Scenario C-6: 존재하지 않는 bill_id
**Tests**: 12.2 — 빈 결과 에지 케이스

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ bill_id: "INVALID_ID_12345" }) 호출 | 정상 응답 (isError=false) |
| 2 | 응답 확인 | '의안 ID "INVALID_ID_12345"에 해당하는 의안을 찾을 수 없습니다.' |

**Priority**: Medium

---

## D. search_records (일정+회의록+표결 통합)

### Scenario D-1: type=schedule — 일정 조회
**Tests**: 12.3 — schedule 라우팅

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "schedule" }) 호출 | ALLSCHEDULE API 사용 |
| 2 | 응답 확인 | "국회 일정 (총 N건)" |
| 3 | 포맷 확인 | 일정종류, 일자, 시간, 위원회, 내용, 장소 필드 |

**Priority**: Critical

---

### Scenario D-2: type=schedule + date_from 필터
**Tests**: 12.3 — 날짜 변환

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "schedule", date_from: "2026-04-01" }) | SCH_DT=20260401 변환 전송 |
| 2 | 응답 확인 | 해당 날짜 이후 일정 반환 |

**Priority**: High

---

### Scenario D-3: type=meetings — 위원회 회의록
**Tests**: 12.3 — meetings 기본 (default=위원회)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "meetings" }) 호출 | MEETING_COMMITTEE API 사용 |
| 2 | 응답 확인 | "회의록 검색 결과 (총 N건)" |
| 3 | 포맷 확인 | 회의명, 회의일, 대수, 안건, 회의록URL, 영상URL |

**Priority**: High

---

### Scenario D-4: type=meetings + meeting_type=국정감사
**Tests**: 12.3 — 회의 종류별 분기

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "meetings", meeting_type: "국정감사" }) | MEETING_AUDIT API, ERACO="제22대" |
| 2 | 응답 확인 | 국정감사 회의록 반환 |

**Priority**: Medium

---

### Scenario D-5: type=votes — 표결 조회
**Tests**: 12.3 — votes 라우팅

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "votes", bill_id: "PRC_실제ID" }) | VOTE_BY_BILL API, BILL_ID + AGE 전송 |
| 2 | 응답 확인 | "표결 결과 (총 N건)" |
| 3 | 포맷 확인 | 의안ID, 의안명, 의원명, 표결결과 |

**Priority**: Critical

---

### Scenario D-6: type=votes + bill_id 누락 (에러)
**Tests**: 12.3 — 필수 파라미터 검증

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_records({ type: "votes" }) 호출 (bill_id 없이) | 에러 응답 (isError=true) |
| 2 | 에러 메시지 확인 | "type='votes'에는 bill_id가 필수입니다" |

**Priority**: Critical

---

## E. analyze_legislator (의원 종합분석 체인)

### Scenario E-1: 의원 종합분석 정상 동작
**Tests**: 12.4 — 체인 도구 정상 흐름

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | analyze_legislator({ name: "고민정" }) 호출 | 정상 응답 |
| 2 | 기본정보 섹션 | "■ 의원 기본정보" + 이름, 정당, 선거구, 당선, 소속위원회 |
| 3 | 발의법안 섹션 | "■ 발의 법안 (총 N건, 최근 10건)" + 의안번호, 의안명, 상태 |
| 4 | 표결 섹션 | "■ 본회의 표결 현황 (제22대, 총 N건)" |

**Postconditions**: 3개 API가 병렬 호출됨 (MEMBER_INFO → MEMBER_BILLS + VOTE_PLENARY)
**Priority**: Critical

---

### Scenario E-2: 존재하지 않는 의원
**Tests**: 12.4 — 의원 미발견 처리

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | analyze_legislator({ name: "홍길동ABC" }) 호출 | 정상 응답 (isError=false) |
| 2 | 응답 확인 | '"홍길동ABC" 의원을 찾을 수 없습니다. 이름을 확인해 주세요.' |

**Priority**: High

---

### Scenario E-3: 대수 변경
**Tests**: 12.4 — age 파라미터

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | analyze_legislator({ name: "이낙연", age: 21 }) 호출 | 21대 데이터 조회 |
| 2 | 응답 확인 | "■ 본회의 표결 현황 (제21대, 총 N건)" |

**Priority**: Medium

---

## F. track_legislation (법안 추적 체인)

### Scenario F-1: 단일 키워드 검색
**Tests**: 12.4 — 기본 법안 추적

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | track_legislation({ keywords: "인공지능" }) 호출 | 정상 응답 |
| 2 | 헤더 확인 | '■ 법안 추적: "인공지능" (제22대)' |
| 3 | 법안 목록 확인 | 번호 + 의안명 + 제안자 + 제안일 + 상태 |
| 4 | 안내 확인 | 'search_bills(bill_id: "...")로 조회하세요' 팁 포함 |

**Priority**: Critical

---

### Scenario F-2: 다중 키워드 + 중복 제거
**Tests**: 12.4 — 쉼표 구분 + 중복 제거

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | track_legislation({ keywords: "AI,인공지능" }) 호출 | 2개 키워드 병렬 검색 |
| 2 | 헤더 확인 | '■ 법안 추적: "AI, 인공지능"' |
| 3 | 중복 확인 | 동일 BILL_NO가 2번 나타나지 않음 |

**Priority**: High

---

### Scenario F-3: 심사 이력 포함
**Tests**: 12.4 — include_history=true

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | track_legislation({ keywords: "교육", include_history: true }) | 상위 5건에 대해 BILL_REVIEW 추가 조회 |
| 2 | 응답 확인 | "심사: 위원회명 → 처리결과 (날짜)" 라인 포함 |

**Priority**: High

---

### Scenario F-4: 빈 키워드
**Tests**: 12.4 — 입력 검증

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | track_legislation({ keywords: "" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | "검색 키워드를 입력해 주세요." |

**Priority**: Medium

---

### Scenario F-5: 심사 이력 조회 실패 시 부분 성공
**Tests**: 12.4 — 개별 history catch

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | 특정 법안의 BILL_REVIEW가 실패하는 상황 | 해당 법안만 심사정보 없음, 나머지 정상 표시 |
| 2 | 전체 응답 | isError=false, 부분 결과 반환 |

**Priority**: Medium

---

## G. discover_apis + query_assembly (범용 도구)

### Scenario G-1: Lite에서 discover_apis 정상 동작
**Tests**: 12.5 — 범용 도구 Lite 재사용

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | discover_apis({ keyword: "예산" }) 호출 | 정상 응답 |
| 2 | 응답 확인 | API 목록 (INF_ID, INF_NM, CATE_NM) 포함 |

**Priority**: High

---

### Scenario G-2: Lite에서 query_assembly로 위원회 조회
**Tests**: 12.5 — Lite에서 제외된 도구의 대체 경로

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | query_assembly({ api_code: "nxrvzonlafugpqjuh" }) 호출 | 위원회 데이터 반환 |
| 2 | 응답 확인 | 총 건수 + 필드 목록 + 데이터 |

**Postconditions**: Lite에 get_committees가 없어도 query_assembly로 동일 데이터 접근 가능 확인
**Priority**: High

---

## H. Resource — assembly://tools-guide

### Scenario H-1: tools-guide Resource 조회
**Tests**: 12.6 — Resource 등록 확인

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | MCP resources/read { uri: "assembly://tools-guide" } 요청 | 정상 응답 |
| 2 | profile 필드 | 현재 활성 프로필 (lite 또는 full) |
| 3 | lite.tools 배열 | 7개 도구 (name, description, example 포함) |
| 4 | tips 배열 | 사용법 안내 3개 항목 |

**Priority**: Medium

---

## I. Security Scenarios

### Scenario I-1: API 키 없이 Lite 서버 시작
**Tests**: 보안 — 인증 검증

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | ASSEMBLY_API_KEY 미설정으로 서버 시작 | "환경 변수 ASSEMBLY_API_KEY이(가) 설정되지 않았습니다" 에러 |
| 2 | 서버 상태 | process.exit(1) 호출, 서버 미시작 |

**Priority**: Critical

---

### Scenario I-2: 잘못된 API 키로 도구 호출
**Tests**: 보안 — 인증 실패 전파

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | ASSEMBLY_API_KEY=invalid로 서버 시작 | 서버 시작 성공 (키 검증은 호출 시) |
| 2 | search_members({ name: "테스트" }) 호출 | 에러 응답: "유효하지 않은 인증키입니다" |
| 3 | isError 확인 | true |

**Priority**: High

---

### Scenario I-3: Rate Limit 초과
**Tests**: 보안 — 속도 제한

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | 월 10,000 요청 제한 초과 상태에서 호출 | 에러 응답: "요청 제한 횟수를 초과했습니다" |
| 2 | 에러 코드 | INFO-300 매핑 |

**Priority**: Medium

---

## J. Performance Scenarios

### Scenario J-1: analyze_legislator 병렬 호출 성능
**Tests**: 성능 — Promise.all 효과

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | analyze_legislator({ name: "고민정" }) 호출 시간 측정 | 응답 시간 기록 |
| 2 | 순차 호출(의원→법안→표결) 시간 대비 | 병렬 호출이 ~40%+ 빠름 (2번째, 3번째 API가 동시 실행) |

**Priority**: Medium

---

### Scenario J-2: track_legislation 다중 키워드 병렬성
**Tests**: 성능 — 키워드별 Promise.all

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | track_legislation({ keywords: "교육,환경,노동" }) 호출 | 3개 키워드 병렬 검색 |
| 2 | 응답 시간 | 단일 키워드 대비 ~1.2x 이내 (병렬 효과) |

**Priority**: Low

---

### Scenario J-3: 대량 결과 페이지네이션
**Tests**: 성능 — page_size 제한

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | search_bills({ status: "pending", page_size: 200 }) 호출 | page_size가 maxPageSize(100)로 클램핑 |
| 2 | 응답 건수 확인 | 최대 100건 |

**Priority**: Medium

---

## Coverage Matrix

| 요구사항 | Happy Path | Edge Cases | Error Handling | Security | Performance |
|---------|-----------|-----------|---------------|---------|-------------|
| 프로필 전환 | A-1, A-2 | A-3 | - | - | - |
| search_members | B-1, B-2 | B-4 | B-3 | - | - |
| search_bills | C-1, C-2, C-3, C-4, C-5 | C-6 | - | - | - |
| search_records | D-1, D-2, D-3, D-5 | D-4 | D-6 | - | - |
| analyze_legislator | E-1 | E-3 | E-2 | - | J-1 |
| track_legislation | F-1, F-2, F-3 | F-4 | F-5 | - | J-2 |
| discover + query | G-1, G-2 | - | - | - | - |
| tools-guide Resource | H-1 | - | - | - | - |
| 인증/보안 | - | - | - | I-1, I-2, I-3 | - |
| 페이지네이션 | - | - | - | - | J-3 |

## Test Data Requirements

| 데이터 | 용도 | 획득 방법 |
|--------|------|----------|
| 유효한 API 키 | 모든 시나리오 | open.assembly.go.kr 발급 |
| "sample" 키 | 제한적 테스트 (최대 10건) | 기본 제공 |
| 실존 의원 이름 (예: "고민정") | B-1, E-1 시나리오 | 22대 국회의원 목록 |
| 실존 의안 ID | C-2, D-5 시나리오 | search_bills 결과에서 추출 |
| 존재하지 않는 이름/ID | B-3, C-6, E-2 | 임의 문자열 |
