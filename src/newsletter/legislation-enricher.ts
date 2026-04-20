import { type ApiResult, createApiClient } from "../api/client.js";
import { API_CODES, CURRENT_AGE } from "../api/codes.js";
import { type AppConfig } from "../config.js";
import { LegislationStageService } from "./legislation-stage.js";
import { type LegislationItem } from "./types.js";

interface AssemblyApiLike {
  fetchOpenAssembly(
    apiCode: string,
    params?: Record<string, string | number>,
  ): Promise<ApiResult>;
}

export function createLegislationEnrichmentService(
  config: AppConfig,
): LegislationEnrichmentService {
  return new LegislationEnrichmentService(createApiClient(config));
}

export class LegislationEnrichmentService {
  private readonly stageService: LegislationStageService;

  constructor(private readonly api: AssemblyApiLike) {
    this.stageService = new LegislationStageService(api);
  }

  async enrichItems(
    items: readonly LegislationItem[],
  ): Promise<readonly LegislationItem[]> {
    return Promise.all(items.map((item) => this.enrichItem(item)));
  }

  async enrichItem(item: LegislationItem): Promise<LegislationItem> {
    if (!item.billId || item.billId === "unknown") {
      return item;
    }

    try {
      const result = await this.api.fetchOpenAssembly(API_CODES.BILL_DETAIL, {
        BILL_ID: item.billId,
        AGE: CURRENT_AGE,
      });

      const detail = result.rows[0];
      if (!detail) {
        return item;
      }

      const proposer = pickString(detail, "PROPOSER")
        ?? pickString(detail, "RST_PROPOSER")
        ?? item.proposer;
      const committee = pickString(detail, "COMMITTEE")
        ?? pickString(detail, "CURR_COMMITTEE")
        ?? pickString(detail, "COMMITTEE_NM")
        ?? item.committee;
      const detailUrl = pickString(detail, "DETAIL_LINK")
        ?? pickString(detail, "LINK_URL")
        ?? item.detailUrl;
      const summary = buildSummary(detail) ?? item.summary;
      const stage = await this.stageService.resolveStage(item, detail);

      return {
        ...item,
        proposer,
        committee,
        detailUrl: detailUrl ?? null,
        summary,
        billStage: stage.billStage,
        stageLabel: stage.stageLabel,
        raw: { ...item.raw, ...detail },
      };
    } catch {
      return item;
    }
  }
}

function buildSummary(detail: Record<string, unknown>): string | undefined {
  const segments = [
    pickString(detail, "DETAIL_CONTENT"),
    pickString(detail, "RSN"),
  ].filter(Boolean) as string[];

  if (segments.length === 0) return undefined;

  return segments
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function pickString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = row[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
