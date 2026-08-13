import { spawn, type ChildProcessByStdio } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { Readable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";

type ProxyProcess = ChildProcessByStdio<null, Readable, Readable>;

const children: ProxyProcess[] = [];
const directories: string[] = [];

type ProviderEvidence = {
  contractHash: string;
  keyFingerprint: string;
  request: { model: string };
  response: {
    status: number;
    id: string;
    model: string;
    usage: { input: number; output: number; total: number };
    requestIds: Record<string, string>;
  };
};

afterEach(async () => {
  for (const child of children.splice(0)) child.kill();
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("no port");
      resolve(address.port);
    });
  });
}

function firstLine(child: ProxyProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let pending = "";
    child.stdout.on("data", (chunk: Buffer) => {
      pending += chunk.toString("utf8");
      const newline = pending.indexOf("\n");
      if (newline >= 0) resolve(pending.slice(0, newline));
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`proxy exited ${code}`)));
  });
}

describe("NAN audit proxy", () => {
  it("binds provider response evidence without retaining prompts or credentials", async () => {
    let upstreamRequests = 0;
    const upstream = http.createServer(async (request, response) => {
      upstreamRequests += 1;
      for await (const chunk of request) {
        // Drain the request without retaining its prompt.
        void chunk;
      }
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "x-request-id": "nan-request-test",
      });
      response.end(
        [
          'data: {"id":"chatcmpl-test","model":"qwen3.6","choices":[]}',
          'data: {"id":"chatcmpl-test","model":"qwen3.6","usage":{"prompt_tokens":7,"completion_tokens":3,"total_tokens":10}}',
          "data: [DONE]",
          "",
        ].join("\n"),
      );
    });
    const upstreamPort = await listen(upstream);
    const directory = await mkdtemp(path.join(os.tmpdir(), "nan-proxy-test-"));
    directories.push(directory);
    const evidencePath = path.join(directory, "evidence.jsonl");
    const proxy = spawn(
      process.execPath,
      [
        path.resolve("scripts/orchestration/nan-audit-proxy.mjs"),
        "--evidence",
        evidencePath,
        "--contract-hash",
        "contract-test",
        "--repository-id",
        "repository-test",
        "--upstream",
        `http://127.0.0.1:${upstreamPort}`,
        "--allow-http-upstream",
        "true",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    children.push(proxy);
    const ready = JSON.parse(await firstLine(proxy)) as { port: number };
    const secret = "sk-test-secret";
    const prompt = "PROMPT-MUST-NOT-BE-RETAINED";

    const result = await fetch(
      `http://127.0.0.1:${ready.port}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen3.6",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      },
    );
    expect(result.status).toBe(200);
    await result.text();

    const rawEvidence = await readFile(evidencePath, "utf8");
    const evidence = JSON.parse(rawEvidence.trim()) as ProviderEvidence;
    expect(evidence.contractHash).toBe("contract-test");
    expect(evidence.request.model).toBe("qwen3.6");
    expect(evidence.response).toMatchObject({
      status: 200,
      id: "chatcmpl-test",
      model: "qwen3.6",
      usage: { input: 7, output: 3, total: 10 },
      requestIds: { "x-request-id": "nan-request-test" },
    });
    expect(evidence.keyFingerprint).toBe(
      createHash("sha256").update(secret).digest("hex").slice(0, 16),
    );
    expect(rawEvidence).not.toContain(prompt);
    expect(rawEvidence).not.toContain(secret);
    expect(upstreamRequests).toBe(1);

    const rejectedStatus = await new Promise<number | undefined>(
      (resolve, reject) => {
        const request = http.request(
          {
            host: "127.0.0.1",
            port: ready.port,
            method: "GET",
            path: "https://example.invalid/credential-leak",
            headers: { authorization: `Bearer ${secret}` },
          },
          (response) => {
            response.resume();
            response.once("end", () => resolve(response.statusCode));
          },
        );
        request.once("error", reject);
        request.end();
      },
    );
    expect(rejectedStatus).toBe(400);
    expect(upstreamRequests).toBe(1);

    upstream.close();
  });
});
