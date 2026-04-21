import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";

export const projectRoot = resolve(new URL("..", import.meta.url).pathname);

export function loadLocalEnv() {
  loadDotEnv({ path: resolve(projectRoot, ".env") });
}

export function loadVercelConfig() {
  const filePath = resolve(projectRoot, "vercel.json");
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function loadPackageJson() {
  const filePath = resolve(projectRoot, "package.json");
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function maskValue(value, visible = 2) {
  if (!value) return "(missing)";
  if (value.length <= visible * 2) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, visible)}${"*".repeat(Math.max(4, value.length - visible * 2))}${value.slice(-visible)}`;
}

export function isTruthyEnv(value) {
  return value === "1" || value === "true";
}

export function hasFullSmtpConfig(env = process.env) {
  const required = [
    "NEWSLETTER_SMTP_HOST",
    "NEWSLETTER_SMTP_PORT",
    "NEWSLETTER_SMTP_USER",
    "NEWSLETTER_SMTP_PASS",
    "NEWSLETTER_SMTP_FROM_EMAIL",
  ];
  return required.every((key) => env[key]?.trim());
}

export function resolveStorageMode(env = process.env) {
  const backend = env.NEWSLETTER_STORAGE_BACKEND?.trim().toLowerCase();
  if (backend === "vercel-blob") {
    return "vercel-blob";
  }
  if (backend === "local") {
    return "local";
  }
  if (env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return "vercel-blob";
  }
  return "local-tmp";
}

export function readTextFile(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf-8");
}
