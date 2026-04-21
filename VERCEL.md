# Vercel 배포 가이드

이 프로젝트는 Vercel에 올릴 수 있습니다.

다만 꼭 먼저 알아야 할 점이 있습니다.

- `/newsletter` 화면, 검색, 미리보기, HTML/Markdown 저장, 즉시 이메일 발송은 Vercel에서 사용할 수 있습니다.
- 저장된 수신자, 검색 preset, 발송 로그, 예약 발송까지 안정적으로 쓰려면 `Vercel Blob`을 함께 설정하는 편이 좋습니다.
- `/mcp` 세션형 HTTP 엔드포인트는 Vercel 배포에서 지원하지 않습니다.

## 1. 왜 추가 설정이 필요한가요?

Vercel은 보통 서버를 계속 켜 두는 방식이 아니라, 요청이 들어올 때마다 함수를 잠깐 실행하는 방식입니다.

그래서:

- 로컬 PC처럼 프로젝트 폴더 안에 파일을 오래 저장하는 구조와는 잘 맞지 않고
- 저장 기능을 안정적으로 쓰려면 외부 저장소가 필요합니다.

이 프로젝트는 Vercel에서 별도 설정이 없으면 `/tmp/.newsletter-data`를 사용합니다.

하지만 `/tmp`는 **영구 저장소가 아닙니다.**

즉, Blob을 연결하지 않으면:

- 저장한 수신자 목록이 사라질 수 있고
- 검색 preset이 유지되지 않을 수 있고
- 예약 발송 작업도 안정적으로 유지되지 않을 수 있습니다.

## 2. 무엇이 바로 되나요?

Vercel에 배포한 직후 바로 되는 기능:

- `/newsletter` 화면 열기
- 키워드/기간 검색
- 상세 미리보기
- HTML 미리보기
- HTML 저장
- Markdown 저장
- SMTP 설정이 되어 있으면 즉시 이메일 발송

추가 저장소 설정이 있으면 더 안정적인 기능:

- 수신자 저장
- 수신자 그룹 저장
- 검색 preset 저장
- 구독 템플릿 저장
- 발송 로그 보관
- 예약 발송

## 3. 배포 순서

### 3-1. GitHub에 올리기

이 프로젝트를 GitHub 저장소에 올립니다.

### 3-2. Vercel에서 프로젝트 가져오기

1. Vercel에 로그인합니다.
2. `Add New...`
3. `Project`
4. GitHub 저장소를 선택합니다.

### 3-2-1. Node.js 버전도 확인하세요

이 프로젝트는 `@vercel/blob`를 포함하고 있어서 **Node 20 이상**을 권장합니다.

Vercel에서 확인 위치:

1. 프로젝트 선택
2. `Settings`
3. `Build and Deployment`
4. `Node.js Version`

권장:

- `20.x`
- `22.x`

만약 배포 후 `This Serverless Function has crashed` 또는 `FUNCTION_INVOCATION_FAILED`가 보이면 이 값부터 먼저 확인한 뒤 다시 배포하는 것이 좋습니다.

### 3-3. 환경 변수 넣기

Vercel 프로젝트의 `Settings -> Environment Variables`에서 아래 값을 넣습니다.

이 저장소에는 `vercel.json`이 이미 들어 있어서:

- `npm run build`가 배포 때 자동 실행되고
- `api/index.js`, `api/cron-newsletter.js` 함수가 사용되고
- 함수 최대 실행 시간은 60초로 설정되어 있습니다.

배포 전에 로컬에서 아래 명령으로 빠르게 점검할 수도 있습니다.

```bash
npm run vercel:check
```

환경 변수 이름 목록을 보기만 하고 싶으면:

```bash
npm run vercel:env
```

마스킹 없이 실제 현재 값을 보고 싶으면:

```bash
node scripts/vercel-env.mjs --show-secrets
```

최소 필수:

```env
ASSEMBLY_API_KEY=여기에_당신의_열린국회_API_키
MCP_PROFILE=lite
```

이메일 발송까지 쓰려면:

```env
NEWSLETTER_SMTP_HOST=smtp.example.com
NEWSLETTER_SMTP_PORT=465
NEWSLETTER_SMTP_SECURE=true
NEWSLETTER_SMTP_USER=your-account
NEWSLETTER_SMTP_PASS=your-password
NEWSLETTER_SMTP_FROM_EMAIL=no-reply@example.com
NEWSLETTER_SMTP_FROM_NAME=입법예고 뉴스레터
```

저장 기능까지 안정적으로 쓰려면 권장:

```env
NEWSLETTER_STORAGE_BACKEND=vercel-blob
NEWSLETTER_BLOB_PREFIX=newsletter-data
BLOB_READ_WRITE_TOKEN=여기에_Vercel_Blob_토큰
```

예약 발송 보호용 비밀값 권장:

```env
CRON_SECRET=아주_긴_랜덤_문자열
NEWSLETTER_CRON_CLAIM_LIMIT=5
```

## 4. 배포 후 어디로 들어가나요?

