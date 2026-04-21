# assembly-api-mcp

대한민국 국회 Open API를 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 서버로 제공합니다.

Claude, ChatGPT 등 AI 도구에서 국회의원, 의안, 일정, 회의록, 위원회, 표결, 청원 등 국회 데이터에 실시간으로 접근할 수 있습니다.

## 주요 기능

- **9개 Lite / 18개 Full 프로필 도구** — 기본 Lite 프로필로 핵심 기능 제공 ([활용 사례 100선](USECASE.md))
- **276개 국회 API 100% 접근** — `discover_apis` + `query_assembly` 범용 도구
- **31개 검증된 API 코드** — 실제 데이터 반환 확인
- **CLI 지원** — 터미널에서 직접 국회 데이터 조회
- **이중 Transport** — stdio (Claude Desktop) + HTTP (원격 서버)
- **인메모리 캐싱** — TTL 기반, 정적/동적 데이터 구분
- **API 모니터링** — 응답 시간 추적, Rate Limit 관리

## 빠른 시작

### 방법 1: 자동 설치 (권장)

```bash
npx assembly-api-mcp setup
```

대화형 마법사가 API 키 입력 → 프로필 선택 → AI 클라이언트 설정을 자동으로 처리합니다.

### 방법 2: 수동 설치

> 상세한 가이드는 [QUICK_START.md](QUICK_START.md)를 참조하세요.

```bash
# 1. 설치
git clone https://github.com/hollobit/assembly-api-mcp.git
cd assembly-api-mcp
npm install && npm run build

# 2. API 키 설정
cp .env.example .env
# .env 파일에 ASSEMBLY_API_KEY 입력 (발급: https://open.assembly.go.kr)

# 3. 테스트
npx tsx src/cli.ts test
```

## AI 클라이언트 연동

> 상세한 설정 가이드는 [QUICK_START.md](QUICK_START.md)를 참조하세요.

### Claude Desktop (stdio)

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here",
        "MCP_PROFILE": "lite"
      }
    }
  }
}
```

> Claude Desktop을 완전히 종료(트레이 포함)한 후 재시작해야 설정이 적용됩니다.

### Claude Code (CLI)

```bash
claude mcp add assembly-api -- node /absolute/path/to/assembly-api-mcp/dist/index.js
```

또는 프로젝트 루트에 `.mcp.json` 파일을 생성합니다:

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Gemini CLI

`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### VS Code (GitHub Copilot / Claude Extension)

프로젝트 루트에 `.vscode/mcp.json` 파일을 생성합니다:

