import { type AppConfig } from "../config.js";
import {
  ScheduledNewsletterJobStore,
  ScheduledNewsletterRunStore,
} from "./persistence.js";
import { isEmptyNewsletterError, sendNewsletterFromPayload } from "./delivery.js";
import { type NewsletterSendExecution } from "./delivery.js";
import {
  type NewsletterSendPayload,
  type ScheduledNewsletterRunRecord,
} from "./types.js";

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
    private readonly runStore: Pick<ScheduledNewsletterRunStore, "append"> = new ScheduledNewsletterRunStore(),
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
          await this.appendRunLog({
            scheduleJobId: job.id,
            scheduleSubject: execution.document.subject,
            recurrence: job.recurrence,
            status: "sent",
            message: execution.result.failed > 0
              ? `일부 수신 실패 ${String(execution.result.failed)}건`
              : null,
            keyword: execution.document.keyword,
            itemCount: execution.document.items.length,
            sentCount: execution.result.sent,
            failedCount: execution.result.failed,
            deliveryJobId: execution.logs[0]?.jobId ?? null,
          });
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
            await this.appendRunLog({
              scheduleJobId: job.id,
              scheduleSubject: job.payload.subject ?? "[입법예고 뉴스레터]",
              recurrence: job.recurrence,
              status: "skipped",
              message: skipMessage,
              keyword: job.payload.query.keyword?.trim() || null,
              itemCount: 0,
              sentCount: 0,
              failedCount: 0,
              deliveryJobId: null,
            });
            process.stderr.write(
              `[assembly-api-mcp] 예약 발송 건너뜀: ${job.id} - ${skipMessage}\n`,
            );
            continue;
          }
          await this.store.markFailed(job.id, message);
          await this.appendRunLog({
            scheduleJobId: job.id,
            scheduleSubject: job.payload.subject ?? "[입법예고 뉴스레터]",
            recurrence: job.recurrence,
            status: "failed",
            message,
            keyword: job.payload.query.keyword?.trim() || null,
            itemCount: 0,
            sentCount: 0,
            failedCount: 0,
            deliveryJobId: null,
          });
          process.stderr.write(
            `[assembly-api-mcp] 예약 발송 실패: ${job.id} - ${message}\n`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async appendRunLog(
    input: Omit<ScheduledNewsletterRunRecord, "id" | "runAt"> & { readonly runAt?: string | null },
  ): Promise<void> {
    try {
      await this.runStore.append(input);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(
        `[assembly-api-mcp] 예약 실행 로그 저장 실패: ${input.scheduleJobId} - ${message}\n`,
      );
    }
  }
}

export function createNewsletterScheduleProcessor(
  config: AppConfig,
): NewsletterScheduleProcessor {
  return new NewsletterScheduleProcessor(config);
}
