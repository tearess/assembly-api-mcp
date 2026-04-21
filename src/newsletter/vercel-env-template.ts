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
    "# Deployment URLs",
    `# Newsletter URL: ${newsletterUrl}`,
    `# Health URL: ${healthUrl}`,
    "",
    "# Notes",
    "# - Use vercel-blob if you want presets, templates, and settings to persist.",
    "# - The current /newsletter UI focuses on HTML preview plus Markdown/HWPX downloads.",
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