```json
{
  "servers": {
    "assembly-api": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor IDE

`~/.cursor/mcp.json` 또는 프로젝트 루트 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### HTTP 모드 (원격 클라이언트용)

stdio를 지원하지 않는 클라이언트는 HTTP 모드로 서버를 실행하여 연결할 수 있습니다:

```bash
ASSEMBLY_API_KEY=your-api-key MCP_TRANSPORT=http MCP_PORT=3000 npm start
# → MCP 엔드포인트: http://localhost:3000/mcp
# → 상태 확인: http://localhost:3000/health
# → 입법예고 뉴스레터 GUI: http://localhost:3000/newsletter
```

외부에서 접근하려면 ngrok 등 터널링 도구를 사용하세요:

```bash
ngrok http 3000
```

### 입법예고 뉴스레터 GUI

HTTP 모드에서는 브라우저용 입법예고 뉴스레터 화면도 함께 제공합니다.

- 접속: `http://localhost:3000/newsletter`
- 검색: 키워드 + 날짜 프리셋 또는 직접 기간 지정
- 메타데이터 필터: 발의 의원, 상임위를 추가 입력해 결과를 더 좁힐 수 있음
- 검색 링크 복사: 현재 검색 조건을 URL로 복사해 북마크하거나 다시 열 수 있음
- 검색 preset: 조건 저장, 재사용, 삭제
- 범위: `진행중만` 또는 `진행중 + 종료 포함`
- 정렬: `관련도 순`, `종료일 최신순`, `종료일 오래된순`
- 페이지: `10/20/50건` 단위 페이지네이션, 이전/다음 페이지 이동
- 선택: 페이지를 이동해도 선택한 법안은 유지되고, 선택 발송/저장은 누적 선택 기준으로 동작
- 상세 미리보기: 리스트 클릭 시 의안번호, 제안일, 입법예고 상태, 관련도, 제안이유, 주요내용까지 확인 가능
- 상세 보기 모달: 법안별 심사 이력과 접수/처리 이력을 별도 모달에서 확인 가능
- 조회 캐시: 같은 검색 조건과 법안 상세 조회는 프로세스 내 TTL 캐시를 재사용해 API 호출 수를 줄임
- 편집: 문서 제목, 브리핑 메모, 마무리 문구 직접 입력
- 파일 저장: 전체 결과 또는 선택 항목 기준으로 HTML 파일, Markdown 파일, HWPX 파일을 각각 저장 가능
- 수신자 그룹: 현재 이메일 목록을 이름으로 저장하고, 불러오기/추가하기/삭제 가능
- 수신자 수정: 저장된 이메일 주소를 수정하면 수신자 그룹, 구독 템플릿, 예약 발송 스냅샷에도 함께 반영
- 구독 템플릿: 검색 조건 + 수신자 + 발송 옵션을 함께 저장하고, 다시 불러오거나 바로 예약 가능
- 필터 유지: 발의 의원/상임위 필터도 preset, 구독 템플릿, 예약, HTML/Markdown 결과에 함께 반영
- 구독 템플릿 실행: 저장된 템플릿으로 Markdown 또는 HWPX 저장 가능
- 템플릿 상태 표시: 각 구독 템플릿 카드에서 연결 예약 수와 최근 결과를 확인하고, 최근 발송 HTML/Markdown을 바로 열 수 있음
- 템플릿 필터: 이름/키워드/메일 제목 검색과 `활성`, `주의 필요`, `이력만`, `예약 없음` 상태 필터로 빠르게 추리기 가능
- 설정 백업/복원: 수신자, 수신자 그룹, 검색 preset, 구독 템플릿을 JSON 파일로 내보내고 다시 복원 가능
- 수신자 그룹 연동: 구독 템플릿과 예약 발송에서 저장된 수신자 그룹을 연결하면 최신 그룹 멤버를 따라감
- 운영 요약: 수신자 수, 활성 예약, 최근 7일 예약 성공/실패를 대시보드 카드로 확인 가능
- 내보내기: 선택 항목/전체 결과 기준 HTML 미리보기, HTML 저장, Markdown 다운로드, HWPX 다운로드
- 발송 로그: 보낸 HTML/Markdown 스냅샷 다시 보기와 HTML/Markdown 재다운로드
- 로그 필터: 발송 로그와 예약 실행 이력을 수신자/제목/키워드/상태 기준으로 빠르게 좁혀보고, 현재 보기 기준 CSV 저장 가능
- 재전송: 발송 로그 스냅샷을 현재 수신자 목록으로 다시 보내기
- 실패 재시도: 발송 실패한 개별 수신자만 바로 재시도 가능
- 예약: 선택 항목 또는 전체 결과를 한 번, 매일, 매주 반복으로 예약 발송
- 예약 중복 방지: 같은 시각, 같은 조건, 같은 수신 대상의 예약은 중복 등록되지 않음
- 예약 수정: 대기 중, 일시정지, 실패 상태의 예약은 시각과 반복 주기를 바로 수정 가능
- 예약 제어: 반복 예약을 일시정지하거나 다시 대기 상태로 재개 가능
- 예약 실행 이력: 최근 성공/건너뜀/실패 기록과 발송 스냅샷을 예약 단위로 확인 가능
- preset 연동: 전체 결과 예약은 저장된 검색 preset을 기준으로 계속 따라가도록 연결 가능
- 신규만 발송: 반복 예약에서 이미 보낸 법안을 제외하고 새로 발견된 법안만 발송 가능

