export interface NewsletterVercelEnvTemplate {
  readonly filename: string;
  readonly template: string;
}

export function buildVercelEnvTemplate(
  env: NodeJS.ProcessEnv = process.env,
  options: {
    readonly origin?: string | null;
  } = {},
): NewsletterVercelEnvTemplate {
  const origin = normalizeOrigin(options.origin);
  const newsletterUrl = origin ? `${origin}/newsletter` : "https://<YOUR-DEPLOYMENT>.vercel.app/newsletter";
  const healthUrl = origin ? `${origin}/health` : "https://<YOUR-DEPLOYMENT>.vercel.app/health";
  const cronUrl = origin ? `${origin}/cron/newsletter` : "https://<YOUR-DEPLOYMENT>.vercel.app/cron/newsletter";
  const lines = [
    "# Vercel Environment Variables",
    "# Copy these values into: Project Settings -> Environment Variables",
    "",
    "# Required",
    "ASSEMBLY_API_KEY=<YOUR_ASSEMBLY_API_KEY>",
    `MCP_PROFILE=${escapeEnvValue(env["MCP_PROFILE"]?.trim() || "lite")}`,
    "",
    "# Recommended persistent storage",
    `NEWSLETTER_STORAGE_BACKEND=${escapeEnvValue(env["NEWSLETTER_STORAGE_BACKEND"]?.trim() || "vercel-blob")}`,
    `NEWSLETTER_BLOB_PREFIX=${escapeEnvValue(env["NEWSLETTER_BLOB_PREFIX"]?.trim() || "newsletter-data")}`,
    "BLOB_READ_WRITE_TOKEN=<YOUR_BLOB_READ_WRITE_TOKEN>",
    "",
    "# Recommended cron protection",
    "CRON_SECRET=<YOUR_CRON_SECRET>",
    `NEWSLETTER_CRON_CLAIM_LIMIT=${escapeEnvValue(env["NEWSLETTER_CRON_CLAIM_LIMIT"]?.trim() || "5")}`,
    "",
    "# Optional email sending",
    "NEWSLETTER_SMTP_HOST=<YOUR_SMTP_HOST>",
    "NEWSLETTER_SMTP_PORT=<YOUR_SMTP_PORT>",
    `NEWSLETTER_SMTP_SECURE=${escapeEnvValue(env["NEWSLETTER_SMTP_SECURE"]?.trim() || "true")}`,
    "NEWSLETTER_SMTP_USER=<YOUR_SMTP_USER>",
    "NEWSLETTER_SMTP_PASS=<YOUR_SMTP_PASS>",
    "NEWSLETTER_SMTP_FROM_EMAIL=<YOUR_FROM_EMAIL>",
    `NEWSLETTER_SMTP_FROM_NAME=${escapeEnvValue(env["NEWSLETTER_SMTP_FROM_NAME"]?.trim() || "입법예고 뉴스레터")}`,
    "",
    "# Deployment URLs",
    `# Newsletter URL: ${newsletterUrl}`,
    `# Health URL: ${healthUrl}`,
    `# Cron URL: ${cronUrl}`,
    "",
    "# Cron call example",
    `# curl -H "Authorization: Bearer <YOUR_CRON_SECRET>" "${cronUrl}"`,
    "",
    "# GitHub Actions secrets example",
    `# NEWSLETTER_CRON_URL=${cronUrl}`,
    "# NEWSLETTER_CRON_SECRET=<YOUR_CRON_SECRET>",
    "",
    "# Notes",
    "# - Use vercel-blob if you want recipients, presets, logs, and schedules to persist.",
    "# - Trigger /cron/newsletter from Vercel Cron or an external scheduler.",
  ];

  return {
    filename: "vercel-newsletter.env",
    template: lines.join("\n") + "\n",
  };
}

function escapeEnvValue(value: string): string {
  return /[\s#"'`]/.test(value) ? JSON.stringify(value) : value;
}

function normalizeOrigin(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.replace(/\/+$/, "");
}
