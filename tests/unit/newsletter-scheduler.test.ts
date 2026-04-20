import { describe, expect, it, vi } from "vitest";
import { EMPTY_NEWSLETTER_ERROR_MESSAGE } from "../../src/newsletter/delivery.js";
import { NewsletterScheduleProcessor } from "../../src/newsletter/scheduler.js";
import { type ScheduledNewsletterJobRecord } from "../../src/newsletter/types.js";

function createJob(): ScheduledNewsletterJobRecord {
  return {
    id: "job-1",
    scheduledAt: "2099-01-01T00:00:00.000Z",
    recurrence: "daily",
    status: "processing",
    payload: {
      query: {
        keyword: "인공지능",
        datePreset: "1m",
        noticeScope: "include_closed",
        sortBy: "relevance",
        page: 1,
        pageSize: 20,
      },
      items: [],
      selectedBillIds: [],
      subject: "[입법예고 뉴스레터] 인공지능 관련 법안 브리핑",
      includeAllResults: true,
      onlyNewResults: true,
      excludeBillIds: [],
      recipients: ["alpha@example.com"],
      searchPresetId: null,
      searchPresetName: null,
    },
    deliveredBillIds: ["BILL_OLD_001"],
    createdAt: "2099-01-01 09:00:00",
    updatedAt: "2099-01-01 09:00:00",
    processedAt: null,
    lastRunStatus: null,
    lastRunMessage: null,
    errorMessage: null,
  };
}

describe("newsletter/scheduler", () => {
  it("검색 결과가 없으면 예약 작업을 실패시키지 않고 건너뛴다", async () => {
    const claimDueJobs = vi.fn(async () => [createJob()]);
    const markSent = vi.fn(async () => true);
    const markSkipped = vi.fn(async () => true);
    const markFailed = vi.fn(async () => true);

    const processor = new NewsletterScheduleProcessor(
      {} as never,
      {
        requeueProcessingJobs: async () => 0,
        claimDueJobs,
        markSent,
        markSkipped,
        markFailed,
      } as never,
      30_000,
      async () => {
        throw new Error(EMPTY_NEWSLETTER_ERROR_MESSAGE);
      },
    );

    await (processor as any).tick();

    expect(claimDueJobs).toHaveBeenCalledTimes(1);
    expect(markSkipped).toHaveBeenCalledTimes(1);
    expect(markSkipped).toHaveBeenCalledWith(
      "job-1",
      "새로 발견된 법안이 없어 이번 회차를 건너뛰었습니다.",
      expect.any(Date),
    );
    expect(markSent).not.toHaveBeenCalled();
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("일반 오류는 실패 상태로 남긴다", async () => {
    const markSkipped = vi.fn(async () => true);
    const markFailed = vi.fn(async () => true);

    const processor = new NewsletterScheduleProcessor(
      {} as never,
      {
        requeueProcessingJobs: async () => 0,
        claimDueJobs: async () => [createJob()],
        markSent: async () => true,
        markSkipped,
        markFailed,
      } as never,
      30_000,
      async () => {
        throw new Error("SMTP timeout");
      },
    );

    await (processor as any).tick();

    expect(markSkipped).not.toHaveBeenCalled();
    expect(markFailed).toHaveBeenCalledTimes(1);
    expect(markFailed).toHaveBeenCalledWith("job-1", "SMTP timeout");
  });

  it("새 법안만 발송 설정이면 기존 delivered bill id를 제외하고 새 결과를 저장한다", async () => {
    const markSent = vi.fn(async () => true);

    const processor = new NewsletterScheduleProcessor(
      {} as never,
      {
        requeueProcessingJobs: async () => 0,
        claimDueJobs: async () => [createJob()],
        markSent,
        markSkipped: async () => true,
        markFailed: async () => true,
      } as never,
      30_000,
      async (payload) => {
        expect(payload.excludeBillIds).toEqual(["BILL_OLD_001"]);
        return {
          document: {
            subject: "subject",
            keyword: "인공지능",
            dateFrom: "2099-01-01",
            dateTo: "2099-01-01",
            timeZone: "Asia/Seoul",
            generatedAt: "2099-01-01 09:00",
            items: [
              {
                billId: "BILL_NEW_001",
                billNo: "2200001",
                billName: "새 법안",
                proposer: "홍길동",
                committee: "과학기술정보방송통신위원회",
                noticeStatus: "active",
                billStage: null,
                stageLabel: "입법예고 진행중",
                noticeEndDate: "2099-01-10",
                summary: "요약",
                detailUrl: null,
                relevanceScore: 1,
                raw: {},
              },
            ],
          },
          html: "<html></html>",
          markdown: "# test",
          result: {
            sent: 1,
            failed: 0,
            failures: [],
          },
          logs: [],
        };
      },
    );

    await (processor as any).tick();

    expect(markSent).toHaveBeenCalledTimes(1);
    expect(markSent).toHaveBeenCalledWith(
      "job-1",
      expect.any(Date),
      ["BILL_NEW_001"],
    );
  });
});