현재 기본 `/newsletter` 화면은 이메일 발송 없이 HTML 미리보기와 Markdown/HWPX 다운로드 중심으로 동작합니다. 그래서 기본 사용에는 `NEWSLETTER_SMTP_*` 설정이 필요하지 않습니다.

수신자 목록, 수신자 그룹, 구독 템플릿, 발송 로그, 검색 preset, 예약 발송 작업은 기본적으로 프로젝트 루트의 `.newsletter-data` 디렉터리에 저장됩니다. 경로를 바꾸려면 `NEWSLETTER_DATA_DIR` 환경 변수를 설정하세요. Vercel에서는 기본 경로가 `/tmp/.newsletter-data`로 바뀌며, 이 경로는 영구 저장소가 아닙니다. Vercel에서 저장 데이터를 유지하려면 `NEWSLETTER_STORAGE_BACKEND=vercel-blob`과 `BLOB_READ_WRITE_TOKEN`을 함께 설정하세요. 화면의 `설정 백업`은 수신자, 수신자 그룹, 검색 preset, 구독 템플릿만 포함하며 예약 발송 작업과 발송 로그는 제외됩니다.

예약 발송은 HTTP 서버가 실행 중일 때 처리됩니다. 서버가 꺼져 있으면 예약 시각이 지나더라도 다음 실행 시점에 다시 확인해서 발송합니다. 반복 예약은 성공하면 다음 시각으로 자동 이동하고, 실패하면 상태를 남기고 멈춥니다. 필요하면 예약을 `일시정지`했다가 나중에 `재개`해서 다시 대기 상태로 돌릴 수 있습니다. 검색 결과가 없는 회차는 실패 대신 `건너뜀`으로 기록하고 다음 회차로 넘어갑니다. 최근 예약 실행 이력은 별도로 저장되어, 어떤 예약이 언제 성공/건너뜀/실패했는지와 발송 스냅샷 유무를 함께 확인할 수 있습니다. 전체 결과 예약에서 저장된 검색 preset을 선택하면, 발송 시점마다 해당 preset의 최신 조건을 다시 읽어 옵니다. `새로 발견된 법안만 발송` 옵션을 켜면 이전에 같은 예약에서 보낸 bill id를 제외하고 메일을 구성합니다. 같은 시각과 조건으로 이미 등록된 예약이 있으면 중복 등록 대신 기존 예약을 수정하거나 재개하도록 안내합니다. 대기 중, 일시정지, 실패 상태의 예약은 화면에서 시각과 반복 주기를 바로 수정할 수 있습니다.

Vercel 배포용 rewrite와 함수 엔트리포인트도 포함되어 있습니다. 자세한 단계별 절차는 [VERCEL.md](VERCEL.md)를 참고하세요. 다만 `/mcp` 세션형 HTTP transport는 Vercel 배포에서 지원하지 않으며, 뉴스레터 GUI 운영용으로만 사용하는 것을 권장합니다.

Vercel 배포 전에 로컬에서 빠르게 확인하려면 `npm run vercel:check`, 환경 변수 준비표를 보려면 `npm run vercel:env`를 사용할 수 있습니다.

Vercel에서는 Node.js 20 이상을 권장합니다. `This Serverless Function has crashed` 또는 `FUNCTION_INVOCATION_FAILED`가 보이면 프로젝트 `Settings -> Build and Deployment -> Node.js Version`에서 `20.x` 또는 `22.x`인지 먼저 확인하세요.

Vercel Pro cron 대신 외부 스케줄러를 쓰고 싶다면 GitHub Actions 예시 파일 [examples/github-actions-newsletter-cron.yml](examples/github-actions-newsletter-cron.yml)을 참고하면 됩니다.

`/newsletter` 화면 상단에는 현재 실행 환경, 열린국회 API 키 준비 여부, 저장소 방식, 다운로드 준비 상태가 함께 표시되고, 누락된 환경 변수 이름과 다음 조치도 바로 확인할 수 있습니다.

