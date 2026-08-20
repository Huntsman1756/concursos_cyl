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
  request: { model: string; bodySha256?: string };
  response: {
    status: number;
    id: string;
    model: string;
    usage: { input: number; output: number; total: number };
    requestIds: Record<string, string>;
  };
  retry?: {
    attempt: number;
    maxAttempts: number;
    terminal: boolean;
    retryable: boolean;
    retryDelayMs: number;
    error?: { code: string | null; type: string | null; param: string | null };
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

async function startProxy(
  upstreamPort: number,
  extraArgs: string[] = [],
): Promise<{ port: number; evidencePath: string }> {
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
      ...extraArgs,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  children.push(proxy);
  const ready = JSON.parse(await firstLine(proxy)) as { port: number };
  return { port: ready.port, evidencePath };
}

function drain(request: import("node:http").IncomingMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    request.resume();
    request.once("end", resolve);
    request.once("error", reject);
  });
}

function postChat(port: number, stream = false): Promise<Response> {
  return fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
    method: "POST",
    headers: {
      authorization: "Bearer sk-test-retry-secret",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.6",
      messages: [{ role: "user", content: "RETRY-PROMPT" }],
      stream,
    }),
  });
}

describe("NAN audit proxy", () => {
  it("binds provider response evidence without retaining prompts or credentials", async () => {
    let upstreamRequests = 0;
    const retainedBodies: Buffer[] = [];
    const upstream = http.createServer(async (request, response) => {
      upstreamRequests += 1;
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      retainedBodies.push(Buffer.concat(chunks));
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
          chat_template_kwargs: { customKey: "preserved-custom-key" },
          stream: true,
        }),
      },
    );
    expect(result.status).toBe(200);
    await result.text();

    // The proxy forwards the exact Qwen chat body with enable_thinking false,
    // preserving every other field including custom chat_template_kwargs.
    const forwardedBody = retainedBodies[0]!;
    const forwarded = JSON.parse(forwardedBody.toString("utf8")) as Record<
      string,
      unknown
    >;
    expect(forwarded.model).toBe("qwen3.6");
    expect(forwarded.chat_template_kwargs).toEqual({
      customKey: "preserved-custom-key",
      enable_thinking: false,
    });
    expect(forwarded).toMatchObject({
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    const rawEvidence = await readFile(evidencePath, "utf8");
    const evidence = JSON.parse(rawEvidence.trim()) as ProviderEvidence;
    expect(evidence.contractHash).toBe("contract-test");
    expect(evidence.request.model).toBe("qwen3.6");
    expect(evidence.request.bodySha256).toBe(
      createHash("sha256").update(forwardedBody).digest("hex"),
    );
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

  it("forwards non-Qwen and non-chat request bodies byte-for-byte unchanged", async () => {
    const receivedBodies: Buffer[] = [];
    const upstream = http.createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      receivedBodies.push(Buffer.concat(chunks));
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ id: "chatcmpl-bytewise", model: "probe" }));
    });
    const upstreamPort = await listen(upstream);
    const { port } = await startProxy(upstreamPort);

    const nonQwenBody = JSON.stringify({
      model: "some-other-model",
      messages: [{ role: "user", content: "NON-QWEN-UNCHANGED" }],
    });
    const nonQwenResult = await fetch(
      `http://127.0.0.1:${port}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer sk-non-qwen",
          "content-type": "application/json",
        },
        body: nonQwenBody,
      },
    );
    expect(nonQwenResult.status).toBe(200);
    await nonQwenResult.text();

    const nonChatBody = JSON.stringify({
      model: "qwen3.6",
      input: ["NON-CHAT-UNCHANGED"],
    });
    const nonChatResult = await fetch(`http://127.0.0.1:${port}/v1/embeddings`, {
      method: "POST",
      headers: {
        authorization: "Bearer sk-non-chat",
        "content-type": "application/json",
      },
      body: nonChatBody,
    });
    expect(nonChatResult.status).toBe(200);
    await nonChatResult.text();

    expect(receivedBodies).toHaveLength(2);
    expect(receivedBodies[0]!.equals(Buffer.from(nonQwenBody, "utf8"))).toBe(
      true,
    );
    expect(receivedBodies[1]!.equals(Buffer.from(nonChatBody, "utf8"))).toBe(
      true,
    );

    upstream.close();
  });

  it("retries 429 rate_limit_exceeded then streams the successful 200", async () => {
    let upstreamRequests = 0;
    const upstream = http.createServer(async (request, response) => {
      upstreamRequests += 1;
      await drain(request);
      if (upstreamRequests === 1) {
        response.writeHead(429, {
          "content-type": "application/json",
          "retry-after": "0",
        });
        response.end(
          JSON.stringify({
            error: { code: "rate_limit_exceeded", message: "slow down" },
          }),
        );
        return;
      }
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "x-request-id": "nan-retry-ok",
      });
      response.end(
        [
          'data: {"id":"chatcmpl-retry","model":"qwen3.6","choices":[]}',
          'data: {"id":"chatcmpl-retry","model":"qwen3.6","usage":{"prompt_tokens":4,"completion_tokens":1,"total_tokens":5}}',
          "data: [DONE]",
          "",
        ].join("\n"),
      );
    });
    const upstreamPort = await listen(upstream);
    const { port, evidencePath } = await startProxy(upstreamPort, [
      "--max-attempts",
      "3",
      "--base-delay-ms",
      "10",
      "--max-delay-ms",
      "50",
    ]);

    const result = await postChat(port, true);
    expect(result.status).toBe(200);
    const body = await result.text();
    expect(body).toContain("chatcmpl-retry");

    const rawEvidence = await readFile(evidencePath, "utf8");
    const lines = rawEvidence
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as ProviderEvidence);
    expect(lines).toHaveLength(2);
    expect(lines[0].response.status).toBe(429);
    expect(lines[0].retry).toMatchObject({
      attempt: 1,
      maxAttempts: 3,
      terminal: false,
      retryable: true,
    });
    expect(lines[0].retry?.error).toEqual({
      code: "rate_limit_exceeded",
      type: null,
      param: null,
    });
    expect(lines[1].response.status).toBe(200);
    expect(lines[1].response.id).toBe("chatcmpl-retry");
    expect(lines[1].retry).toMatchObject({
      attempt: 2,
      maxAttempts: 3,
      terminal: true,
      retryable: false,
      retryDelayMs: 0,
    });
    expect(rawEvidence).not.toContain("slow down");
    expect(rawEvidence).not.toContain("RETRY-PROMPT");
    expect(rawEvidence).not.toContain("sk-test-retry-secret");
    expect(upstreamRequests).toBe(2);

    upstream.close();
  });

  it("does not retry 429 insufficient_quota", async () => {
    let upstreamRequests = 0;
    const upstream = http.createServer(async (request, response) => {
      upstreamRequests += 1;
      await drain(request);
      response.writeHead(429, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: { code: "insufficient_quota", message: "no quota left" },
        }),
      );
    });
    const upstreamPort = await listen(upstream);
    const { port, evidencePath } = await startProxy(upstreamPort, [
      "--max-attempts",
      "5",
      "--base-delay-ms",
      "10",
    ]);

    const result = await postChat(port);
    expect(result.status).toBe(429);
    await result.text();

    const rawEvidence = await readFile(evidencePath, "utf8");
    const lines = rawEvidence
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as ProviderEvidence);
    expect(lines).toHaveLength(1);
    expect(lines[0].response.status).toBe(429);
    expect(lines[0].retry).toMatchObject({
      attempt: 1,
      maxAttempts: 5,
      terminal: true,
      retryable: false,
      retryDelayMs: 0,
    });
    expect(lines[0].retry?.error?.code).toBe("insufficient_quota");
    expect(rawEvidence).not.toContain("no quota left");
    expect(upstreamRequests).toBe(1);

    upstream.close();
  });

  it("exhausts all attempts on 503 and reports the terminal attempt", async () => {
    let upstreamRequests = 0;
    const upstream = http.createServer(async (request, response) => {
      upstreamRequests += 1;
      await drain(request);
      response.writeHead(503, {
        "content-type": "application/json",
        "retry-after": "999999",
      });
      response.end(
        JSON.stringify({
          error: { code: "service_unavailable", message: "down for now" },
        }),
      );
    });
    const upstreamPort = await listen(upstream);
    const { port, evidencePath } = await startProxy(upstreamPort, [
      "--max-attempts",
      "3",
      "--base-delay-ms",
      "1",
      "--max-delay-ms",
      "2",
    ]);

    const result = await postChat(port);
    expect(result.status).toBe(503);
    await result.text();

    const rawEvidence = await readFile(evidencePath, "utf8");
    const lines = rawEvidence
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as ProviderEvidence);
    expect(lines).toHaveLength(3);
    for (const [index, line] of lines.entries()) {
      expect(line.response.status).toBe(503);
      expect(line.retry).toMatchObject({
        attempt: index + 1,
        maxAttempts: 3,
        retryable: true,
        error: { code: "service_unavailable", type: null, param: null },
      });
      expect(line.retry?.terminal).toBe(index === 2);
    }
    // Retry-After of 999999 seconds is bounded by --max-delay-ms.
    expect(lines[0].retry?.retryDelayMs).toBeLessThanOrEqual(2);
    expect(rawEvidence).not.toContain("down for now");
    expect(rawEvidence).not.toContain("RETRY-PROMPT");
    expect(rawEvidence).not.toContain("sk-test-retry-secret");
    expect(upstreamRequests).toBe(3);

    upstream.close();
  });
});
