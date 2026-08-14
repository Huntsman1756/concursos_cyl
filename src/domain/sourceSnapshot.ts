import {
  SourceSnapshotSchema,
  type SourceSnapshot,
} from "../../data/schemas/generated";

export { SourceSnapshotSchema };
export type { SourceSnapshot };

export function isFreshSnapshot(snapshot: SourceSnapshot): boolean {
  return snapshot.qualityStatus === "passed";
}
