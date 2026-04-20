import nodemailer from "nodemailer";
import { type NewsletterDocument } from "./types.js";
import { buildHtmlFilename } from "./render-html.js";
import { buildMarkdownFilename } from "./render-markdown.js";

export interface SmtpSettings {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly pass: string;
  readonly fromEmail: string;
  readonly fromName: string;
}

export interface EmailSendResult {
  readonly sent: number;
  readonly failed: number;
  readonly failures: readonly { recipient: string; error: string }[];
}

export interface EmailAttachment {
  readonly filename: string;
  readonly content: string;
  readonly contentType: string;
}

export function loadSmtpSettings(
  env: NodeJS.ProcessEnv = process.env,
): SmtpSettings | null {
  const host = env["NEWSLETTER_SMTP_HOST"]?.trim();
  const portRaw = env["NEWSLETTER_SMTP_PORT"]?.trim();
  const user = env["NEWSLETTER_SMTP_USER"]?.trim();
  const pass = env["NEWSLETTER_SMTP_PASS"]?.trim();
  const fromEmail = env["NEWSLETTER_SMTP_FROM_EMAIL"]?.trim();

  if (!host || !portRaw || !user || !pass || !fromEmail) {
    return null;
  }

  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port)) {
    throw new Error("NEWSLETTER_SMTP_PORT 값이 올바르지 않습니다.");
  }

  const secureRaw = env["NEWSLETTER_SMTP_SECURE"]?.trim();

  return {
    host,
    port,
    secure: secureRaw === "true" || secureRaw === "1" || port === 465,
    user,
    pass,
    fromEmail,
    fromName: env["NEWSLETTER_SMTP_FROM_NAME"]?.trim() || "입법예고 뉴스레터",
  };
}

export class SmtpNewsletterEmailSender {
  constructor(private readonly settings: SmtpSettings) {}

  async send(
    recipients: readonly string[],
    document: NewsletterDocument,
    html: string,
    markdown: string,
    attachments: readonly EmailAttachment[] = buildNewsletterEmailAttachments(
      document,
      html,
      markdown,
    ),
  ): Promise<EmailSendResult> {
    const transport = nodemailer.createTransport({
      host: this.settings.host,
      port: this.settings.port,
      secure: this.settings.secure,
      auth: {
        user: this.settings.user,
        pass: this.settings.pass,
      },
    });

    const failures: Array<{ recipient: string; error: string }> = [];

    await Promise.all(recipients.map(async (recipient) => {
      try {
        await transport.sendMail({
          from: `"${this.settings.fromName}" <${this.settings.fromEmail}>`,
          to: recipient,
          subject: document.subject,
          html,
          text: markdown,
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
          })),
        });
      } catch (error: unknown) {
        failures.push({
          recipient,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }));

    return {
      sent: recipients.length - failures.length,
      failed: failures.length,
      failures,
    };
  }
}

export function normalizeRecipients(input: unknown): string[] {
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[,\n;]/)
      : [];

  const unique = new Set<string>();

  for (const value of rawValues) {
    if (typeof value !== "string") continue;
    const email = value.trim().toLowerCase();
    if (!email) continue;
    if (!isValidEmail(email)) {
      throw new Error(`이메일 형식이 올바르지 않습니다: ${value}`);
    }
    unique.add(email);
  }

  if (unique.size === 0) {
    throw new Error("받는 사람 이메일을 1개 이상 입력해야 합니다.");
  }

  return Array.from(unique);
}

export function buildNewsletterEmailAttachments(
  document: NewsletterDocument,
  html: string,
  markdown: string,
): readonly EmailAttachment[] {
  return [
    {
      filename: buildHtmlFilename(document),
      content: html,
      contentType: "text/html; charset=utf-8",
    },
    {
      filename: buildMarkdownFilename(document),
      content: markdown,
      contentType: "text/markdown; charset=utf-8",
    },
  ];
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
