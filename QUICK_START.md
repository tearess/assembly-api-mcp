# 빠른 시작 가이드

5분 안에 국회 API MCP 서버를 실행하는 방법입니다.

---

## 1단계: API 키 발급 (2분)

1. [열린국회정보](https://open.assembly.go.kr) 접속
2. **회원가입** (무료, 즉시 완료)
3. 로그인 → **마이페이지** → **OPEN API** → **인증키 발급**
4. 발급된 32자리 키를 복사

> 키 발급 전에도 `sample` 키로 테스트할 수 있습니다 (최대 10건).

---

## 2단계: 설치 및 설정 (2분)

```bash
# 프로젝트 클론
git clone https://github.com/hollobit/assembly-api-mcp.git
cd assembly-api-mcp

# 의존성 설치 및 빌드
npm install
npm run build

# 환경 변수 설정
cp .env.example .env
```

`.env` 파일을 열어 API 키를 입력합니다:

```env
ASSEMBLY_API_KEY=여기에_발급받은_키_입력
```

---

## 3단계: 동작 확인 (1분)

```bash
# API 작동 테스트
npx tsx src/cli.ts test
```

정상이면 이렇게 출력됩니다:

```
=== 전체 API 작동 테스트 ===

✓ 의원 인적사항              295건
✓ 의원 발의법률안           16477건
✓ 의안 통합검색            17626건
✓ 의안 접수목록           118682건
...
결과: 11/11 API 정상 작동
```

---

## 4단계: AI 클라이언트 연동

### Claude Desktop

#### macOS

설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/git/assembly-api-mcp/dist/index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
      }
    }
  }
}
```

#### Windows

설정 파일 위치: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "assembly-api": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\git\\assembly-api-mcp\\dist\\index.js"],
      "env": {
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
      }
    }
  }
}
```

#### 적용

