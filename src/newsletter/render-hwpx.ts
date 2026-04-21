import { Buffer } from "node:buffer";
import { type NewsletterDocument } from "./types.js";

const HWPX_MIMETYPE = "application/hwp+zip";

export function renderNewsletterHwpx(document: NewsletterDocument): Buffer {
  const paragraphs = buildHwpxParagraphs(document);
  const previewText = paragraphs.join("\n").slice(0, 1000);
  const issuedAt = toIsoStamp(document.generatedAt);

  const files = [
    {
      path: "mimetype",
      content: HWPX_MIMETYPE,
    },
    {
      path: "Contents/content.hpf",
      content: buildContentHpf(document, issuedAt),
    },
    {
      path: "Contents/header.xml",
      content: buildHeaderXml(),
    },
    {
      path: "Contents/section0.xml",
      content: buildSectionXml(paragraphs),
    },
    {
      path: "settings.xml",
      content: buildSettingsXml(paragraphs),
    },
    {
      path: "META-INF/container.xml",
      content: buildContainerXml(),
    },
    {
      path: "META-INF/manifest.xml",
      content: buildManifestXml(),
    },
    {
      path: "META-INF/container.rdf",
      content: buildContainerRdf(),
    },
    {
      path: "Preview/PrvText.txt",
      content: previewText,
    },
  ];

  return buildStoredZip(
    files.map((file) => ({
      name: file.path,
      data: Buffer.from(file.content, "utf-8"),
    })),
  );
}

export function buildHwpxFilename(document: NewsletterDocument): string {
  const keyword = sanitizeFilename(document.keyword ?? "all");
  return `legislation-newsletter_${keyword}_${document.dateFrom}_${document.dateTo}.hwpx`;
}

function buildHwpxParagraphs(document: NewsletterDocument): string[] {
  const paragraphs: string[] = [
    document.subject,
    "",
    `키워드: ${document.keyword ?? "없음"}`,
    ...(document.proposerFilter ? [`발의 의원 필터: ${document.proposerFilter}`] : []),
    ...(document.committeeFilter ? [`상임위 필터: ${document.committeeFilter}`] : []),
    `기간: ${document.dateFrom} ~ ${document.dateTo}`,
    `생성시각: ${document.generatedAt} ${document.timeZone}`,
    `포함 법안 수: ${document.items.length}건`,
    "",
  ];

  if (document.introText) {
    paragraphs.push("브리핑 메모");
    paragraphs.push(...splitParagraphs(document.introText));
    paragraphs.push("");
  }

  document.items.forEach((item, index) => {
    paragraphs.push(`${index + 1}. ${item.billName}`);
    paragraphs.push(`의안번호: ${item.billNo || "미상"}`);
    paragraphs.push(`발의 의원: ${item.proposer || "미상"}`);
    paragraphs.push(`소관 상임위: ${item.committee || "미상"}`);
    paragraphs.push(`현재 단계: ${item.stageLabel}`);
    paragraphs.push(`입법예고 종료일: ${item.noticeEndDate ?? "미상"}`);
    if (item.detailUrl) {
      paragraphs.push(`원문 링크: ${item.detailUrl}`);
    }
    paragraphs.push("주요내용");
    paragraphs.push(...splitParagraphs(item.summary || "상세 요약 정보가 아직 수집되지 않았습니다."));
    paragraphs.push("");
  });

  if (document.outroText) {
    paragraphs.push("마무리");
    paragraphs.push(...splitParagraphs(document.outroText));
  }

  return paragraphs;
}

function splitParagraphs(value: string): string[] {
  return value
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.trimEnd());
}