배포가 끝나면 이 주소로 들어가면 됩니다.

```text
https://당신의-프로젝트.vercel.app/newsletter
```

상태 확인:

```text
https://당신의-프로젝트.vercel.app/health
```

`/health`에서는 현재 저장 방식도 같이 볼 수 있습니다.

- `vercel-blob`: 영구 저장소 사용 중
- `local-tmp`: 임시 저장소만 사용 중

## 5. 예약 발송은 어떻게 하나요?

예약 발송은 단순히 저장만 해서는 자동으로 돌지 않습니다.
정해진 시간마다 `/cron/newsletter`를 호출해 주는 작업이 하나 더 필요합니다.

현재 저장소의 `vercel.json`에는 **배포용 rewrite만 들어 있고 cron 등록은 일부러 넣지 않았습니다.**

이유는:

- Vercel Hobby 플랜은 분 단위 cron이 안 될 수 있고
- 분 단위 cron을 기본값으로 넣으면 어떤 계정에서는 배포 자체가 실패할 수 있기 때문입니다.

### 방법 A. Vercel Pro에서 분 단위 cron 쓰기

`vercel.json`에 아래 내용을 추가하면 됩니다.

```json
"crons": [
  {
    "path": "/cron/newsletter",
    "schedule": "* * * * *"
  }
]
```

이렇게 하면 1분마다 due job을 확인합니다.

### 방법 B. 외부 cron으로 호출하기

Vercel 플랜과 상관없이 외부 스케줄러에서 아래 주소를 주기적으로 호출할 수도 있습니다.

```text
https://당신의-프로젝트.vercel.app/cron/newsletter
```

`CRON_SECRET`를 넣었다면 요청 헤더도 같이 보내야 합니다.

```text
Authorization: Bearer 당신의_CRON_SECRET
```

예:

- GitHub Actions
- UptimeRobot
- cron-job.org
- 별도 서버의 crontab

GitHub Actions 예시는 [examples/github-actions-newsletter-cron.yml](examples/github-actions-newsletter-cron.yml)에 넣어 두었습니다.

사용 방법:

1. 이 파일을 `.github/workflows/newsletter-cron.yml`로 복사합니다.
2. GitHub 저장소 `Settings -> Secrets and variables -> Actions`에서 아래 2개를 만듭니다.
3. `NEWSLETTER_CRON_URL`
   `https://당신의-프로젝트.vercel.app/cron/newsletter`
4. `NEWSLETTER_CRON_SECRET`
   `CRON_SECRET`와 같은 값
5. 필요하면 cron 표현식을 원하는 주기로 바꿉니다.

## 6. Vercel Blob을 꼭 써야 하나요?

꼭은 아닙니다.

하지만 아래 기능을 안정적으로 쓰고 싶으면 사실상 쓰는 편이 좋습니다.

- 저장된 수신자 목록
- 검색 preset
- 구독 템플릿
- 발송 로그
- 예약 발송
- 발송 스냅샷

Blob 없이도 화면은 열리고 즉시 발송도 가능할 수 있지만, 저장 데이터가 유지되지 않을 수 있습니다.

## 7. Vercel에서 안 되는 것

현재 기준으로 Vercel에서는 이 기능을 지원하지 않습니다.

- `/mcp` 세션형 HTTP transport

이 기능은 메모리에 세션을 오래 들고 있어야 해서, 일반적인 Vercel 함수 구조와 잘 맞지 않습니다.

## 8. 가장 추천하는 조합

가장 안정적인 조합은 아래입니다.

```env
ASSEMBLY_API_KEY=...
MCP_PROFILE=lite
NEWSLETTER_STORAGE_BACKEND=vercel-blob
BLOB_READ_WRITE_TOKEN=...
NEWSLETTER_BLOB_PREFIX=newsletter-data
NEWSLETTER_SMTP_HOST=...
NEWSLETTER_SMTP_PORT=465
NEWSLETTER_SMTP_SECURE=true
NEWSLETTER_SMTP_USER=...
NEWSLETTER_SMTP_PASS=...
NEWSLETTER_SMTP_FROM_EMAIL=...
NEWSLETTER_SMTP_FROM_NAME=입법예고 뉴스레터
CRON_SECRET=...
```

여기에:

- Vercel Pro의 분 단위 cron

또는

- 외부 cron 호출

까지 붙이면 예약 발송도 실제 운영에 가깝게 쓸 수 있습니다.

추가로 `/newsletter` 화면 안에서도 바로 점검할 수 있습니다.

- `실행 환경 상태`에서 현재 플랫폼, 열린국회 API 키, 저장소, SMTP, `CRON_SECRET` 준비 상태 확인
- `Vercel 환경 변수 보기`로 env 템플릿 열기
- `Vercel cron 설정 보기`로 `vercel.json` cron 예시 열기
- `GitHub Actions cron 보기`로 외부 cron 워크플로 예시 열기
- `Vercel 배포 점검 보기`로 배포 직후 확인 순서를 체크리스트로 열기
