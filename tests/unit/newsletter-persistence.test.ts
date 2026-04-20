import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  exportNewsletterSettingsBundle,
  importNewsletterSettingsBundle,
  NewsletterSubscriptionStore,
  RecipientGroupStore,
  RecipientStore,
  SearchPresetStore,
  ScheduledNewsletterJobStore,
  ScheduledNewsletterRunStore,
  SentNewsletterStore,
  SendLogStore,
} from "../../src/newsletter/persistence.js";
import {
  type NewsletterDocument,
  type NewsletterSendPayload,
} from "../../src/newsletter/types.js";

function createDocument(): NewsletterDocument {
  return {
    subject: "[입법예고 뉴스레터] 인공지능 관련 법안 브리핑",
    keyword: "인공지능",
    dateFrom: "2026-03-20",
    dateTo: "2026-04-20",
    timeZone: "Asia/Seoul",
    generatedAt: "2026-04-20 10:30",
    items: [
      {
        billId: "BILL_001",
        billNo: "2200001",
        billName: "인공지능 산업 진흥법 일부개정법률안",
        proposer: "홍길동",
        committee: "과학기술정보방송통신위원회",
        noticeStatus: "active",
        billStage: "법사위 심사",
        stageLabel: "입법예고 진행중 / 법사위 심사",
        noticeEndDate: "2026-04-28",
        summary: "요약",
        detailUrl: "https://open.assembly.go.kr/example",
        relevanceScore: 1,
        raw: {},
      },
    ],
  };
}

function createSendPayload(): NewsletterSendPayload {
  return {
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
    recipients: ["alpha@example.com", "beta@example.com"],
  };
}

