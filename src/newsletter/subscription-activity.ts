import {
  type NewsletterSubscriptionActivityRecord,
  type SavedNewsletterSubscriptionRecord,
  type ScheduledNewsletterJobRecord,
  type ScheduledNewsletterRunRecord,
} from "./types.js";

export function buildNewsletterSubscriptionActivity(
  subscriptions: readonly SavedNewsletterSubscriptionRecord[],
  schedules: readonly ScheduledNewsletterJobRecord[],
  runs: readonly ScheduledNewsletterRunRecord[],
): readonly NewsletterSubscriptionActivityRecord[] {
  const jobsBySubscriptionId = new Map<string, ScheduledNewsletterJobRecord[]>();
  const subscriptionIdByJobId = new Map<string, string>();

  for (const schedule of schedules) {
    const subscriptionId = schedule.payload.subscriptionTemplateId?.trim();
    if (!subscriptionId) {
      continue;
    }

    subscriptionIdByJobId.set(schedule.id, subscriptionId);
    const existing = jobsBySubscriptionId.get(subscriptionId) ?? [];
    existing.push(schedule);
    jobsBySubscriptionId.set(subscriptionId, existing);
  }

  const latestRunBySubscriptionId = new Map<string, ScheduledNewsletterRunRecord>();
  const latestSnapshotRunBySubscriptionId = new Map<string, ScheduledNewsletterRunRecord>();
  for (const run of runs) {
    const subscriptionId = subscriptionIdByJobId.get(run.scheduleJobId);
    if (!subscriptionId) {
      continue;
    }

    const current = latestRunBySubscriptionId.get(subscriptionId);
    if (!current || compareRunOrder(run, current) > 0) {
      latestRunBySubscriptionId.set(subscriptionId, run);
    }

    if (run.status !== "sent" || !run.deliveryJobId) {
      continue;
    }

    const snapshotRun = latestSnapshotRunBySubscriptionId.get(subscriptionId);
    if (!snapshotRun || compareRunOrder(run, snapshotRun) > 0) {
      latestSnapshotRunBySubscriptionId.set(subscriptionId, run);
    }
  }

  return subscriptions.map((subscription) => {
    const linkedJobs = jobsBySubscriptionId.get(subscription.id) ?? [];
    const latestRun = latestRunBySubscriptionId.get(subscription.id) ?? null;
    const latestSnapshotRun = latestSnapshotRunBySubscriptionId.get(subscription.id) ?? null;

    return {
      subscriptionId: subscription.id,
      scheduleCount: linkedJobs.length,
      activeScheduleCount: linkedJobs.filter((item) => item.status === "pending" || item.status === "processing").length,
      pausedScheduleCount: linkedJobs.filter((item) => item.status === "paused").length,
      failedScheduleCount: linkedJobs.filter((item) => item.status === "failed").length,
      latestRunStatus: latestRun?.status ?? null,
      latestRunAt: latestRun?.runAt ?? null,
      latestRunMessage: latestRun?.message ?? null,
      latestSnapshotJobId: latestSnapshotRun?.deliveryJobId ?? null,
      latestSnapshotAt: latestSnapshotRun?.runAt ?? null,
    };
  });
}

function compareRunOrder(
  left: ScheduledNewsletterRunRecord,
  right: ScheduledNewsletterRunRecord,
): number {
  const leftTime = parseStoredDate(left.runAt);
  const rightTime = parseStoredDate(right.runAt);
  if (leftTime !== null && rightTime !== null && leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return left.runAt.localeCompare(right.runAt);
}

function parseStoredDate(value: string | null | undefined): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const parsed = new Date(withSeconds.replace(" ", "T") + "+09:00").getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = new Date(trimmed).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
