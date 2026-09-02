/**
 * Truthful "open now" derivation: a call is open for applications when the
 * published window covers `today` (runtime clock). Fail-closed: unknown
 * deadlines are never counted as open.
 */
export function selectOpenPublicCalls<
  T extends {
    accessType: string;
    applicationDeadline: string | null;
    applicationStart: string | null;
  },
>(calls: readonly T[], referenceDate: string): T[] {
  return calls.filter(
    (call) =>
      call.accessType === "open" &&
      call.applicationDeadline !== null &&
      call.applicationDeadline >= referenceDate &&
      (call.applicationStart === null ||
        call.applicationStart <= referenceDate),
  );
}
