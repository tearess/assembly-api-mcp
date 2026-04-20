import { type IncomingMessage, type ServerResponse } from "node:http";
import { config as loadDotEnv } from "dotenv";
import { loadConfig } from "./config.js";
import { NewsletterScheduleProcessor } from "./newsletter/scheduler.js";
import {
  describeNewsletterStorage,
  isNewsletterStoragePersistent,
} from "./newsletter/storage.js";
import { handleNewsletterRequest } from "./web-api/newsletter-routes.js";

loadDotEnv();

let cachedConfig: ReturnType<typeof loadConfig> | null = null;

function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}

function buildRequestUrl(req: IncomingMessage): URL {
  const host = req.headers.host?.toString().trim() || "localhost";
  return new URL(req.url ?? "/", `https://${host}`);
}

export async function handleVercelRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const requestUrl = buildRequestUrl(req);
    const pathname = requestUrl.pathname;

    if (pathname === "/" && req.method === "GET") {
      res.writeHead(307, { Location: "/newsletter" });
      res.end();
      return;
    }

    if (pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        status: "ok",
        runtime: "vercel",
        storage: describeNewsletterStorage(),
        persistentStorage: isNewsletterStoragePersistent(),
      }));
      return;
    }

    if (pathname === "/mcp") {
      res.writeHead(501, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        error: "Vercel 배포에서는 MCP HTTP 세션 모드를 지원하지 않습니다.",
      }));
      return;
    }

    const handled = await handleNewsletterRequest(req, res, getConfig());
    if (handled) {
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: message }));
  }
}

export async function handleVercelNewsletterCron(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const cronSecret = process.env["CRON_SECRET"]?.trim();
    const authorization = Array.isArray(req.headers.authorization)
      ? req.headers.authorization[0]
      : req.headers.authorization;
    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const processor = new NewsletterScheduleProcessor(getConfig());
    const result = await processor.runDueJobsOnce(
      normalizePositiveInteger(process.env["NEWSLETTER_CRON_CLAIM_LIMIT"], 5),
    );
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      ok: true,
      runtime: "vercel-cron",
      storage: describeNewsletterStorage(),
      persistentStorage: isNewsletterStoragePersistent(),
      ...result,
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: message }));
  }
}

function normalizePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
