import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function sha256File(path: string): Promise<string> {
  const contents = await readFile(path);
  return createHash("sha256").update(contents).digest("hex");
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
