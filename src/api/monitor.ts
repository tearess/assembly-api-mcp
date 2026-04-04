/**
 * API 응답 시간 모니터링
 *
 * API 호출의 지속 시간, 성공률, 느린 호출을 추적합니다.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiCallMetric {
  readonly apiCode: string;
  readonly durationMs: number;
  readonly timestamp: number;
  readonly success: boolean;
}

export interface MonitorStats {
  readonly totalCalls: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly avgDurationMs: number;
  readonly slowCallCount: number;
}

export interface Monitor {
  readonly record: (metric: ApiCallMetric) => void;
  readonly stats: () => MonitorStats;
  readonly slowCalls: () => readonly ApiCallMetric[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLOW_THRESHOLD_MS = 3000;
const MAX_SLOW_CALLS_STORED = 100;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMonitor(): Monitor {
  let metrics: readonly ApiCallMetric[] = [];
  let slowCallsList: readonly ApiCallMetric[] = [];

  function record(metric: ApiCallMetric): void {
    metrics = [...metrics, metric];

    if (metric.durationMs > SLOW_THRESHOLD_MS) {
      const updated = [...slowCallsList, metric];
      slowCallsList =
        updated.length > MAX_SLOW_CALLS_STORED
          ? updated.slice(-MAX_SLOW_CALLS_STORED)
          : updated;

      process.stderr.write(
        `[assembly:monitor] 느린 API 호출: ${metric.apiCode} — ${String(metric.durationMs)}ms\n`,
      );
    }
  }

  function stats(): MonitorStats {
    const totalCalls = metrics.length;
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        successCount: 0,
        failureCount: 0,
        avgDurationMs: 0,
        slowCallCount: 0,
      };
    }

    const successCount = metrics.filter((m) => m.success).length;
    const totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);

    return {
      totalCalls,
      successCount,
      failureCount: totalCalls - successCount,
      avgDurationMs: Math.round(totalDuration / totalCalls),
      slowCallCount: slowCallsList.length,
    };
  }

  function slowCalls(): readonly ApiCallMetric[] {
    return slowCallsList;
  }

  return { record, stats, slowCalls };
}
