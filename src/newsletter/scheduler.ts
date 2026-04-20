import { type AppConfig } from "../config.js";
import { ScheduledNewsletterJobStore } from "./persistence.js";
import { isEmptyNewsletterError, sendNewsletterFromPayload } from "./delivery.js";
import { type NewsletterSendExecution } from "./delivery.js";
import { type NewsletterSendPayload } from "./types.js";

const DEFAULT_POLL_INTERVAL_MS = 30 * 1000;

export class NewsletterScheduleProcessor {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly config: AppConfig,
    private readonly store: ScheduledNewsletterJobStore = new ScheduledNewsletterJobStore(),
    private readonly pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
    private readonly sender: (
      payload: NewsletterSendPayload,
      config: AppConfig,
    ) => Promise<NewsletterSendExecution> = sendNewsletterFromPayload,
  ) {}

  async start(): Promise<void> {
    const requeued = await this.store.requeueProcessingJobs();
    if (requeued > 0) {
      process.stderr.write(
        `[assembly-api-mcp] 예약 발송 작업 ${String(requeued)}건을 다시 대기 상태로 되돌렸습니다.\n`,
      );
    }

    await this.tick();

    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);
    this.timer.unref();
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    while (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const dueJobs = await this.store.claimDueJobs(new Date(), 5);
      for (const job of dueJobs) {
        try {
          const payload = job.payload.onlyNewResults
            ? {
                ...job.payload,
                excludeBillIds: job.deliveredBillIds,
              }
            : job.payload;
          const execution = await this.sender(payload, this.config);
          await this.store.markSent(
            job.id,
            new Date(),
            execution.document.items.map((item) => item.billId),
          );
          process.stderr.write(
            `[assembly-api-mcp] 예약 발송 완료: ${job.id}\n`,
          );
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (isEmptyNewsletterError(error)) {
            const skipMessage = job.payload.onlyNewResults
              ? "새로 발견된 법안이 없어 이번 회차를 건너뛰었습니다."
              : "조건에 맞는 법안이 없어 이번 회차를 건너뛰었습니다.";
            await this.store.markSkipped(job.id, skipMessage, new Date());
            process.stderr.write(
              `[assembly-api-mcp] 예약 발송 건너뜀: ${job.id} - ${skipMessage}\n`,
            );
            continue;
          }
          await this.store.markFailed(job.id, message);
          process.stderr.write(
            `[assembly-api-mcp] 예약 발송 실패: ${job.id} - ${message}\n`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}

export function createNewsletterScheduleProcessor(
  config: AppConfig,
): NewsletterScheduleProcessor {
  return new NewsletterScheduleProcessor(config);
}
