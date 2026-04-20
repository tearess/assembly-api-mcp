export interface NewsletterGithubActionsTemplate {
  readonly filename: string;
  readonly template: string;
}

export function buildGithubActionsCronTemplate(
  origin?: string | null,
): NewsletterGithubActionsTemplate {
  const normalizedOrigin = normalizeOrigin(origin);
  const cronUrl = normalizedOrigin
    ? `${normalizedOrigin}/cron/newsletter`
    : "https://<YOUR-DEPLOYMENT>.vercel.app/cron/newsletter";

  const lines = [
    "name: Trigger Newsletter Cron",
    "",
    "on:",
    "  workflow_dispatch:",
    "  schedule:",
    "    # 예시: 15분마다 실행",
    "    - cron: \"*/15 * * * *\"",
    "",
    "jobs:",
    "  trigger:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Call deployed newsletter cron endpoint",
    "        env:",
    `          NEWSLETTER_CRON_URL: ${cronUrl}`,
    "          NEWSLETTER_CRON_SECRET: ${{ secrets.NEWSLETTER_CRON_SECRET }}",
    "        run: |",
    "          test -n \"$NEWSLETTER_CRON_URL\"",
    "          curl --fail --show-error --silent \\",
    "            -H \"Authorization: Bearer $NEWSLETTER_CRON_SECRET\" \\",
    "            \"$NEWSLETTER_CRON_URL\"",
    "",
    "# GitHub Actions secret example",
    "# NEWSLETTER_CRON_SECRET=<YOUR_CRON_SECRET>",
  ];

  return {
    filename: "github-actions-newsletter-cron.yml",
    template: lines.join("\n") + "\n",
  };
}

function normalizeOrigin(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.replace(/\/+$/, "");
}
