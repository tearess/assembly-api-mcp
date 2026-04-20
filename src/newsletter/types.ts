export type DatePreset = "6m" | "3m" | "1m" | "3w" | "2w" | "1w" | "custom";
export type NoticeScope = "active_only" | "include_closed";
export type LegislationSortBy = "relevance" | "notice_end_desc" | "notice_end_asc";

export interface LegislationSearchQuery {
  readonly keyword?: string;
  readonly datePreset?: DatePreset;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly noticeScope?: NoticeScope;
  readonly sortBy?: LegislationSortBy;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ResolvedDateRange {
  readonly datePreset: DatePreset;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly timeZone: string;
}

export type NoticeStatus = "active" | "closed";

export interface LegislationItem {
  readonly billId: string;
  readonly billNo: string;
  readonly billName: string;
  readonly proposer: string;
  readonly committee: string;
  readonly noticeStatus: NoticeStatus;
  readonly billStage: string | null;
  readonly stageLabel: string;
  readonly noticeEndDate: string | null;
  readonly summary: string;
  readonly detailUrl: string | null;
  readonly relevanceScore: number;
  readonly raw: Record<string, unknown>;
}

export interface LegislationSearchResultQuery {
  readonly keyword: string | null;
  readonly datePreset: DatePreset;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly noticeScope: NoticeScope;
  readonly sortBy: LegislationSortBy;
  readonly page: number;
  readonly pageSize: number;
  readonly timeZone: string;
}

export interface LegislationSearchResult {
  readonly query: LegislationSearchResultQuery;
  readonly total: number;
  readonly totalPages: number;
  readonly items: readonly LegislationItem[];
}

export interface NewsletterDocument {
  readonly subject: string;
  readonly keyword: string | null;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly timeZone: string;
  readonly generatedAt: string;
  readonly introText?: string | null;
  readonly outroText?: string | null;
  readonly items: readonly LegislationItem[];
}

export interface NewsletterContentPayload {
  readonly query: LegislationSearchQuery;
  readonly items: readonly LegislationItem[];
  readonly selectedBillIds: readonly string[];
  readonly subject: string | null;
  readonly introText?: string | null;
  readonly outroText?: string | null;
  readonly includeAllResults: boolean;
  readonly onlyNewResults?: boolean | null;
  readonly excludeBillIds?: readonly string[] | null;
  readonly recipientGroupId?: string | null;
  readonly recipientGroupName?: string | null;
  readonly searchPresetId?: string | null;
  readonly searchPresetName?: string | null;
  readonly subscriptionTemplateId?: string | null;
  readonly subscriptionTemplateName?: string | null;
}

export interface NewsletterSendPayload extends NewsletterContentPayload {
  readonly recipients: readonly string[];
}

export interface RecipientRecord {
  readonly email: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RecipientGroupRecord {
  readonly id: string;
  readonly name: string;
  readonly emails: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SendLogRecord {
  readonly id: string;
  readonly jobId: string;
  readonly recipientEmail: string;
  readonly status: "sent" | "failed";
  readonly errorMessage: string | null;
  readonly subject: string;
  readonly keyword: string | null;
  readonly itemCount: number;
  readonly snapshotAvailable: boolean;
  readonly sentAt: string;
}

export interface SentNewsletterSnapshotRecord {
  readonly jobId: string;
  readonly document: NewsletterDocument;
  readonly html: string;
  readonly markdown: string;
  readonly createdAt: string;
}

export interface SavedSearchPresetQuery {
  readonly keyword: string | null;
  readonly datePreset: DatePreset;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly noticeScope: NoticeScope;
  readonly sortBy: LegislationSortBy;
  readonly pageSize: number;
}

export interface SavedSearchPresetRecord {
  readonly id: string;
  readonly name: string;
  readonly query: SavedSearchPresetQuery;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ScheduledNewsletterJobStatus =
  | "pending"
  | "processing"
  | "paused"
  | "sent"
  | "skipped"
  | "failed"
  | "cancelled";

export type ScheduledNewsletterRecurrence = "once" | "daily" | "weekly";
export type ScheduledNewsletterJobRunStatus = "sent" | "failed" | "skipped";

export interface ScheduledNewsletterRunRecord {
  readonly id: string;
  readonly scheduleJobId: string;
  readonly scheduleSubject: string;
  readonly recurrence: ScheduledNewsletterRecurrence;
  readonly status: ScheduledNewsletterJobRunStatus;
  readonly message: string | null;
  readonly keyword: string | null;
  readonly itemCount: number;
  readonly sentCount: number;
  readonly failedCount: number;
  readonly deliveryJobId: string | null;
  readonly runAt: string;
}

export interface NewsletterOperationalSummary {
  readonly asOf: string;
  readonly recipientCount: number;
  readonly recipientGroupCount: number;
  readonly searchPresetCount: number;
  readonly subscriptionTemplateCount: number;
  readonly scheduleCounts: {
    readonly total: number;
    readonly active: number;
    readonly paused: number;
    readonly failed: number;
  };
  readonly scheduleRunWindowDays: number;
  readonly scheduleRunCounts: {
    readonly sent: number;
    readonly skipped: number;
    readonly failed: number;
  };
  readonly sendLogCounts: {
    readonly sent: number;
    readonly failed: number;
  };
}

export interface NewsletterSettingsBundle {
  readonly version: 1;
  readonly exportedAt: string;
  readonly recipients: readonly RecipientRecord[];
  readonly recipientGroups: readonly RecipientGroupRecord[];
  readonly searchPresets: readonly SavedSearchPresetRecord[];
  readonly subscriptionTemplates: readonly SavedNewsletterSubscriptionRecord[];
}

export interface NewsletterSubscriptionActivityRecord {
  readonly subscriptionId: string;
  readonly scheduleCount: number;
  readonly activeScheduleCount: number;
  readonly pausedScheduleCount: number;
  readonly failedScheduleCount: number;
  readonly latestRunStatus: ScheduledNewsletterJobRunStatus | null;
  readonly latestRunAt: string | null;
  readonly latestRunMessage: string | null;
  readonly latestSnapshotJobId: string | null;
  readonly latestSnapshotAt: string | null;
}

export interface SavedNewsletterSubscriptionRecord {
  readonly id: string;
  readonly name: string;
  readonly query: SavedSearchPresetQuery;
  readonly recipientGroupId: string | null;
  readonly recipientGroupName: string | null;
  readonly searchPresetId: string | null;
  readonly searchPresetName: string | null;
  readonly recipients: readonly string[];
  readonly subject: string | null;
  readonly introText?: string | null;
  readonly outroText?: string | null;
  readonly recurrence: ScheduledNewsletterRecurrence;
  readonly onlyNewResults: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ScheduledNewsletterJobRecord {
  readonly id: string;
  readonly scheduledAt: string;
  readonly recurrence: ScheduledNewsletterRecurrence;
  readonly status: ScheduledNewsletterJobStatus;
  readonly payload: NewsletterSendPayload;
  readonly deliveredBillIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly processedAt: string | null;
  readonly lastRunStatus: ScheduledNewsletterJobRunStatus | null;
  readonly lastRunMessage: string | null;
  readonly errorMessage: string | null;
}
