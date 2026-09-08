/**
 * Centralized access to "today" for any UI logic that compares a snapshot
 * deadline against the current date. Components must never call `new Date()`
 * directly for this purpose: tests override the reference date here so the
 * before/on/after boundaries stay deterministic.
 */

let todayOverride: string | null = null;

/** Returns today's date as a bare calendar day (YYYY-MM-DD). */
export function todayCalendarDay(): string {
  if (todayOverride !== null) return todayOverride;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Overrides today's date for deterministic tests. Pass null to reset. */
export function setTodayForTests(value: string | null): void {
  todayOverride = value;
}
