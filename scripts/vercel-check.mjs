import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  hasFullSmtpConfig,
  loadLocalEnv,
  loadPackageJson,
  loadVercelConfig,
  maskValue,
  projectRoot,
  resolveStorageMode,
} from "./vercel-shared.mjs";

loadLocalEnv();

const vercelConfig = loadVercelConfig();
const packageJson = loadPackageJson();
const checks = [];

function addCheck(ok, title, detail) {
  checks.push({ ok, title, detail });
}

function hasFile(relativePath) {
  return existsSync(resolve(projectRoot, relativePath));
}

addCheck(Boolean(process.env.ASSEMBLY_API_KEY?.trim()), "열린국회 API 키", process.env.ASSEMBLY_API_KEY?.trim()
  ? `설정됨 (${maskValue(process.env.ASSEMBLY_API_KEY)})`
  : "ASSEMBLY_API_KEY가 비어 있습니다.");

addCheck(hasFile("vercel.json"), "vercel.json", hasFile("vercel.json")
  ? "배포 설정 파일이 있습니다."
  : "vercel.json이 없습니다.");

addCheck(hasFile("api/index.js"), "Vercel 메인 함수", hasFile("api/index.js")
  ? "api/index.js가 있습니다."
  : "api/index.js가 없습니다.");

addCheck(hasFile("api/cron-newsletter.js"), "Vercel cron 함수", hasFile("api/cron-newsletter.js")
  ? "api/cron-newsletter.js가 있습니다."
  : "api/cron-newsletter.js가 없습니다.");

addCheck(hasFile("dist/vercel-handler.js"), "빌드 산출물", hasFile("dist/vercel-handler.js")
  ? "dist/vercel-handler.js가 있습니다."
  : "dist/vercel-handler.js가 없습니다. Vercel 배포 전에 npm run build를 권장합니다.");

addCheck(vercelConfig?.buildCommand === "npm run build", "buildCommand", vercelConfig?.buildCommand
  ? `현재 값: ${vercelConfig.buildCommand}`
  : "buildCommand가 없습니다.");

const configuredNodeEngine = packageJson?.engines?.node;
addCheck(
  typeof configuredNodeEngine === "string" && configuredNodeEngine.includes("20"),
  "Node.js 버전 요구사항",
  typeof configuredNodeEngine === "string"
    ? `package.json engines.node=${configuredNodeEngine} (Vercel은 Node 20 이상 권장)`
    : "package.json engines.node 값이 없습니다. Vercel Project Settings에서 Node.js 20.x 또는 22.x를 권장합니다.",
);

const indexFunctionDuration = vercelConfig?.functions?.["api/index.js"]?.maxDuration;
const cronFunctionDuration = vercelConfig?.functions?.["api/cron-newsletter.js"]?.maxDuration;
addCheck(indexFunctionDuration === 60, "메인 함수 실행 시간", typeof indexFunctionDuration === "number"
  ? `api/index.js maxDuration=${indexFunctionDuration}`
  : "api/index.js maxDuration이 없습니다.");
addCheck(cronFunctionDuration === 60, "cron 함수 실행 시간", typeof cronFunctionDuration === "number"
  ? `api/cron-newsletter.js maxDuration=${cronFunctionDuration}`
  : "api/cron-newsletter.js maxDuration이 없습니다.");

const storageMode = resolveStorageMode();
addCheck(storageMode === "vercel-blob", "저장소 방식", storageMode === "vercel-blob"
  ? "Vercel Blob 영구 저장을 사용하도록 설정되어 있습니다."
  : "현재는 local/tmp 저장 방식입니다. Vercel에서 데이터 유지가 중요하면 NEWSLETTER_STORAGE_BACKEND=vercel-blob 과 BLOB_READ_WRITE_TOKEN을 설정하세요.");

addCheck(hasFullSmtpConfig(), "SMTP 설정", hasFullSmtpConfig()
  ? "즉시 이메일 발송에 필요한 SMTP 값이 채워져 있습니다."
  : "SMTP 값이 일부 비어 있습니다. 화면은 열리지만 이메일 발송은 동작하지 않을 수 있습니다.");

addCheck(Boolean(process.env.CRON_SECRET?.trim()), "CRON_SECRET", process.env.CRON_SECRET?.trim()
  ? "cron 보호용 비밀값이 설정되어 있습니다."
  : "CRON_SECRET이 없습니다. 외부에서 /cron/newsletter 호출 시 보호가 약합니다.");

addCheck(Array.isArray(vercelConfig?.crons) && vercelConfig.crons.length > 0, "vercel.json cron 등록", Array.isArray(vercelConfig?.crons) && vercelConfig.crons.length > 0
  ? `${vercelConfig.crons.length}개의 cron 설정이 있습니다.`
  : "vercel.json에 crons 설정이 없습니다. 외부 cron 또는 Vercel Pro cron을 별도로 구성해야 합니다.");

const passed = checks.filter((item) => item.ok).length;
const failed = checks.length - passed;

console.log("");
console.log("Vercel 배포 점검");
console.log("================");
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "WARN"}  ${check.title}`);
  console.log(`      ${check.detail}`);
}
console.log("");
console.log(`요약: ${passed}개 통과, ${failed}개 확인 필요`);
console.log("");
console.log("참고:");
console.log("- /newsletter GUI는 Vercel에서 동작합니다.");
console.log("- /mcp 세션형 HTTP transport는 Vercel에서 지원하지 않습니다.");
console.log("- 예약 발송 자동 실행은 /cron/newsletter를 주기적으로 호출해야 합니다.");