같은 화면의 `Vercel 환경 변수 보기` 버튼으로 복붙 가능한 env 템플릿을 열고, 바로 복사하거나 파일로 저장할 수도 있습니다. 이 템플릿에는 현재 배포 주소 기준 `newsletter`, `health` URL과 기본 저장 설정 예시가 함께 들어 있습니다.

`Vercel 배포 점검 보기` 버튼으로는 배포 직후 무엇을 먼저 열고, 어떤 카드와 설정을 확인해야 하는지 체크리스트를 바로 열 수 있습니다.

### 연동 지원 현황

| 클라이언트 | Transport | MCP 지원 |
|-----------|-----------|----------|
| Claude Desktop | stdio | ✅ 네이티브 |
| Claude Code (CLI) | stdio | ✅ 네이티브 |
| Gemini CLI | stdio | ✅ 네이티브 |
| VS Code (Copilot/Claude) | stdio | ✅ 네이티브 |
| Cursor | stdio | ✅ 네이티브 |
| Windsurf | stdio | ✅ 네이티브 |
| ChatGPT (GPTs) | HTTP | ⚠️ Actions에서 REST 변환 필요 |
| Docker / 원격 서버 | HTTP | ✅ Streamable HTTP |

## MCP 도구 목록

### Lite 프로필 (9개, 기본)

AI가 효율적으로 사용할 수 있도록 핵심 기능을 통합한 프로필입니다.

| 도구 | 설명 |
|------|------|
| `search_members` | 의원 검색 (이름/정당/선거구/위원회, 1건이면 자동 상세) |
| `search_bills` | 의안 검색+상세+상태필터 (계류/처리/최근, bill_id로 상세) |
| `get_schedule` | 국회 일정 조회 (날짜/위원회/키워드) |
| `search_meetings` | 회의록 검색 (본회의/위원회/소위/국감/인사청문회/공청회) |
| `get_votes` | 표결 조회 (전체 본회의 표결 또는 의안별 상세) |
| `analyze_legislator` | 의원 종합분석 (인적+발의+표결 한 번에) |
| `track_legislation` | 주제별 법안 추적 (다중 키워드, 심사이력) |
| `discover_apis` | 276개 API 키워드 검색 |
| `query_assembly` | 범용 API 직접 호출 |

> 활용 예시는 [활용 사례 100선](USECASE.md)을 참조하세요.

### Full 프로필 (18개)

`MCP_PROFILE=full`로 전환하면 Lite 9개 + Full 전용 9개를 사용할 수 있습니다.

#### Lite 도구 (9개) — 위와 동일

#### Full 전용 (9개)

| 도구 | 설명 |
|------|------|
| `get_bill_detail` | 의안 상세 조회 (제안이유, 주요내용) |
| `get_bill_review` | 의안 심사정보 |
| `get_bill_history` | 의안 접수/처리 이력 |
| `get_committees` | 위원회 목록 |
| `search_petitions` | 국민동의청원 검색 |
| `get_legislation_notices` | 입법예고 조회 |
| `search_library` | 국회도서관 자료 검색 |
| `get_budget_analysis` | 예산정책처 분석 자료 |
| `search_research_reports` | 입법조사처 보고서 |

## CLI 사용법

### 의원 검색

```bash
# 전체 의원 목록 (기본 20명)
npx tsx src/cli.ts members

# 이름으로 검색
npx tsx src/cli.ts members --name 이재명

# 정당별 검색
npx tsx src/cli.ts members --party 더불어민주당
npx tsx src/cli.ts members --party 국민의힘

# 선거구별 검색
npx tsx src/cli.ts members --district 서울

# 결과 수 조절
npx tsx src/cli.ts members --party 더불어민주당 --size 50
```

### 의원 의정활동

```bash
# 의원별 인적사항 + 발의 법안 조회
npx tsx src/cli.ts activity --name 박주민
npx tsx src/cli.ts activity --name 이해민

# 조회 건수 조절
npx tsx src/cli.ts activity --name 한동훈 --size 5
```