describe("newsletter/persistence", () => {
  it("수신자를 저장하고 중복 없이 다시 불러온다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new RecipientStore(dir);
      await store.upsert("Alpha@example.com");
      await store.upsert("alpha@example.com");
      await store.upsert("beta@example.com");

      const items = await store.list();
      expect(items.map((item) => item.email)).toEqual([
        "alpha@example.com",
        "beta@example.com",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("수신자를 삭제할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new RecipientStore(dir);
      await store.upsertMany(["alpha@example.com", "beta@example.com"]);
      const deleted = await store.delete("beta@example.com");

      expect(deleted).toBe(true);
      const items = await store.list();
      expect(items.map((item) => item.email)).toEqual(["alpha@example.com"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("수신자 전체 목록을 교체할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new RecipientStore(dir);
      await store.upsertMany(["alpha@example.com", "beta@example.com"]);
      await store.replaceAll(["gamma@example.com", "beta@example.com"]);

      const items = await store.list();
      expect(items.map((item) => item.email)).toEqual([
        "beta@example.com",
        "gamma@example.com",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("수신자 그룹을 저장하고 같은 이름이면 갱신한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new RecipientGroupStore(dir);
      const first = await store.upsert("정책팀 전체", [
        "alpha@example.com",
        "beta@example.com",
      ]);

      const updated = await store.upsert("정책팀 전체", [
        "beta@example.com",
        "gamma@example.com",
      ]);

      expect(updated.id).toBe(first.id);
      const items = await store.list();
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        id: first.id,
        name: "정책팀 전체",
        emails: ["beta@example.com", "gamma@example.com"],
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("수신자 그룹을 삭제할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new RecipientGroupStore(dir);
      const group = await store.upsert("언론 대응", [
        "alpha@example.com",
        "beta@example.com",
      ]);

      const deleted = await store.delete(group.id);
      expect(deleted).toBe(true);
      expect(await store.list()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("설정 백업을 내보내고 다른 저장소에 그대로 복원할 수 있다", async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), "assembly-newsletter-source-"));
    const targetDir = await mkdtemp(join(tmpdir(), "assembly-newsletter-target-"));

    try {
      const recipientStore = new RecipientStore(sourceDir);
      const groupStore = new RecipientGroupStore(sourceDir);
      const presetStore = new SearchPresetStore(sourceDir);
      const subscriptionStore = new NewsletterSubscriptionStore(sourceDir);

      await recipientStore.upsertMany(["alpha@example.com", "beta@example.com"]);
      const group = await groupStore.upsert("정책팀 전체", [
        "alpha@example.com",
        "beta@example.com",
      ]);
      const preset = await presetStore.upsert("AI 브리핑", {
        keyword: "인공지능",
        datePreset: "1m",
        dateFrom: null,
        dateTo: null,
        noticeScope: "include_closed",
        sortBy: "relevance",
        pageSize: 20,
      });
      const subscription = await subscriptionStore.upsert("AI 정책 구독", {
        query: preset.query,
        recipientGroupId: group.id,
        recipientGroupName: group.name,
        searchPresetId: preset.id,
        searchPresetName: preset.name,
        recipients: group.emails,
        subject: "[입법예고 뉴스레터] AI 정책 브리핑",
        introText: "브리핑 메모",
        outroText: "마무리 문구",
        recurrence: "weekly",
        onlyNewResults: true,
      });

      const bundle = await exportNewsletterSettingsBundle(sourceDir);
      expect(bundle.version).toBe(1);
      expect(bundle.recipients).toHaveLength(2);
      expect(bundle.recipientGroups).toHaveLength(1);
      expect(bundle.searchPresets).toHaveLength(1);
      expect(bundle.subscriptionTemplates).toHaveLength(1);

      await new RecipientStore(targetDir).upsert("legacy@example.com");
      await importNewsletterSettingsBundle(bundle, targetDir);

      const targetRecipients = await new RecipientStore(targetDir).list();
      const targetGroups = await new RecipientGroupStore(targetDir).list();
      const targetPresets = await new SearchPresetStore(targetDir).list();
      const targetSubscriptions = await new NewsletterSubscriptionStore(targetDir).list();

      expect(targetRecipients.map((item) => item.email)).toEqual([
        "alpha@example.com",
        "beta@example.com",
      ]);
      expect(targetGroups[0]).toMatchObject({
        id: group.id,
        name: "정책팀 전체",
        emails: ["alpha@example.com", "beta@example.com"],
      });
      expect(targetPresets[0]).toMatchObject({
        id: preset.id,
        name: "AI 브리핑",
      });
      expect(targetSubscriptions[0]).toMatchObject({
        id: subscription.id,
        name: "AI 정책 구독",
        recipientGroupId: group.id,
        searchPresetId: preset.id,
        recurrence: "weekly",
        onlyNewResults: true,
      });
    } finally {
      await rm(sourceDir, { recursive: true, force: true });
      await rm(targetDir, { recursive: true, force: true });
    }
  });

  it("발송 로그를 저장하고 최신순으로 조회한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new SendLogStore(dir);
      const logs = await store.appendLogs(
        createDocument(),
        ["alpha@example.com", "beta@example.com"],
        new Map([["beta@example.com", "SMTP timeout"]]),
        {
          jobId: "job-1",
          snapshotAvailable: true,
        },
      );

      expect(logs).toHaveLength(2);

      const saved = await store.list();
      expect(saved).toHaveLength(2);
      expect(saved.map((item) => item.recipientEmail).sort()).toEqual([
        "alpha@example.com",
        "beta@example.com",
      ]);
      const failed = saved.find((item) => item.recipientEmail === "beta@example.com");
      expect(failed?.status).toBe("failed");
      expect(failed?.errorMessage).toBe("SMTP timeout");
      expect(saved.every((item) => item.jobId === "job-1")).toBe(true);
      expect(saved.every((item) => item.snapshotAvailable === true)).toBe(true);
      const fetched = await store.get(saved[0]!.id);
      expect(fetched?.id).toBe(saved[0]!.id);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("예약 실행 로그를 저장하고 예약별로 다시 조회할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterRunStore(dir);
      await store.append({
        scheduleJobId: "job-1",
        scheduleSubject: "AI 정책 브리핑",
        recurrence: "daily",
        status: "sent",
        message: null,
        keyword: "인공지능",
        itemCount: 3,
        sentCount: 2,
        failedCount: 1,
        deliveryJobId: "delivery-1",
        runAt: "2026-04-20 10:30:00",
      });
      await store.append({
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
        runAt: "2026-04-21 09:00:00",
      });

      const all = await store.list();
      expect(all).toHaveLength(2);
      expect(all[0]).toMatchObject({
        scheduleJobId: "job-2",
        status: "failed",
      });

      const filtered = await store.list(10, "job-1");
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toMatchObject({
        scheduleJobId: "job-1",
        status: "sent",
        deliveryJobId: "delivery-1",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("발송 HTML/Markdown 스냅샷을 저장하고 다시 불러온다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new SentNewsletterStore(dir);
      const snapshot = await store.save(
        "job-snapshot-1",
        createDocument(),
        "<html><body>preview</body></html>",
        "# preview",
      );

      expect(snapshot.jobId).toBe("job-snapshot-1");
      const loaded = await store.get("job-snapshot-1");
      expect(loaded).toMatchObject({
        jobId: "job-snapshot-1",
        html: "<html><body>preview</body></html>",
        markdown: "# preview",
      });
      expect(loaded?.document.subject).toBe(createDocument().subject);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("검색 preset을 저장하고 같은 이름이면 갱신한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new SearchPresetStore(dir);
      const first = await store.upsert("AI 최근 1개월", {
        keyword: "인공지능",
        datePreset: "1m",
        dateFrom: "2026-03-20",
        dateTo: "2026-04-20",
        noticeScope: "include_closed",
        sortBy: "relevance",
        pageSize: 20,
      });

      const updated = await store.upsert("ai 최근 1개월", {
        keyword: "AI",
        datePreset: "custom",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-20",
        noticeScope: "active_only",
        sortBy: "notice_end_desc",
        pageSize: 50,
      });

      expect(updated.id).toBe(first.id);
      const items = await store.list();
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        name: "ai 최근 1개월",
        query: {
          keyword: "AI",
          datePreset: "custom",
          dateFrom: "2026-04-01",
          dateTo: "2026-04-20",
          noticeScope: "active_only",
          sortBy: "notice_end_desc",
          pageSize: 50,
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("검색 preset을 삭제할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new SearchPresetStore(dir);
      const preset = await store.upsert("보건의료 3개월", {
        keyword: "보건의료",
        datePreset: "3m",
        dateFrom: null,
        dateTo: null,
        noticeScope: "include_closed",
        sortBy: "notice_end_asc",
        pageSize: 10,
      });

      const deleted = await store.delete(preset.id);
      expect(deleted).toBe(true);
      expect(await store.list()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("구독 템플릿을 저장하고 같은 이름이면 갱신한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new NewsletterSubscriptionStore(dir);
      const first = await store.upsert("AI 정책 브리핑", {
        query: {
          keyword: "인공지능",
          datePreset: "1m",
          dateFrom: null,
          dateTo: null,
          noticeScope: "include_closed",
          sortBy: "relevance",
          pageSize: 20,
        },
        recipientGroupId: "group-1",
        recipientGroupName: "정책팀 전체",
        searchPresetId: null,
        searchPresetName: null,
        recipients: ["alpha@example.com", "beta@example.com"],
        subject: "[입법예고 뉴스레터] AI 정책 브리핑",
        introText: "브리핑 메모",
        outroText: "마무리 문구",
        recurrence: "weekly",
        onlyNewResults: true,
      });

      const updated = await store.upsert("ai 정책 브리핑", {
        query: {
          keyword: "AI",
          datePreset: "custom",
          dateFrom: "2026-04-01",
          dateTo: "2026-04-20",
          noticeScope: "active_only",
          sortBy: "notice_end_desc",
          pageSize: 50,
        },
        recipientGroupId: null,
        recipientGroupName: null,
        searchPresetId: "preset-1",
        searchPresetName: "AI 최근 1개월",
        recipients: ["gamma@example.com"],
        subject: null,
        introText: null,
        outroText: null,
        recurrence: "daily",
        onlyNewResults: false,
      });

      expect(updated.id).toBe(first.id);
      const items = await store.list();
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        id: first.id,
        name: "ai 정책 브리핑",
        query: {
          keyword: "AI",
          datePreset: "custom",
          dateFrom: "2026-04-01",
          dateTo: "2026-04-20",
          noticeScope: "active_only",
          sortBy: "notice_end_desc",
          pageSize: 50,
        },
        recipientGroupId: null,
        recipientGroupName: null,
        searchPresetId: "preset-1",
        searchPresetName: "AI 최근 1개월",
        recipients: ["gamma@example.com"],
        recurrence: "daily",
        onlyNewResults: false,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("구독 템플릿을 삭제할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new NewsletterSubscriptionStore(dir);
      const subscription = await store.upsert("보건의료 모니터링", {
        query: {
          keyword: "보건의료",
          datePreset: "3m",
          dateFrom: null,
          dateTo: null,
          noticeScope: "include_closed",
          sortBy: "relevance",
          pageSize: 20,
        },
        recipientGroupId: null,
        recipientGroupName: null,
        searchPresetId: null,
        searchPresetName: null,
        recipients: ["alpha@example.com"],
        subject: null,
        introText: null,
        outroText: null,
        recurrence: "once",
        onlyNewResults: false,
      });

      const deleted = await store.delete(subscription.id);
      expect(deleted).toBe(true);
      expect(await store.list()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("예약 발송 작업을 저장하고 due job을 처리 상태로 가져온다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00");

      const claimed = await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      expect(claimed).toHaveLength(1);
      expect(claimed[0]).toMatchObject({
        id: job.id,
        status: "processing",
      });

      await store.markSent(job.id);
      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        recurrence: "once",
        status: "sent",
        lastRunStatus: "sent",
      });
      expect(saved[0]?.processedAt).toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("반복 예약 발송은 성공 후 다음 시각으로 이동한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00", "daily");

      const claimed = await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      expect(claimed).toHaveLength(1);
      expect(claimed[0]).toMatchObject({
        id: job.id,
        recurrence: "daily",
        status: "processing",
      });

      await store.markSent(job.id, new Date("2099-01-01T00:01:00Z"));
      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        recurrence: "daily",
        status: "pending",
        lastRunStatus: "sent",
      });
      expect(saved[0]?.scheduledAt).toBe("2099-01-02T00:00:00.000Z");
      expect(saved[0]?.deliveredBillIds).toEqual([]);
      expect(saved[0]?.processedAt).toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("반복 예약 발송은 전달한 bill id를 누적 저장한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(
        {
          ...createSendPayload(),
          onlyNewResults: true,
        },
        "2099-01-01T09:00",
        "daily",
      );

      await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      await store.markSent(
        job.id,
        new Date("2099-01-01T00:01:00Z"),
        ["BILL_001", "BILL_002", "BILL_001"],
      );

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        status: "pending",
        lastRunStatus: "sent",
      });
      expect(saved[0]?.deliveredBillIds).toEqual(["BILL_001", "BILL_002"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("반복 예약 발송은 결과가 없으면 건너뛰고 다음 시각으로 이동한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00", "weekly");

      await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      await store.markSkipped(job.id, "조건에 맞는 법안이 없어 이번 회차를 건너뛰었습니다.", new Date("2099-01-01T00:01:00Z"));

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        recurrence: "weekly",
        status: "pending",
        lastRunStatus: "skipped",
        lastRunMessage: "조건에 맞는 법안이 없어 이번 회차를 건너뛰었습니다.",
      });
      expect(saved[0]?.scheduledAt).toBe("2099-01-08T00:00:00.000Z");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("대기 중인 예약은 일시정지하면 claim 대상에서 제외된다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00", "daily");

      const paused = await store.pause(job.id);
      expect(paused).toBe(true);

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        status: "paused",
      });

      const claimed = await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      expect(claimed).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("일시정지한 예약은 재개하면 다시 claim할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00", "daily");

      await store.pause(job.id);
      const resumed = await store.resume(job.id);
      expect(resumed).toBe(true);

      const claimed = await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      expect(claimed).toHaveLength(1);
      expect(claimed[0]).toMatchObject({
        id: job.id,
        status: "processing",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("실패한 예약은 다시 대기 상태로 되돌릴 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00", "daily");

      await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      await store.markFailed(job.id, "SMTP 인증 실패");

      const resumed = await store.resume(job.id);
      expect(resumed).toBe(true);

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        status: "pending",
        lastRunStatus: "failed",
        lastRunMessage: "SMTP 인증 실패",
        errorMessage: null,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("단일 예약 발송은 결과가 없으면 건너뜀 상태로 마감한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-01T09:00");

      await store.claimDueJobs(new Date("2099-01-01T00:01:00Z"));
      await store.markSkipped(job.id, "조건에 맞는 법안이 없어 이번 회차를 건너뛰었습니다.", new Date("2099-01-01T00:01:00Z"));

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        recurrence: "once",
        status: "skipped",
        lastRunStatus: "skipped",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("예약 발송 작업을 취소할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-02T09:00");

      const cancelled = await store.cancel(job.id);
      expect(cancelled).toBe(true);

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        status: "cancelled",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("일시정지한 예약도 취소할 수 있다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const store = new ScheduledNewsletterJobStore(dir);
      const job = await store.create(createSendPayload(), "2099-01-02T09:00", "daily");

      await store.pause(job.id);
      const cancelled = await store.cancel(job.id);
      expect(cancelled).toBe(true);

      const saved = await store.list();
      expect(saved[0]).toMatchObject({
        id: job.id,
        status: "cancelled",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
