import { buildNewsletterRuntimeStatus } from "./runtime-status.js";

export interface NewsletterVercelDeployChecklistTemplate {
  readonly filename: string;
  readonly template: string;
}

export function buildVercelDeployChecklist(
  env: NodeJS.ProcessEnv = process.env,
  options: {
    readonly origin?: string | null;
  } = {},
): NewsletterVercelDeployChecklistTemplate {
  const origin = normalizeOrigin(options.origin);
  const newsletterUrl = origin ? `${origin}/newsletter` : "https://<YOUR-DEPLOYMENT>.vercel.app/newsletter";
  const healthUrl = origin ? `${origin}/health` : "https://<YOUR-DEPLOYMENT>.vercel.app/health";
  const cronUrl = origin ? `${origin}/cron/newsletter` : "https://<YOUR-DEPLOYMENT>.vercel.app/cron/newsletter";
  const runtimeStatus = buildNewsletterRuntimeStatus(env);

  const lines = [
    "# Vercel Deployment Checklist",
    "",
    "배포 직후 아래 순서대로 확인하면 됩니다.",
    "",
    "## 바로 열 주소",
    `- 뉴스레터 화면: ${newsletterUrl}`,
    `- 헬스 체크: ${healthUrl}`,
    `- 예약 cron 엔드포인트: ${cronUrl}`,
    "",
    "## 1. 배포 직후 기본 확인",
    `- [ ] 브라우저에서 ${healthUrl} 를 열어 200 응답이 나오는지 확인합니다.`,
    `- [ ] 브라우저에서 ${newsletterUrl} 를 열어 화면이 정상적으로 보이는지 확인합니다.`,
    "- [ ] 검색 버튼을 눌러 실제 법안 목록이 나오는지 확인합니다.",
    "- [ ] HTML 미리보기가 열리는지 확인합니다.",
    "",
    "## 2. 화면 안에서 확인할 것",
    "- [ ] `/newsletter` 상단의 `실행 환경 상태` 카드가 보이는지 확인합니다.",
    "- [ ] 실행 환경 카드가 Vercel 로 보이는지 확인합니다.",
    `- [ ] API 키 카드가 ${runtimeStatus.apiKeyConfigured ? "준비 완료" : "설정 필요"} 상태인지 확인합니다.`,
    `- [ ] 저장소 카드가 ${runtimeStatus.persistentStorage ? "영구 저장" : "임시 저장"} 상태인지 확인합니다.`,
    `- [ ] 이메일 발송 카드가 ${runtimeStatus.smtpConfigured ? "준비 완료" : "추가 설정 필요"} 상태인지 확인합니다.`,
    `- [ ] 예약 보호 카드가 ${runtimeStatus.cronSecretConfigured ? "CRON_SECRET 설정됨" : "보호 설정 필요"} 상태인지 확인합니다.`,
    "",
    "## 3. 설정 버튼으로 바로 여는 자료",
    "- [ ] `Vercel 환경 변수 보기` 버튼으로 env 템플릿을 열어 누락된 값을 채웁니다.",
    "- [ ] `Vercel cron 설정 보기` 버튼으로 `vercel.json`용 cron 스니펫을 확인합니다.",
    "- [ ] `GitHub Actions cron 보기` 버튼으로 외부 cron 워크플로가 필요한지 확인합니다.",
    "",
    "## 4. 예약 발송을 쓸 때",
    `- [ ] ${cronUrl} 를 주기적으로 호출하도록 Vercel cron 또는 외부 cron을 연결합니다.`,
    "- [ ] CRON_SECRET을 설정한 뒤 Authorization: Bearer 헤더로 보호되는지 확인합니다.",
    "",
    "## 5. 메일 발송을 쓸 때",
    "- [ ] SMTP 환경 변수(NEWSLETTER_SMTP_*)를 채웁니다.",
    "- [ ] 본인 이메일 1개만 넣고 테스트 발송을 먼저 해 봅니다.",
    "- [ ] HTML 본문과 첨부된 Markdown/HTML 파일이 모두 도착하는지 확인합니다.",
  ];

  if (runtimeStatus.missingEnvKeys.length) {
    lines.push("", "## 현재 빠진 환경 변수", ...runtimeStatus.missingEnvKeys.map((key) => `- [ ] ${key}`));
  }

  if (runtimeStatus.recommendedActions.length) {
    lines.push(
      "",
      "## 다음 조치 추천",
      ...runtimeStatus.recommendedActions.map((action) => `- [ ] ${action}`),
    );
  }

  if (runtimeStatus.notes.length) {
    lines.push("", "## 참고 메모", ...runtimeStatus.notes.map((note) => `- ${note}`));
  }

  lines.push(
    "",
    "## 마지막 점검",
    "- [ ] 저장된 수신자/검색 preset/구독 템플릿이 새로고침 뒤에도 유지되는지 확인합니다.",
    "- [ ] 예약 발송을 하나 만들어 실제로 실행되거나, cron 엔드포인트를 수동 호출해 동작을 확인합니다.",
    "- [ ] 문제가 있으면 `/newsletter`의 실행 환경 상태와 Vercel Function 로그를 함께 확인합니다.",
  );

  return {
    filename: "vercel-deploy-checklist.md",
    template: lines.join("\n") + "\n",
  };
}

function normalizeOrigin(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.replace(/\/+$/, "");
}