### 의안 검색

```bash
# 의안명 키워드 검색
npx tsx src/cli.ts bills --name AI
npx tsx src/cli.ts bills --name 부동산
npx tsx src/cli.ts bills --name 교육

# 의안번호로 검색
npx tsx src/cli.ts bills --bill-no 2204567

# 제안자로 검색
npx tsx src/cli.ts bills --proposer 안철수

# 특정 대수 의안 검색 (기본: 22대)
npx tsx src/cli.ts bills --name 환경 --age 21

# 결과 수 조절
npx tsx src/cli.ts bills --name 의료 --size 50
```

### 의안 상세

```bash
# BILL_ID로 의안 상세 조회 (bills 검색 결과에서 BILL_ID 확인)
npx tsx src/cli.ts bill-detail <BILL_ID>
```

### 표결 / 계류 / 처리 / 최근 의안

```bash
# 의안별 표결 현황
npx tsx src/cli.ts votes
npx tsx src/cli.ts votes --size 50

# 계류 중인 의안
npx tsx src/cli.ts pending
npx tsx src/cli.ts pending --size 10

# 처리된 의안
npx tsx src/cli.ts processed
npx tsx src/cli.ts processed --age 21

# 최근 본회의 처리 의안
npx tsx src/cli.ts recent

# 본회의 부의안건
npx tsx src/cli.ts plenary
```

### API 탐색 및 테스트

```bash
# 열린국회정보 전체 API 목록 (276개)
npx tsx src/cli.ts meta

# 전체 API 작동 테스트 (11개 핵심 API 점검)
npx tsx src/cli.ts test

# 도움말
npx tsx src/cli.ts help
```

## 문서

| 문서 | 설명 |
|------|------|
| [QUICK_START.md](QUICK_START.md) | 5분 안에 시작하는 빠른 설정 가이드 |
| [docs/api-catalog.md](docs/api-catalog.md) | 국회 Open API 276개 전체 목록 (카테고리별 분류) |
| [docs/mcp-api.md](docs/mcp-api.md) | MCP 도구 ↔ 국회 API 코드 매핑 (31개 검증 완료) |
| [docs/discovered-codes.md](docs/discovered-codes.md) | API 코드 발굴 과정 및 검증된 엔드포인트 파라미터 |
| [docs/mcp-design-analysis.md](docs/mcp-design-analysis.md) | MCP 도구 설계 분석 — Lite/Full 프로필 결정 근거 |

## 문제 해결

### Claude Desktop에서 "server disconnected" 오류

