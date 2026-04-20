import { hasFullSmtpConfig, loadLocalEnv, maskValue, resolveStorageMode } from "./vercel-shared.mjs";

loadLocalEnv();

const showSecrets = process.argv.includes("--show-secrets");

function formatValue(name, fallback = "") {
  const value = process.env[name]?.trim() || fallback;
  if (!value) {
    return "";
  }
  return showSecrets ? value : maskValue(value, 3);
}

const storageMode = resolveStorageMode();
const rows = [
  {
    name: "ASSEMBLY_API_KEY",
    required: true,
    value: formatValue("ASSEMBLY_API_KEY"),
    note: "국회 Open API 인증키",
  },
  {
    name: "MCP_PROFILE",
    required: false,
    value: process.env.MCP_PROFILE?.trim() || "lite",
    note: "권장값은 lite",
  },
  {
    name: "NEWSLETTER_STORAGE_BACKEND",
    required: false,
    value: process.env.NEWSLETTER_STORAGE_BACKEND?.trim() || (storageMode === "vercel-blob" ? "vercel-blob" : ""),
    note: "저장 데이터 유지가 중요하면 vercel-blob 권장",
  },
  {
    name: "NEWSLETTER_BLOB_PREFIX",
    required: false,
    value: process.env.NEWSLETTER_BLOB_PREFIX?.trim() || "newsletter-data",
    note: "Blob 폴더 prefix",
  },
  {
    name: "BLOB_READ_WRITE_TOKEN",
    required: storageMode === "vercel-blob",
    value: formatValue("BLOB_READ_WRITE_TOKEN"),
    note: "Blob 저장 사용 시 필요",
  },
  {
    name: "CRON_SECRET",
    required: false,
    value: formatValue("CRON_SECRET"),
    note: "예약 발송 cron 보호용",
  },
  {
    name: "NEWSLETTER_CRON_CLAIM_LIMIT",
    required: false,
    value: process.env.NEWSLETTER_CRON_CLAIM_LIMIT?.trim() || "5",
    note: "한 번에 처리할 예약 수",
  },
];

const smtpRows = [
  "NEWSLETTER_SMTP_HOST",
  "NEWSLETTER_SMTP_PORT",
  "NEWSLETTER_SMTP_SECURE",
  "NEWSLETTER_SMTP_USER",
  "NEWSLETTER_SMTP_PASS",
  "NEWSLETTER_SMTP_FROM_EMAIL",
  "NEWSLETTER_SMTP_FROM_NAME",
].map((name) => ({
  name,
  required: hasFullSmtpConfig(),
  value: name.includes("PASS") || name.includes("USER") || name.includes("EMAIL")
    ? formatValue(name)
    : (process.env[name]?.trim() || ""),
  note: "이메일 발송 기능 사용 시 필요",
}));

console.log("");
console.log("Vercel 환경 변수 준비표");
console.log("======================");
console.log(showSecrets
  ? "현재 값이 그대로 표시됩니다."
  : "기본값은 마스킹되어 표시됩니다. 실제 값을 보려면 --show-secrets 옵션을 사용하세요.");
console.log("");

for (const row of [...rows, ...smtpRows]) {
  console.log(`${row.required ? "[필수]" : "[선택]"} ${row.name}=${row.value}`);
  console.log(`       ${row.note}`);
}

console.log("");
console.log("권장:");
console.log("- 저장 데이터를 유지하려면 NEWSLETTER_STORAGE_BACKEND=vercel-blob + BLOB_READ_WRITE_TOKEN");
console.log("- 예약 발송 보호를 위해 CRON_SECRET");
console.log("- 이메일 발송을 쓰려면 NEWSLETTER_SMTP_* 전체");
