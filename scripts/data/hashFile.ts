import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** Computes SHA-256 from the exact bytes stored at a file path. */
export async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(path);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}