프로젝트의 `.env` 파일에 `MCP_TRANSPORT=http`이 설정되어 있으면, Claude Desktop이 기대하는 stdio 모드 대신 HTTP 모드로 서버가 시작됩니다. 클라이언트 설정에서 `MCP_TRANSPORT`를 명시적으로 override하세요:

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/absolute/path/to/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "your-api-key",
        "MCP_TRANSPORT": "stdio",
        "MCP_PROFILE": "lite"
      }
    }
  }
}
```

> `.env` 파일의 `MCP_TRANSPORT` 값은 서버가 `dotenv`로 자동 로드합니다. 클라이언트 설정의 `env`에서 같은 변수를 지정하면 `.env`보다 우선 적용됩니다.

### Claude Desktop에서 도구가 보이지 않음

Claude Desktop을 **완전히 종료** (macOS: Cmd+Q, 트레이 아이콘까지 닫기) 후 재시작하세요. 설정 파일 변경은 재시작 후에만 적용됩니다.

### "ASSEMBLY_API_KEY가 설정되지 않았습니다"

`.env` 파일에 키를 입력했는지 확인하세요. Claude Desktop 등 외부 클라이언트에서 실행할 때는 클라이언트 설정의 `env`에도 키를 지정해야 합니다.

### API 호출이 0건 반환

일부 API는 `AGE` 파라미터가 필요합니다. 도구들은 자동으로 22대(현재)를 기본값으로 사용합니다.

### Rate Limit 초과

개발계정은 월 10,000건 제한입니다. `npx tsx src/cli.ts test`로 현재 상태를 확인하세요.

### 포트 충돌 (HTTP 모드)

HTTP 모드에서 `EADDRINUSE` 오류가 발생하면 해당 포트를 사용 중인 프로세스를 확인하세요:

```bash
lsof -i :3000
# 다른 포트로 변경
MCP_PORT=3001 npm start
```

## 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `ASSEMBLY_API_KEY` | O | - | 열린국회정보 API 키 |
| `DATA_GO_KR_SERVICE_KEY` | X | - | 공공데이터포털 ServiceKey |
| `NANET_API_KEY` | X | - | 국회도서관 API 키 |
| `NABO_API_KEY` | X | - | 국회예산정책처 API 키 |
| `MCP_PROFILE` | X | `lite` | `lite` 또는 `full` |
| `MCP_TRANSPORT` | X | `stdio` | `stdio` 또는 `http` |
| `MCP_PORT` | X | `3000` | HTTP 모드 포트 |
| `LOG_LEVEL` | X | `info` | 로그 레벨 |
| `CACHE_ENABLED` | X | `true` | 캐시 활성화 |

## API 키 발급

1. [열린국회정보](https://open.assembly.go.kr) 접속
2. 회원가입 (무료)
3. 로그인 후 마이페이지 > OPEN API > 인증키 발급
4. 발급받은 키를 `.env` 파일의 `ASSEMBLY_API_KEY`에 입력

> `sample` 키로 최대 10건까지 테스트할 수 있습니다.

## 프로젝트 구조

```
assembly-api/
├── src/
│   ├── index.ts              # MCP 서버 진입점
│   ├── server.ts             # McpServer 초기화 (stdio/HTTP)
│   ├── config.ts             # 환경 변수 설정
│   ├── cli.ts                # CLI 인터페이스
│   ├── api/
│   │   ├── client.ts         # HTTP 클라이언트 (캐싱/모니터링 통합)
│   │   ├── cache.ts          # 인메모리 TTL 캐시 (LRU)
│   │   ├── codes.ts          # 검증된 API 코드 매핑
│   │   ├── monitor.ts        # API 응답 시간 모니터링
│   │   └── rate-limiter.ts   # Rate Limit 추적
│   ├── tools/                # MCP 도구 (16개 파일, 23개 도구)
│   │   ├── lite/             # Lite 프로필 도구 (9개)
│   ├── resources/            # MCP 정적 리소스
│   └── prompts/              # MCP 프롬프트 템플릿
├── tests/                    # 단위 테스트 (248개)
├── examples/
│   └── api-tester.html       # 브라우저 API 테스터
├── docs/
│   ├── api-catalog.md        # 국회 API 276개 전체 목록
│   ├── mcp-api.md            # MCP 도구 ↔ API 매핑
│   ├── discovered-codes.md   # 발굴된 API 코드
│   └── mcp-design-analysis.md # MCP 도구 설계 분석
├── .env.example              # 환경 변수 템플릿
├── Dockerfile                # Docker 이미지
├── docker-compose.yml        # Docker Compose
└── QUICK_START.md            # 빠른 시작 가이드
```

## 개발

```bash
npm run build      # TypeScript 빌드
npm test           # 테스트 실행
npm run dev        # 개발 모드 (tsx)
npm run cli        # CLI 실행
npm run lint       # 타입 체크 (tsc --noEmit)
```

## Docker

```bash
docker compose up -d
# HTTP 모드로 포트 3000에서 실행
# Health check: curl localhost:3000/health
```

## 참고 프로젝트

- [korean-law-mcp](https://github.com/SeoNaRu/korean-law-mcp) — 한국 법률 MCP 서버
- [data-go-mcp-servers](https://github.com/Koomook/data-go-mcp-servers) — 공공데이터 MCP 서버

## 라이선스

MIT License - [LICENSE](LICENSE) 참조
