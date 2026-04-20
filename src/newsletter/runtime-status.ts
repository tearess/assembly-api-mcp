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
  const missingSmtpKeys = getMissingSmtpKeys(env);
  const smtpConfigured = missingSmtpKeys.length === 0;
  const cronSecretConfigured = Boolean(env["CRON_SECRET"]?.trim());

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

  if (!smtpConfigured) {
    warnings.push("SMTP 설정이 비어 있어 이메일 실제 발송은 동작하지 않을 수 있습니다.");
    for (const key of missingSmtpKeys) {
      missingEnvKeys.add(key);
    }
    recommendedActions.push("이메일 발송을 쓰려면 NEWSLETTER_SMTP_HOST, PORT, USER, PASS, FROM_EMAIL을 채우세요.");
  }

  if (!cronSecretConfigured) {
    warnings.push("CRON_SECRET이 없어 /cron/newsletter 보호가 약합니다.");
    missingEnvKeys.add("CRON_SECRET");
    recommendedActions.push("외부 cron 호출을 보호하려면 CRON_SECRET을 설정하세요.");
  }

  if (platform === "vercel") {
    notes.push("예약 발송 자동 실행은 Vercel cron 또는 외부 cron 호출을 별도로 연결해야 합니다.");
    recommendedActions.push("예약 발송 자동 실행이 필요하면 /cron/newsletter를 Vercel cron 또는 외부 스케줄러로 주기 호출하세요.");
  } else {
    notes.push("로컬 HTTP 서버에서는 프로세스가 켜져 있는 동안 예약 발송이 내부 타이머로 처리됩니다.");
  }

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

function getMissingSmtpKeys(env: NodeJS.ProcessEnv): string[] {
  const required = [
    "NEWSLETTER_SMTP_HOST",
    "NEWSLETTER_SMTP_PORT",
    "NEWSLETTER_SMTP_USER",
    "NEWSLETTER_SMTP_PASS",
    "NEWSLETTER_SMTP_FROM_EMAIL",
  ];
  return required.filter((key) => !env[key]?.trim());
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