1. `args`의 경로를 실제 설치 경로로 수정
2. `ASSEMBLY_API_KEY`에 발급받은 키 입력
3. **Claude Desktop 완전 종료** (트레이 아이콘까지 닫기)
4. Claude Desktop 재시작

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
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
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
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
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
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
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
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
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
        "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력"
      }
    }
  }
}
```

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

---

## 5단계: 사용해 보기

### AI 클라이언트에서

연동한 AI에게 다음과 같이 질문하면 됩니다:

- "현재 국회의원 목록을 보여줘"
- "교육 관련 의안을 검색해줘"
- "고민정 의원의 의정활동을 분석해줘"
- "최근 본회의에서 처리된 법안은?"
- "제22대 국회 위원회 목록을 알려줘"
- "현재 계류 중인 청원 목록을 보여줘"

> Lite 프로필(기본)에서는 7개 통합 도구가 사용됩니다.

### 브라우저 GUI에서

HTTP 모드로 실행하면 브라우저용 입법예고 뉴스레터 화면을 사용할 수 있습니다:

```bash
ASSEMBLY_API_KEY=your-api-key MCP_TRANSPORT=http MCP_PORT=3000 npm start
```

접속 주소:

```text
http://localhost:3000/newsletter
```

가능한 작업:

- 키워드와 기간으로 입법예고 검색
- 발의 의원, 상임위 추가 필터로 결과 좁히기
- 검색 링크 복사 후 URL로 다시 열기
- 검색 조건 preset 저장, 다시 불러오기, 삭제
- 진행중만 보기 또는 종료된 입법예고 포함 검색
- 관련도 순 또는 종료일 기준 정렬
- 10/20/50건 단위 페이지 이동
- 검색 결과 일부 선택
- 페이지를 넘겨도 선택 항목 유지
- 상세 미리보기에서 의안번호, 제안일, 입법예고 상태, 관련도, 제안이유, 주요내용 확인
- 상세 보기 모달에서 심사 이력과 접수/처리 이력 확인
- 같은 검색 조건과 상세 보기 요청은 프로세스 내 TTL 캐시 재사용
- 문서 제목, 브리핑 메모, 마무리 문구 편집
- 선택 항목 또는 전체 결과 기준 HTML 파일 저장
- 선택 항목 또는 전체 결과 기준 Markdown, HWPX 파일 저장
- 현재 수신자 목록을 수신자 그룹으로 저장, 다시 불러오기, 추가하기, 삭제
- 저장된 이메일 주소 수정 시 수신자 그룹, 구독 템플릿, 예약 발송 수신자 스냅샷도 함께 갱신
- 검색 조건 + 수신자 + 발송 옵션을 구독 템플릿으로 저장, 다시 불러오기, 바로 예약
- 발의 의원/상임위 필터도 preset, 구독 템플릿, 예약, HTML/Markdown에 함께 반영
- 저장된 구독 템플릿으로 Markdown 또는 HWPX 저장
- 구독 템플릿 카드에서 연결 예약 수와 최근 결과 확인, 최근 발송 HTML/Markdown 바로 열기
- 구독 템플릿 이름/키워드 검색과 상태 필터로 빠르게 찾기
- 수신자, 수신자 그룹, 검색 preset, 구독 템플릿 설정 백업/복원
- 구독 템플릿/예약 발송에서 저장된 수신자 그룹을 연결해 최신 그룹 멤버 반영
- 수신자 수, 활성 예약, 최근 7일 예약 성공/실패 요약 카드 확인
- 선택 항목 또는 전체 결과 기준 HTML 미리보기
- Markdown 다운로드
- HWPX 다운로드
- 발송 로그에서 보낸 HTML/Markdown 스냅샷 다시 확인, HTML/Markdown 저장
- 발송 로그/예약 실행 이력 검색, 상태 필터, 현재 보기 CSV 저장
- 발송 로그를 현재 수신자에게 재전송
- 발송 실패한 개별 수신자만 바로 재시도
- 한 번, 매일, 매주 반복 예약 발송 등록과 취소
- 같은 시각·조건·수신 대상의 예약 발송 중복 등록 방지
- 대기 중·일시정지·실패 상태 예약의 시각/반복 주기 수정
- 반복 예약 일시정지와 재개
- 최근 예약 실행 이력 확인
- 전체 결과 예약을 저장된 검색 preset과 연결
- 반복 예약에서 새로 발견된 법안만 발송

예약 발송은 서버가 실행 중일 때 처리됩니다. 서버가 내려가 있으면 다음 실행 시점에 미처리 예약을 다시 확인합니다. 반복 예약은 성공하면 다음 시각으로 넘어가고, 실패하면 상태를 남기고 멈춥니다. 필요하면 반복 예약을 일시정지했다가 나중에 재개할 수 있습니다. 검색 결과가 없는 회차는 실패 대신 `건너뜀`으로 남기고 다음 회차로 이동합니다. 최근 예약 실행 이력도 따로 남아서 어떤 예약이 언제 성공/건너뜀/실패했는지 바로 확인할 수 있습니다. 전체 결과 예약에서 저장된 검색 preset을 고르면, 이후 발송 때마다 그 preset의 최신 조건을 다시 반영합니다. `새로 발견된 법안만 발송`을 켜면 같은 예약에서 이미 발송했던 법안은 제외합니다. 같은 시각과 조건으로 이미 예약된 작업이 있으면 중복 생성 대신 기존 예약을 수정하거나 재개하도록 안내합니다. 대기 중, 일시정지, 실패 상태의 예약은 시각과 반복 주기를 바로 수정할 수 있습니다.

현재 기본 화면은 이메일 발송 없이 HTML 미리보기와 Markdown/HWPX 저장 중심으로 동작합니다. 그래서 기본 사용에는 SMTP 설정이 필요하지 않습니다.

```env
NEWSLETTER_DATA_DIR=/absolute/path/to/newsletter-data
```

`설정 백업`과 `설정 복원`은 수신자, 수신자 그룹, 검색 preset, 구독 템플릿만 다루며 예약 발송과 발송 로그는 포함하지 않습니다.

### Vercel에 배포할 때

- `/newsletter` 화면과 즉시 발송은 Vercel에서 사용할 수 있습니다.
- 저장 기능과 예약 발송까지 안정적으로 쓰려면 `Vercel Blob`을 함께 쓰는 편이 좋습니다.
- Vercel에서는 기본 저장 경로가 `/tmp/.newsletter-data`로 바뀌며, 이 경로는 영구 저장소가 아닙니다.
- `NEWSLETTER_STORAGE_BACKEND=vercel-blob`, `BLOB_READ_WRITE_TOKEN`을 설정하면 저장 데이터를 유지할 수 있습니다.
- 예약 발송 자동 실행은 `/cron/newsletter`를 주기적으로 호출해야 합니다.
- 자세한 단계별 설명은 [VERCEL.md](VERCEL.md)를 참고하세요.
- 배포 전 점검은 `npm run vercel:check`, 환경 변수 목록 확인은 `npm run vercel:env`
- GitHub Actions 외부 cron 예시는 `examples/github-actions-newsletter-cron.yml`
- `This Serverless Function has crashed` 또는 `FUNCTION_INVOCATION_FAILED`가 보이면 Vercel `Settings -> Build and Deployment -> Node.js Version`이 `20.x` 또는 `22.x`인지 먼저 확인하세요.
- `/newsletter` 화면에서 현재 실행 환경, API 키, 저장소, 다운로드 준비 상태와 누락된 환경 변수 이름도 바로 볼 수 있습니다.
- `/newsletter` 화면의 `Vercel 환경 변수 보기` 버튼으로 복붙용 env 템플릿을 열 수 있습니다.
- `/newsletter` 화면의 `Vercel 배포 점검 보기` 버튼으로 배포 직후 확인 순서를 체크리스트로 바로 열 수 있습니다.

### CLI에서

```bash
# 의원 검색
npx tsx src/cli.ts members --party 국민의힘 --size 5

