import { homedir } from "node:os";
import { parse } from "node:path";

import { describe, expect, it } from "vitest";

import { assertSafeSnapshotRoot } from "./buildSnapshots";

describe.runIf(process.platform === "win32")(
  "Windows snapshot root aliases",
  () => {
    it("rejects an uppercase alias of the home directory without writing", async () => {
      await expect(
        assertSafeSnapshotRoot(homedir().toUpperCase()),
      ).rejects.toThrow(/broad|home|root/i);
    });

    it("rejects extended-device aliases of home and the drive root", async () => {
      const homeAlias = `\\\\?\\${homedir()}`;
      const rootAlias = `\\\\?\\${parse(homedir()).root}`;

      await expect(assertSafeSnapshotRoot(homeAlias)).rejects.toThrow(
        /broad|home|root/i,
      );
      await expect(assertSafeSnapshotRoot(rootAlias)).rejects.toThrow(
        /broad|home|root/i,
      );
    });
  },
);
