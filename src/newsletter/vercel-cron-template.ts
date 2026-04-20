export interface NewsletterVercelCronTemplate {
  readonly filename: string;
  readonly template: string;
}

export function buildVercelCronTemplate(): NewsletterVercelCronTemplate {
  const lines = [
    "# Vercel cron snippet guide",
    "# Add one of the snippets below to vercel.json",
    "# Path is fixed to /cron/newsletter",
    "",
    "# Pro / Team / Enterprise example: every 15 minutes",
    "\"crons\": [",
    "  {",
    "    \"path\": \"/cron/newsletter\",",
    "    \"schedule\": \"*/15 * * * *\"",
    "  }",
    "]",
    "",
    "# Pro / Team / Enterprise example: every 1 minute",
    "\"crons\": [",
    "  {",
    "    \"path\": \"/cron/newsletter\",",
    "    \"schedule\": \"* * * * *\"",
    "  }",
    "]",
    "",
    "# Hobby example: once per day only",
    "# Example below runs once a day at 00:00 UTC",
    "\"crons\": [",
    "  {",
    "    \"path\": \"/cron/newsletter\",",
    "    \"schedule\": \"0 0 * * *\"",
    "  }",
    "]",
    "",
    "# Recommended",
    "# - Set CRON_SECRET in Vercel environment variables",
    "# - Keep /cron/newsletter protected with Authorization: Bearer <CRON_SECRET>",
    "# - If you need intervals on Hobby, use the GitHub Actions cron template instead",
  ];

  return {
    filename: "vercel-cron-snippets.txt",
    template: lines.join("\n") + "\n",
  };
}
