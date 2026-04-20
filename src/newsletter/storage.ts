import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

const DEFAULT_DATA_DIR = ".newsletter-data";
const DEFAULT_BLOB_PREFIX = "newsletter-data";

export type NewsletterStorageBackend = "local" | "vercel-blob";
export type NewsletterStorageMode = "local" | "local-tmp" | "vercel-blob";

export function resolveNewsletterDataDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env["NEWSLETTER_DATA_DIR"]?.trim();
  if (override) {
    return resolve(override);
  }

  if (isVercelRuntime(env)) {
    return resolve("/tmp", DEFAULT_DATA_DIR);
  }

  return resolve(process.cwd(), DEFAULT_DATA_DIR);
}

export function resolveNewsletterStorageBackend(
  env: NodeJS.ProcessEnv = process.env,
): NewsletterStorageBackend {
  const configured = env["NEWSLETTER_STORAGE_BACKEND"]?.trim().toLowerCase();
  if (configured === "vercel-blob") {
    return "vercel-blob";
  }
  if (configured === "local") {
    return "local";
  }

  if (isVercelRuntime(env) && env["BLOB_READ_WRITE_TOKEN"]?.trim()) {
    return "vercel-blob";
  }

  return "local";
}

export function describeNewsletterStorage(
  env: NodeJS.ProcessEnv = process.env,
): NewsletterStorageMode {
  const backend = resolveNewsletterStorageBackend(env);
  if (backend === "vercel-blob") {
    return "vercel-blob";
  }

  return isVercelRuntime(env) ? "local-tmp" : "local";
}

export function isNewsletterStoragePersistent(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (resolveNewsletterStorageBackend(env) === "vercel-blob") {
    return true;
  }

  return !isVercelRuntime(env);
}

export async function readNewsletterDataText(
  filePath: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  if (resolveNewsletterStorageBackend(env) === "vercel-blob") {
    return readBlobText(filePath, env);
  }

  if (!existsSync(filePath)) {
    return null;
  }

  return readFile(filePath, "utf-8");
}

export async function writeNewsletterDataText(
  filePath: string,
  text: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (resolveNewsletterStorageBackend(env) === "vercel-blob") {
    await writeBlobText(filePath, text, env);
    return;
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf-8");
}

function isVercelRuntime(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env["VERCEL"]);
}

function requireBlobToken(env: NodeJS.ProcessEnv): string {
  const token = env["BLOB_READ_WRITE_TOKEN"]?.trim();
  if (!token) {
    throw new Error(
      "Vercel Blob 저장소를 사용하려면 BLOB_READ_WRITE_TOKEN 환경 변수가 필요합니다.",
    );
  }
  return token;
}

function resolveBlobPathname(
  filePath: string,
  env: NodeJS.ProcessEnv,
): string {
  const prefix = normalizeBlobPrefix(env["NEWSLETTER_BLOB_PREFIX"]?.trim() || DEFAULT_BLOB_PREFIX);
  const dataDir = resolveNewsletterDataDir(env);
  const relativePath = relative(dataDir, filePath).replaceAll("\\", "/");
  const normalizedPath = relativePath && !relativePath.startsWith("..")
    ? relativePath
    : basename(filePath);

  return `${prefix}/${normalizedPath.replace(/^\/+/, "")}`;
}

function normalizeBlobPrefix(value: string): string {
  return value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

async function readBlobText(
  filePath: string,
  env: NodeJS.ProcessEnv,
): Promise<string | null> {
  const token = requireBlobToken(env);
  const pathname = resolveBlobPathname(filePath, env);
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, {
    access: "private",
    token,
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  return new Response(result.stream).text();
}

async function writeBlobText(
  filePath: string,
  text: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const token = requireBlobToken(env);
  const pathname = resolveBlobPathname(filePath, env);
  const { put } = await import("@vercel/blob");
  await put(pathname, text, {
    access: "private",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: inferContentType(filePath),
    token,
  });
}

function inferContentType(filePath: string): string {
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }

  if (filePath.endsWith(".md")) {
    return "text/markdown; charset=utf-8";
  }

  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  return "text/plain; charset=utf-8";
}
