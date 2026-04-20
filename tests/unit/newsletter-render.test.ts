import { describe, expect, it } from "vitest";
import { normalizeRecipients } from "../../src/newsletter/email.js";
import {
  buildHtmlFilename,
  renderNewsletterHtml,
} from "../../src/newsletter/render-html.js";
import {
  buildMarkdownFilename,
  renderNewsletterMarkdown,
} from "../../src/newsletter/render-markdown.js";
import { type NewsletterDocument } from "../../src/newsletter/types.js";

function createDocument(): NewsletterDocument {
  return {
    subject: "[입법예고 뉴스레터] 인공지능 관련 법안 브리핑",
    keyword: "인공지능",
    proposerFilter: "홍길동",
    committeeFilter: "과학기술정보방송통신위원회",
    dateFrom: "2026-03-20",
    dateTo: "2026-04-20",
    timeZone: "Asia/Seoul",
    generatedAt: "2026-04-20 10:30",
    introText: "이번 브리핑은 인공지능 산업 진흥과 안전성 기준 정비에 초점을 맞췄습니다.",
    outroText: "관심 법안이 있으면 회신해 주세요.",
    items: [
      {
        billId: "BILL_001",
        billNo: "2200001",
        billName: "인공지능 산업 진흥법 일부개정법률안",
        proposer: "홍길동",
        committee: "과학기술정보방송통신위원회",
        noticeStatus: "active",
        billStage: "소관위 심사",
        stageLabel: "입법예고 진행중 / 소관위 심사",
        noticeEndDate: "2026-04-28",
        summary: "인공지능 산업의 안전성 기준과 지원 근거를 정비하는 내용",
        detailUrl: "https://open.assembly.go.kr/example",
        relevanceScore: 0.91,
        raw: {},
      },
    ],
  };
}

describe("newsletter/render", () => {
  it("Markdown 뉴스레터를 생성한다", () => {
    const markdown = renderNewsletterMarkdown(createDocument());

    expect(markdown).toContain("# [입법예고 뉴스레터] 인공지능 관련 법안 브리핑");
    expect(markdown).toContain("발의 의원 필터: 홍길동");
    expect(markdown).toContain("상임위 필터: 과학기술정보방송통신위원회");
    expect(markdown).toContain("## 브리핑 메모");
    expect(markdown).toContain("이번 브리핑은 인공지능 산업 진흥과 안전성 기준 정비에 초점을 맞췄습니다.");
    expect(markdown).toContain("## 1. 인공지능 산업 진흥법 일부개정법률안");
    expect(markdown).toContain("현재 단계: 입법예고 진행중 / 소관위 심사");
    expect(markdown).toContain("## 마무리");
    expect(markdown).toContain("관심 법안이 있으면 회신해 주세요.");
  });

  it("Markdown 파일명을 생성한다", () => {
    const filename = buildMarkdownFilename(createDocument());
    expect(filename).toBe("legislation-newsletter_인공지능_2026-03-20_2026-04-20.md");
  });

  it("HTML 파일명을 생성한다", () => {
    const filename = buildHtmlFilename(createDocument());
    expect(filename).toBe("legislation-newsletter_인공지능_2026-03-20_2026-04-20.html");
  });

  it("HTML 뉴스레터를 생성한다", () => {
    const html = renderNewsletterHtml(createDocument());

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("발의 의원 필터");
    expect(html).toContain("상임위 필터");
    expect(html).toContain("브리핑 메모");
    expect(html).toContain("이번 브리핑은 인공지능 산업 진흥과 안전성 기준 정비에 초점을 맞췄습니다.");
    expect(html).toContain("인공지능 산업 진흥법 일부개정법률안");
    expect(html).toContain("입법예고 진행중 / 소관위 심사");
    expect(html).toContain("마무리");
    expect(html).toContain("관심 법안이 있으면 회신해 주세요.");
  });
});

describe("newsletter/email", () => {
  it("수신자 목록을 정규화하고 중복을 제거한다", () => {
    const recipients = normalizeRecipients([
      "Alpha@example.com",
      " alpha@example.com ",
      "beta@example.com",
    ]);

    expect(recipients).toEqual(["alpha@example.com", "beta@example.com"]);
  });

  it("잘못된 이메일 형식이면 에러를 던진다", () => {
    expect(() => normalizeRecipients(["not-an-email"])).toThrow("이메일 형식");
  });
});
