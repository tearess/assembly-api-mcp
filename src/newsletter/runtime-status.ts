import {
  describeNewsletterStorage,
  isNewsletterStoragePersistent,
} from "./storage.js";
import { type NewsletterRuntimeStatus } from "./types.js";

export function buildNewsletterRuntimeStatus(
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): NewsletterRuntimeStatus {
  const platform = env["VERCEL"] ? "vercel" : "local";
  const apiKeyConfigured = Boolean(env["ASSEMBLY_API_KEY"]?.trim());
  const storageMode = describeNewsletterStorage(env);
  const persistentStorage = isNewsletterStoragePersistent(env);
  const smtpConfigured = true;
  const cronSecretConfigured = true;

  const missingEnvKeys = new Set<string>();
  const warnings: string[] = [];
  const notes: string[] = [];
  const recommendedActions: string[] = [];

  if (!apiKeyConfigured) {
    warnings.push("ASSEMBLY_API_KEY가 없어 법안 검색과 상세 조회가 동작하지 않을 수 있습니다.");
    missingEnvKeys.add("ASSEMBLY_API_KEY");
    recommendedActions.push("열린국회 API를 사용하려면 ASSEMBLY_API_KEY를 설정하세요.");
  }

  if (platform === "vercel" && !persistentStorage) {
    warnings.push("현재 임시 저장 모드입니다. 수신자, preset, 로그를 유지하려면 Vercel Blob 설정이 필요합니다.");
    if (env["NEWSLETTER_STORAGE_BACKEND"]?.trim().toLowerCase() !== "vercel-blob") {
      missingEnvKeys.add("NEWSLETTER_STORAGE_BACKEND");
    }
    if (!env["BLOB_READ_WRITE_TOKEN"]?.trim()) {
      missingEnvKeys.add("BLOB_READ_WRITE_TOKEN");
    }
    recommendedActions.push("저장 데이터를 유지하려면 NEWSLETTER_STORAGE_BACKEND=vercel-blob 과 BLOB_READ_WRITE_TOKEN을 설정하세요.");
  }

  notes.push("현재 화면은 HTML 미리보기와 Markdown, HWPX 다운로드 중심으로 동작합니다.");

  return {
    asOf: formatNowKst(now),
    platform,
    platformLabel: platform === "vercel" ? "Vercel" : "로컬 서버",
    apiKeyConfigured,
    storageMode,
    storageLabel: describeStorageLabel(storageMode),
    persistentStorage,
    smtpConfigured,
    cronSecretConfigured,
    missingEnvKeys: Array.from(missingEnvKeys).sort((left, right) => left.localeCompare(right)),
    recommendedActions,
    warnings,
    notes,
  };
}

function describeStorageLabel(mode: NewsletterRuntimeStatus["storageMode"]): string {
  if (mode === "vercel-blob") {
    return "Vercel Blob 영구 저장";
  }
  if (mode === "local-tmp") {
    return "임시 저장 (/tmp)";
  }
  return "로컬 파일 저장";
}

function formatNowKst(date: Date): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return formatter.format(date);
}