# 의안 검색
npx tsx src/cli.ts bills --name 부동산

# 의원 의정활동
npx tsx src/cli.ts activity --name 고민정

# 계류의안
npx tsx src/cli.ts pending --size 10

# 전체 API 목록 (276개)
npx tsx src/cli.ts meta
```

### HTTP 서버 모드

```bash
# .env에서 MCP_TRANSPORT=http 설정 후
npm start
# → http://localhost:3000/mcp 에서 MCP 프로토콜 접근
# → http://localhost:3000/health 에서 상태 확인
```

### 브라우저 테스터

```bash
open examples/api-tester.html
# 브라우저에서 API를 직접 테스트할 수 있습니다
```

---

## 문제 해결

### Claude Desktop에서 "server disconnected" 오류

프로젝트의 `.env` 파일에 `MCP_TRANSPORT=http`이 설정되어 있으면, Claude Desktop이 기대하는 stdio 모드 대신 HTTP 모드로 서버가 시작됩니다. 클라이언트 설정에서 `MCP_TRANSPORT`를 명시적으로 override하세요:

```json
"env": {
  "ASSEMBLY_API_KEY": "여기에_발급받은_키_입력",
  "MCP_TRANSPORT": "stdio",
  "MCP_PROFILE": "lite"
}
```

> `.env` 파일의 값은 서버가 `dotenv`로 자동 로드합니다. 클라이언트 설정의 `env`에서 같은 변수를 지정하면 `.env`보다 우선 적용됩니다.

### Claude Desktop에서 도구가 보이지 않음

→ Claude Desktop을 **완전히 종료** (macOS: Cmd+Q, 트레이 아이콘도 닫기) 후 재시작하세요. 설정 파일 변경은 재시작 후에만 적용됩니다.

### "ASSEMBLY_API_KEY가 설정되지 않았습니다"

→ `.env` 파일에 키를 입력했는지 확인하세요. Claude Desktop 등 외부 클라이언트에서 실행할 때는 클라이언트 설정의 `env`에도 키를 지정해야 합니다.

### API 호출이 0건 반환

→ 일부 API는 `AGE` 파라미터가 필요합니다. 도구들은 자동으로 22대(현재)를 기본값으로 사용합니다.

### Rate Limit 초과

→ 개발계정은 월 10,000건 제한입니다. `npx tsx src/cli.ts test`로 현재 상태를 확인하세요.

### 포트 충돌 (HTTP 모드)

→ `EADDRINUSE` 오류가 발생하면 해당 포트를 사용 중인 프로세스를 확인하세요:

```bash
lsof -i :3000
# 다른 포트로 변경
MCP_PORT=3001 npm start
```

---

## 다음 단계

- [README.md](README.md) — 전체 프로젝트 설명, Lite(7개)/Full(23개) 도구 목록
- [docs/api-catalog.md](docs/api-catalog.md) — 국회 API 276개 전체 목록
- [docs/mcp-api.md](docs/mcp-api.md) — MCP 도구 ↔ API 매핑 상세
- [docs/discovered-codes.md](docs/discovered-codes.md) — 발굴된 API 코드 및 파라미터
- [docs/mcp-design-analysis.md](docs/mcp-design-analysis.md) — MCP 도구 설계 분석 보고서