function buildContentHpf(document: NewsletterDocument, issuedAt: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package version="2.0" unique-identifier="newsdoc" xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <opf:metadata>
    <dc:title>${escapeXml(document.subject)}</dc:title>
    <dc:creator>assembly-api-mcp</dc:creator>
    <dc:language>ko-KR</dc:language>
    <dc:date>${escapeXml(issuedAt)}</dc:date>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/>
    <opf:item id="settings" href="settings.xml" media-type="application/xml"/>
    <opf:item id="preview" href="Preview/PrvText.txt" media-type="text/plain"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>
`;
}

function buildHeaderXml(): string {
  const fontface = [
    "HANGUL",
    "LATIN",
    "HANJA",
    "JAPANESE",
    "OTHER",
    "SYMBOL",
    "USER",
  ].map((lang) => `    <hh:fontface lang="${lang}" fontCnt="1">
      <hh:font id="0" face="Malgun Gothic" type="TTF" isEmbedded="0">
        <hh:typeInfo familyType="FCAT_GOTHIC" weight="5" proportion="3" contrast="2" strokeVariation="0" armStyle="0" letterform="2" midline="0" xHeight="4"/>
      </hh:font>
    </hh:fontface>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hh:head xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" version="1.5" secCnt="1">
  <hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/>
  <hh:refList>
    <hh:fontfaces itemCnt="7">
${fontface}
    </hh:fontfaces>
    <hh:borderFills itemCnt="0"/>
    <hh:charProperties itemCnt="1">
      <hh:charPr id="0" height="1000" textColor="#000000" shadeColor="#FFFFFF" useFontSpace="0" useKerning="0">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
      </hh:charPr>
    </hh:charProperties>
    <hh:tabProperties itemCnt="1">
      <hh:tabPr id="0" autoTabLeft="0" autoTabRight="0"/>
    </hh:tabProperties>
    <hh:numberings itemCnt="0"/>
    <hh:paraProperties itemCnt="1">
      <hh:paraPr id="0" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0" textDir="LTR">
        <hh:align horizontal="LEFT" vertical="BASELINE"/>
      </hh:paraPr>
    </hh:paraProperties>
    <hh:styles itemCnt="1">
      <hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" lockForm="0"/>
    </hh:styles>
  </hh:refList>
  <hh:compatibleDocument targetProgram="HWP2018">
    <hh:layoutCompatibility/>
  </hh:compatibleDocument>
  <hh:docOption>
    <hh:linkinfo path="" pageInherit="0" footnoteInherit="0"/>
  </hh:docOption>
</hh:head>
`;
}

function buildSectionXml(paragraphs: readonly string[]): string {
  const paragraphXml = paragraphs.map((paragraph, index) => `  <hp:p id="${index}" paraPrIDRef="0" styleIDRef="0">
    <hp:run charPrIDRef="0">
      <hp:t>${escapeXml(paragraph)}</hp:t>
    </hp:run>
  </hp:p>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">
${paragraphXml}
</hs:sec>
`;
}

function buildSettingsXml(paragraphs: readonly string[]): string {
  const lastParagraphIndex = Math.max(paragraphs.length - 1, 0);
  const lastParagraphLength = paragraphs[lastParagraphIndex]?.length ?? 0;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ha:HWPApplicationSetting xmlns:ha="http://www.owpml.org/owpml/2023/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0">
  <ha:CaretPosition listIDRef="0" paraIDRef="${lastParagraphIndex}" pos="${lastParagraphLength}"/>
</ha:HWPApplicationSetting>
`;
}

function buildContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container:container version="1.0" xmlns:container="urn:oasis:names:tc:opendocument:xmlns:container">
  <container:rootfiles>
    <container:rootfile full-path="Contents/content.hpf" media-type="application/oebps-package+xml"/>
  </container:rootfiles>
</container:container>
`;
}

function buildManifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="${HWPX_MIMETYPE}"/>
  <manifest:file-entry manifest:full-path="mimetype" manifest:media-type="text/plain"/>
  <manifest:file-entry manifest:full-path="Contents/content.hpf" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Contents/header.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Contents/section0.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Preview/PrvText.txt" manifest:media-type="text/plain"/>
</manifest:manifest>
`;
}

function buildContainerRdf(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>
`;
}

function toIsoStamp(value: string): string {
  const normalized = value.trim().replace(" ", "T");
  if (normalized.endsWith("Z")) {
    return normalized;
  }
  return `${normalized}+09:00`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "") || "all";
}

function buildStoredZip(
  entries: readonly {
    readonly name: string;
    readonly data: Buffer;
  }[],
): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf-8");
    const crc32 = crc32Buffer(entry.data);
    const time = dosTime(new Date());
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time.time, 10);
    localHeader.writeUInt16LE(time.date, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time.time, 12);
    centralHeader.writeUInt16LE(time.date, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuffer.copy(centralHeader, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function dosTime(date: Date): { time: number; date: number } {
  const seconds = Math.floor(date.getSeconds() / 2);
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = Math.max(date.getFullYear(), 1980) - 1980;

  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: (year << 9) | (month << 5) | day,
  };
}

function crc32Buffer(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc = CRC32_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();
