import { describe, expect, it } from "vitest";
import {
  filterScheduleRuns,
  filterSendLogs,
  renderScheduleRunsCsv,
  renderSendLogsCsv,
} from "../../src/newsletter/log-export.js";

describe("newsletter/log-export", () => {
  it("발송 로그를 텍스트와 상태로 필터링한다", () => {
    const logs = filterSendLogs(
      [
        {
          id: "log-1",
          jobId: "job-1",
          recipientEmail: "alpha@example.com",
          status: "sent",
          errorMessage: null,
          subject: "AI 정책 브리핑",
          keyword: "인공지능",
          itemCount: 2,
          snapshotAvailable: true,
          sentAt: "2026-04-21 09:00:00",
        },
        {
          id: "log-2",
          jobId: "job-2",
          recipientEmail: "beta@example.com",
          status: "failed",
          errorMessage: "SMTP timeout",
          subject: "보건의료 브리핑",
          keyword: "보건의료",
          itemCount: 1,
          snapshotAvailable: true,
          sentAt: "2026-04-21 10:00:00",
        },
      ],
      {
        text: "smtp",
        status: "failed",
      },
    );

    expect(logs).toHaveLength(1);
    expect(logs[0]?.id).toBe("log-2");
  });

  it("예약 실행 이력을 예약 id, 텍스트, 상태로 필터링한다", () => {
    const runs = filterScheduleRuns(
      [
        {
          id: "run-1",
          scheduleJobId: "job-1",
          scheduleSubject: "AI 정책 브리핑",
          recurrence: "daily",
          status: "sent",
          message: null,
          keyword: "인공지능",
          itemCount: 3,
          sentCount: 2,
          failedCount: 0,
          deliveryJobId: "delivery-1",
          runAt: "2026-04-21 09:00:00",
        },
        {
          id: "run-2",
          scheduleJobId: "job-1",
          scheduleSubject: "AI 정책 브리핑",
          recurrence: "daily",
          status: "skipped",
          message: "새로 발견된 법안이 없습니다.",
          keyword: "인공지능",
          itemCount: 0,
          sentCount: 0,
          failedCount: 0,
          deliveryJobId: null,
          runAt: "2026-04-22 09:00:00",
        },
        {
          id: "run-3",
          scheduleJobId: "job-2",
          scheduleSubject: "보건의료 브리핑",
          recurrence: "weekly",
          status: "failed",
          message: "SMTP timeout",
          keyword: "보건의료",
          itemCount: 0,
          sentCount: 0,
          failedCount: 0,
          deliveryJobId: null,
          runAt: "2026-04-23 09:00:00",
        },
      ],
      {
        scheduleJobId: "job-1",
        text: "법안이 없습니다",
        status: "skipped",
      },
    );

    expect(runs).toHaveLength(1);
    expect(runs[0]?.id).toBe("run-2");
  });

  it("CSV 렌더링 시 쉼표와 따옴표를 이스케이프한다", () => {
    const sendCsv = renderSendLogsCsv([
      {
        id: "log-1",
        jobId: "job-1",
        recipientEmail: "alpha@example.com",
        status: "failed",
        errorMessage: 'SMTP said "timeout", retry later',
        subject: "AI, 정책 브리핑",
        keyword: "인공지능",
        itemCount: 1,
        snapshotAvailable: true,
        sentAt: "2026-04-21 11:00:00",
      },
    ]);

    const runCsv = renderScheduleRunsCsv([
      {
        id: "run-1",
        scheduleJobId: "job-1",
        scheduleSubject: "AI 정책 브리핑",
        recurrence: "daily",
        status: "failed",
        message: "line1\nline2",
        keyword: "인공지능",
        itemCount: 0,
        sentCount: 0,
        failedCount: 1,
        deliveryJobId: null,
        runAt: "2026-04-21 11:00:00",
      },
    ]);

    expect(sendCsv).toContain('"AI, 정책 브리핑"');
    expect(sendCsv).toContain('"SMTP said ""timeout"", retry later"');
    expect(runCsv).toContain('"line1\nline2"');
  });
});
