import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  buildNewsletterDocumentFromPayload,
  EMPTY_NEWSLETTER_ERROR_MESSAGE,
  resendNewsletterFromSnapshot,
  resolveNewsletterContentPayload,
  resolveNewsletterSendPayload,
  sendPreparedNewsletter,
} from "../../src/newsletter/delivery.js";
import { RecipientGroupStore, SearchPresetStore } from "../../src/newsletter/persistence.js";
import {
  type NewsletterContentPayload,
  type NewsletterDocument,
  type SentNewsletterSnapshotRecord,
} from "../../src/newsletter/types.js";

function createPayload(): NewsletterContentPayload {
  return {
    query: {
      keyword: "기존 키워드",
      datePreset: "1w",
      dateFrom: "2026-04-14",
      dateTo: "2026-04-21",
      noticeScope: "active_only",
      sortBy: "notice_end_asc",
      page: 3,
      pageSize: 20,
    },
    items: [],
    selectedBillIds: [],
    subject: null,
    includeAllResults: true,
    onlyNewResults: false,
    excludeBillIds: [],
    searchPresetId: null,
    searchPresetName: null,
  };
}

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

describe("newsletter/delivery", () => {
  it("preset id가 있으면 최신 저장 preset 기준으로 검색 조건을 다시 맞춘다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const presetStore = new SearchPresetStore(dir);
      const preset = await presetStore.upsert("AI 최근 1개월", {
        keyword: "인공지능",
        datePreset: "custom",
        dateFrom: "2026-03-21",
        dateTo: "2026-04-21",
        noticeScope: "include_closed",
        sortBy: "notice_end_desc",
        pageSize: 50,
      });

      const resolved = await resolveNewsletterContentPayload(
        {
          ...createPayload(),
          searchPresetId: preset.id,
          searchPresetName: "예전 이름",
        },
        presetStore,
      );

      expect(resolved.searchPresetId).toBe(preset.id);
      expect(resolved.searchPresetName).toBe("AI 최근 1개월");
      expect(resolved.query).toMatchObject({
        keyword: "인공지능",
        datePreset: "custom",
        dateFrom: "2026-03-21",
        dateTo: "2026-04-21",
        noticeScope: "include_closed",
        sortBy: "notice_end_desc",
        page: 3,
        pageSize: 20,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preset이 삭제되었으면 저장된 검색 스냅샷을 그대로 사용한다", async () => {
    const payload = createPayload();

    const resolved = await resolveNewsletterContentPayload(
      {
        ...payload,
        searchPresetId: "missing-preset-id",
        searchPresetName: "삭제된 preset",
      },
      { get: async () => null },
    );

    expect(resolved).toEqual({
      ...payload,
      searchPresetId: "missing-preset-id",
      searchPresetName: "삭제된 preset",
    });
  });

  it("recipient group id가 있으면 최신 저장 그룹 기준으로 수신자를 다시 맞춘다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assembly-newsletter-"));

    try {
      const groupStore = new RecipientGroupStore(dir);
      const group = await groupStore.upsert("정책팀 전체", [
        "alpha@example.com",
        "beta@example.com",
      ]);

      const resolved = await resolveNewsletterSendPayload(
        {
          ...createPayload(),
          recipientGroupId: group.id,
          recipientGroupName: "예전 그룹 이름",
          recipients: ["old@example.com"],
        },
        { get: async () => null },
        groupStore,
      );

      expect(resolved.recipientGroupId).toBe(group.id);
      expect(resolved.recipientGroupName).toBe("정책팀 전체");
      expect(resolved.recipients).toEqual([
        "alpha@example.com",
        "beta@example.com",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("exclude bill id가 있으면 문서 생성 전에 해당 법안을 제외한다", async () => {
    const payload: NewsletterContentPayload = {
      query: {},
      items: [
        {
          billId: "BILL_001",
          billNo: "2200001",
          billName: "첫 번째 법안",
          proposer: "홍길동",
          committee: "과학기술정보방송통신위원회",
          noticeStatus: "active",
          billStage: null,
          stageLabel: "입법예고 진행중",
          noticeEndDate: "2026-04-21",
          summary: "요약",
          detailUrl: null,
          relevanceScore: 1,
          raw: {},
        },
        {
          billId: "BILL_002",
          billNo: "2200002",
          billName: "두 번째 법안",
          proposer: "김철수",
          committee: "정무위원회",
          noticeStatus: "active",
          billStage: null,
          stageLabel: "입법예고 진행중",
          noticeEndDate: "2026-04-22",
          summary: "요약",
          detailUrl: null,
          relevanceScore: 1,
          raw: {},
        },
      ],
      selectedBillIds: [],
      subject: null,
      includeAllResults: false,
      onlyNewResults: true,
      excludeBillIds: ["BILL_001"],
      searchPresetId: null,
      searchPresetName: null,
    };

    const document = await buildNewsletterDocumentFromPayload(payload, {} as never);
    expect(document.items.map((item) => item.billId)).toEqual(["BILL_002"]);
  });

  it("exclude bill id로 인해 남는 법안이 없으면 빈 뉴스레터 오류를 던진다", async () => {
    const payload: NewsletterContentPayload = {
      query: {},
      items: [
        {
          billId: "BILL_001",
          billNo: "2200001",
          billName: "첫 번째 법안",
          proposer: "홍길동",
          committee: "과학기술정보방송통신위원회",
          noticeStatus: "active",
          billStage: null,
          stageLabel: "입법예고 진행중",
          noticeEndDate: "2026-04-21",
          summary: "요약",
          detailUrl: null,
          relevanceScore: 1,
          raw: {},
        },
      ],
      selectedBillIds: [],
      subject: null,
      includeAllResults: false,
      onlyNewResults: true,
      excludeBillIds: ["BILL_001"],
      searchPresetId: null,
      searchPresetName: null,
    };

    await expect(buildNewsletterDocumentFromPayload(payload, {} as never))
      .rejects
      .toThrow(EMPTY_NEWSLETTER_ERROR_MESSAGE);
  });

  it("payload의 브리핑 메모와 마무리 문구를 문서에 반영한다", async () => {
    const document = await buildNewsletterDocumentFromPayload(
      {
        query: {},
        items: [
          {
            billId: "BILL_001",
            billNo: "2200001",
            billName: "첫 번째 법안",
            proposer: "홍길동",
            committee: "과학기술정보방송통신위원회",
            noticeStatus: "active",
            billStage: null,
            stageLabel: "입법예고 진행중",
            noticeEndDate: "2026-04-21",
            summary: "요약",
            detailUrl: null,
            relevanceScore: 1,
            raw: {},
          },
        ],
        selectedBillIds: [],
        subject: "[입법예고 뉴스레터] 테스트",
        introText: "이번 회차는 핵심 쟁점을 먼저 정리했습니다.",
        outroText: "세부 검토가 필요하면 회신해 주세요.",
        includeAllResults: false,
        onlyNewResults: false,
        excludeBillIds: [],
        searchPresetId: null,
        searchPresetName: null,
      },
      {} as never,
    );

    expect(document.introText).toBe("이번 회차는 핵심 쟁점을 먼저 정리했습니다.");
    expect(document.outroText).toBe("세부 검토가 필요하면 회신해 주세요.");
  });

  it("준비된 뉴스레터를 발송하면 스냅샷과 로그를 함께 남긴다", async () => {
    const upsertManyCalls: string[][] = [];
    const saveCalls: string[] = [];
    const appendLogsCalls: string[] = [];
    let capturedAttachments:
      | readonly {
        filename: string;
        content: string;
        contentType: string;
      }[]
      | undefined;

    const execution = await sendPreparedNewsletter(
      createDocument(),
      "<html><body>preview</body></html>",
      "# preview",
      ["alpha@example.com", "beta@example.com"],
      {
        jobId: "job-send-1",
        sender: {
          send: async (_recipients, _document, _html, _markdown, attachments) => {
            capturedAttachments = attachments;
            return {
              sent: 2,
              failed: 0,
              failures: [],
            };
          },
        },
        recipientStore: {
          upsertMany: async (recipients) => {
            upsertManyCalls.push([...recipients]);
            return [];
          },
        },
        snapshotStore: {
          save: async (jobId) => {
            saveCalls.push(jobId);
            return {
              jobId,
              document: createDocument(),
              html: "<html><body>preview</body></html>",
              markdown: "# preview",
              createdAt: "2026-04-20 10:30",
            };
          },
        },
        logStore: {
          appendLogs: async (_document, recipients, _failures, options) => {
            appendLogsCalls.push(options?.jobId || "");
            return recipients.map((recipient, index) => ({
              id: `log-${index + 1}`,
              jobId: options?.jobId || "unknown",
              recipientEmail: recipient,
              status: "sent" as const,
              errorMessage: null,
              subject: createDocument().subject,
              keyword: createDocument().keyword,
              itemCount: createDocument().items.length,
              snapshotAvailable: options?.snapshotAvailable === true,
              sentAt: "2026-04-20 10:30",
            }));
          },
        },
      },
    );

    expect(execution.result).toMatchObject({
      sent: 2,
      failed: 0,
    });
    expect(upsertManyCalls).toEqual([["alpha@example.com", "beta@example.com"]]);
    expect(saveCalls).toEqual(["job-send-1"]);
    expect(appendLogsCalls).toEqual(["job-send-1"]);
    expect(execution.logs.every((log) => log.snapshotAvailable)).toBe(true);
    expect(capturedAttachments).toEqual([
      {
        filename: "legislation-newsletter_인공지능_2026-03-20_2026-04-20.html",
        content: "<html><body>preview</body></html>",
        contentType: "text/html; charset=utf-8",
      },
      {
        filename: "legislation-newsletter_인공지능_2026-03-20_2026-04-20.md",
        content: "# preview",
        contentType: "text/markdown; charset=utf-8",
      },
    ]);
  });

  it("저장된 발송 스냅샷은 현재 수신자에게 다시 보낼 수 있다", async () => {
    const snapshot: SentNewsletterSnapshotRecord = {
      jobId: "old-job-1",
      document: createDocument(),
      html: "<html><body>preview</body></html>",
      markdown: "# preview",
      createdAt: "2026-04-20 10:30",
    };

    const execution = await resendNewsletterFromSnapshot(
      snapshot,
      ["alpha@example.com"],
      {
        jobId: "new-job-1",
        sender: {
          send: async (recipients) => ({
            sent: recipients.length,
            failed: 0,
            failures: [],
          }),
        },
        recipientStore: {
          upsertMany: async () => [],
        },
        snapshotStore: {
          save: async (jobId, document, html, markdown) => ({
            jobId,
            document,
            html,
            markdown,
            createdAt: "2026-04-21 09:00",
          }),
        },
        logStore: {
          appendLogs: async (document, recipients, _failures, options) =>
            recipients.map((recipient, index) => ({
              id: `log-${index + 1}`,
              jobId: options?.jobId || "unknown",
              recipientEmail: recipient,
              status: "sent" as const,
              errorMessage: null,
              subject: document.subject,
              keyword: document.keyword,
              itemCount: document.items.length,
              snapshotAvailable: options?.snapshotAvailable === true,
              sentAt: "2026-04-21 09:00",
            })),
        },
      },
    );

    expect(execution.result.sent).toBe(1);
    expect(execution.logs[0]?.jobId).toBe("new-job-1");
    expect(execution.document.subject).toBe(snapshot.document.subject);
  });
});
