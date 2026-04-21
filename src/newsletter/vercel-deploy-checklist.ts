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
  const runtimeStatus = buildNewsletterRuntimeStatus(env);

  const lines = [
    "# Vercel Deployment Checklist",
    "",
    "배포 직후 아래 순서대로 확인하면 됩니다.",
    "",
    "## 바로 열 주소",
    `- 뉴스레터 화면: ${newsletterUrl}`,
    `- 헬스 체크: ${healthUrl}`,
    "",
    "## 1. 배포 직후 기본 확인",
    `- [ ] 브라우저에서 ${healthUrl} 를 열어 200 응답이 나오는지 확인합니다.`,
    `- [ ] 브라우저에서 ${newsletterUrl} 를 열어 화면이 정상적으로 보이는지 확인합니다.`,
    "- [ ] 검색 버튼을 눌러 실제 법안 목록이 나오는지 확인합니다.",
    "- [ ] HTML 미리보기가 열리는지 확인합니다.",
    "- [ ] Markdown 저장이 되는지 확인합니다.",
    "- [ ] HWPX 저장이 되는지 확인합니다.",
    "",
    "## 2. 화면 안에서 확인할 것",
    "- [ ] `/newsletter` 상단의 `실행 환경 상태` 카드가 보이는지 확인합니다.",
    "- [ ] 실행 환경 카드가 Vercel 로 보이는지 확인합니다.",
    `- [ ] API 키 카드가 ${runtimeStatus.apiKeyConfigured ? "준비 완료" : "설정 필요"} 상태인지 확인합니다.`,
    `- [ ] 저장소 카드가 ${runtimeStatus.persistentStorage ? "영구 저장" : "임시 저장"} 상태인지 확인합니다.`,
    "- [ ] 다운로드 카드가 준비 완료로 보이는지 확인합니다.",
    "",
    "## 3. 설정 버튼으로 바로 여는 자료",
    "- [ ] `Vercel 환경 변수 보기` 버튼으로 env 템플릿을 열어 누락된 값을 채웁니다.",
    "- [ ] `Vercel 배포 점검 보기` 버튼으로 같은 체크리스트를 화면에서도 다시 확인합니다.",
    "",
    "## 4. 저장 데이터 유지가 필요할 때",
    "- [ ] Vercel Blob을 연결해 검색 preset, 구독 템플릿, 설정 백업 정보가 유지되는지 확인합니다.",
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
    "- [ ] 저장된 검색 preset/구독 템플릿이 새로고침 뒤에도 유지되는지 확인합니다.",
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
