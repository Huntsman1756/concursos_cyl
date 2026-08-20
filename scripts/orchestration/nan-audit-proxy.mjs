#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { Readable } from "node:stream";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const upstream = new URL(args.get("--upstream") ?? "https://api.nan.builders");
const evidencePath = args.get("--evidence");
const contractHash = args.get("--contract-hash");
const repositoryId = args.get("--repository-id");
const allowHttpUpstream = args.get("--allow-http-upstream") === "true";
const maxAttempts = parseInt(args.get("--max-attempts") ?? "3", 10);
const baseDelayMs = parseInt(args.get("--base-delay-ms") ?? "1000", 10);
const maxDelayMs = parseInt(args.get("--max-delay-ms") ?? "30000", 10);

if (!evidencePath || !contractHash || !repositoryId) {
  throw new Error(
    "--evidence, --contract-hash and --repository-id are required",
  );
}
if (
  upstream.protocol !== "https:" &&
  !(allowHttpUpstream && upstream.protocol === "http:")
) {
  throw new Error("The NAN audit proxy requires an HTTPS upstream");
}
if (
  !allowHttpUpstream &&
  (upstream.hostname !== "api.nan.builders" || upstream.pathname !== "/")
) {
  throw new Error("The production upstream must be https://api.nan.builders");
}
if (
  !Number.isFinite(maxAttempts) ||
  maxAttempts < 1 ||
  !Number.isFinite(baseDelayMs) ||
  baseDelayMs < 0 ||
  !Number.isFinite(maxDelayMs) ||
  maxDelayMs < 0 ||
  maxDelayMs < baseDelayMs
) {
  throw new Error(
    "--max-attempts (>=1), --base-delay-ms (>=0) and --max-delay-ms (>=base) are required",
  );
}

await mkdir(path.dirname(evidencePath), { recursive: true });

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function bearerFingerprint(header) {
  const match = /^Bearer\s+(.+)$/iu.exec(header ?? "");
  return match ? sha256(match[1]).slice(0, 16) : null;
}

function parseErrorBody(buffer) {
  try {
    const parsed = JSON.parse(buffer.toString("utf8"));
    const err = parsed.error ?? {};
    return {
      code: typeof err.code === "string" ? err.code : null,
      type: typeof err.type === "string" ? err.type : null,
      param:
        err.param === undefined || err.param === null
          ? null
          : String(err.param),
    };
  } catch {
    return { code: null, type: null, param: null };
  }
}

function isRetryableError(errorCode, status) {
  if (status === 429) return errorCode === "rate_limit_exceeded";
  return status >= 500 && status < 600;
}

function parseRetryAfter(header) {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = new Date(header);
  if (Number.isFinite(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  return null;
}

function retryDelayMsFor(attempt, retryAfterMs) {
  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, maxDelayMs);
  }
  const exponential = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  // Deterministic jitter so tests and production are reproducible.
  const jitter = (attempt * 9973) % 251;
  return Math.min(exponential + jitter, maxDelayMs);
}

async function readBoundedBody(body, maxBytes) {
  const chunks = [];
  let retainedBytes = 0;
  if (!body) return Buffer.alloc(0);
  for await (const chunk of Readable.fromWeb(body)) {
    const bytes = Buffer.from(chunk);
    if (retainedBytes < maxBytes) {
      const retained = bytes.subarray(0, maxBytes - retainedBytes);
      chunks.push(retained);
      retainedBytes += retained.length;
    }
  }
  return Buffer.concat(chunks);
}

function safeRequestMetadata(body) {
  try {
    const parsed = JSON.parse(body.toString("utf8"));
    return {
      model: typeof parsed.model === "string" ? parsed.model : null,
      stream: parsed.stream === true,
    };
  } catch {
    return { model: null, stream: null };
  }
}

function disableQwenThinkingBody(body, method, pathname) {
  // Only POST /v1/chat/completions with valid JSON and the mechanical Qwen
  // model is transformed; every other body is returned byte-for-byte unchanged.
  if (method !== "POST" || pathname !== "/v1/chat/completions") return body;
  let parsed;
  try {
    parsed = JSON.parse(body.toString("utf8"));
  } catch {
    return body;
  }
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    parsed.model !== "qwen3.6"
  ) {
    return body;
  }
  const transformed = { ...parsed };
  transformed.chat_template_kwargs = {
    ...(parsed.chat_template_kwargs ?? {}),
    enable_thinking: false,
  };
  return Buffer.from(JSON.stringify(transformed), "utf8");
}

function collectResponseMetadata(buffer) {
  const text = buffer.toString("utf8");
  const result = { id: null, model: null, usage: null };
  const candidates = [];

  if (text.trimStart().startsWith("{")) {
    candidates.push(text);
  } else {
    for (const line of text.split(/\r?\n/u)) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload && payload !== "[DONE]") candidates.push(payload);
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed.id === "string") result.id = parsed.id;
      if (typeof parsed.model === "string") result.model = parsed.model;
      if (parsed.usage && typeof parsed.usage === "object") {
        result.usage = parsed.usage;
      }
      if (parsed.response && typeof parsed.response === "object") {
        if (typeof parsed.response.id === "string")
          result.id = parsed.response.id;
        if (typeof parsed.response.model === "string") {
          result.model = parsed.response.model;
        }
        if (
          parsed.response.usage &&
          typeof parsed.response.usage === "object"
        ) {
          result.usage = parsed.response.usage;
        }
      }
    } catch {
      // Ignore non-JSON streaming events. The response hash still covers them.
    }
  }
  return result;
}

function normalizedUsage(usage) {
  if (!usage) return null;
  const input = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0);
  const output = Number(usage.completion_tokens ?? usage.output_tokens ?? 0);
  const total = Number(usage.total_tokens ?? input + output);
  if (![input, output, total].every(Number.isFinite)) return null;
  return { input, output, total };
}

async function writeEvidence(record) {
  await appendFile(evidencePath, `${JSON.stringify(record)}\n`, {
    encoding: "utf8",
  });
}

const server = http.createServer(async (request, response) => {
  const requestId = randomUUID();
  const bodyChunks = [];
  for await (const chunk of request) bodyChunks.push(Buffer.from(chunk));
  const requestBody = Buffer.concat(bodyChunks);
  const requestMetadata = safeRequestMetadata(requestBody);
  const authorization = request.headers.authorization;

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (
      value === undefined ||
      name.toLowerCase() === "host" ||
      name.toLowerCase() === "content-length"
    ) {
      continue;
    }
    headers.set(name, Array.isArray(value) ? value.join(",") : value);
  }

  const target = new URL(request.url ?? "/", upstream);
  if (target.origin !== upstream.origin) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(
      JSON.stringify({ error: { code: "nan_proxy_invalid_target" } }),
    );
    return;
  }

  // Disable Qwen thinking once per incoming request; every retry forwards the
  // same Buffer and every evidence branch hashes that exact forwarded body.
  const forwardedBody = disableQwenThinkingBody(
    requestBody,
    request.method,
    target.pathname,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const observedAt = new Date().toISOString();
    let upstreamResponse;
    try {
      upstreamResponse = await fetch(target, {
        method: request.method,
        headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : forwardedBody,
        redirect: "manual",
      });
    } catch (error) {
      // Transport errors are not retryable per contract (only 429
      // rate_limit_exceeded and 5xx qualify).
      await writeEvidence({
        schemaVersion: 1,
        evidenceClass: "provider-observed",
        repositoryId,
        contractHash,
        requestId,
        observedAt,
        keyFingerprint: bearerFingerprint(authorization),
        request: {
          method: request.method,
          path: target.pathname,
          bodySha256: sha256(forwardedBody),
          ...requestMetadata,
        },
        response: { status: 502, transportError: error?.name ?? "Error" },
        retry: {
          attempt,
          maxAttempts,
          terminal: true,
          retryable: false,
          retryDelayMs: 0,
        },
      });
      response.writeHead(502, { "content-type": "application/json" });
      response.end(
        JSON.stringify({ error: { code: "nan_proxy_upstream_error" } }),
      );
      return;
    }

    // 2xx success – stream response body and write evidence.
    if (upstreamResponse.status >= 200 && upstreamResponse.status < 300) {
      const responseHeaders = {};
      upstreamResponse.headers.forEach((value, name) => {
        if (
          ![/^content-length$/iu, /^content-encoding$/iu].some((p) =>
            p.test(name),
          )
        ) {
          responseHeaders[name] = value;
        }
      });
      response.writeHead(upstreamResponse.status, responseHeaders);

      const responseHash = createHash("sha256");
      const metadataChunks = [];
      let metadataBytes = 0;
      if (upstreamResponse.body) {
        for await (const chunk of Readable.fromWeb(upstreamResponse.body)) {
          const bytes = Buffer.from(chunk);
          responseHash.update(bytes);
          if (metadataBytes < 4 * 1024 * 1024) {
            metadataChunks.push(bytes);
            metadataBytes += bytes.length;
          }
          response.write(bytes);
        }
      }
      const metadata = collectResponseMetadata(Buffer.concat(metadataChunks));
      const responseRequestIds = {};
      for (const name of ["x-request-id", "request-id", "cf-ray"]) {
        const value = upstreamResponse.headers.get(name);
        if (value) responseRequestIds[name] = value;
      }

      await writeEvidence({
        schemaVersion: 1,
        evidenceClass: "provider-observed",
        repositoryId,
        contractHash,
        requestId,
        observedAt,
        keyFingerprint: bearerFingerprint(authorization),
        request: {
          method: request.method,
          path: target.pathname,
          bodySha256: sha256(forwardedBody),
          ...requestMetadata,
        },
        response: {
          status: upstreamResponse.status,
          id: metadata.id,
          model: metadata.model,
          usage: normalizedUsage(metadata.usage),
          bodySha256: responseHash.digest("hex"),
          requestIds: responseRequestIds,
        },
        retry: {
          attempt,
          maxAttempts,
          terminal: true,
          retryable: false,
          retryDelayMs: 0,
        },
      });
      response.end();
      return;
    }

    // Non-2xx – drain error body (limited to 4 KB) and decide whether to retry.
    const errorBody = await readBoundedBody(upstreamResponse.body, 4 * 1024);
    const errorInfo = parseErrorBody(errorBody);

    const retryable = isRetryableError(errorInfo.code, upstreamResponse.status);
    const terminal = !retryable || attempt === maxAttempts;

    let retryDelayMs = 0;
    if (retryable && !terminal) {
      const retryAfterMs = parseRetryAfter(
        upstreamResponse.headers.get("retry-after"),
      );
      retryDelayMs = retryDelayMsFor(attempt, retryAfterMs);
    }

    // Sanitized error: code, type, param but never message or prompt.
    const sanitizedError =
      errorInfo.code !== null ||
      errorInfo.type !== null ||
      errorInfo.param !== null
        ? { code: errorInfo.code, type: errorInfo.type, param: errorInfo.param }
        : undefined;

    await writeEvidence({
      schemaVersion: 1,
      evidenceClass: "provider-observed",
      repositoryId,
      contractHash,
      requestId,
      observedAt,
      keyFingerprint: bearerFingerprint(authorization),
      request: {
        method: request.method,
        path: target.pathname,
        bodySha256: sha256(forwardedBody),
        ...requestMetadata,
      },
      response: { status: upstreamResponse.status },
      retry: {
        attempt,
        maxAttempts,
        terminal,
        retryable,
        retryDelayMs,
        error: sanitizedError,
      },
    });

    if (terminal) {
      response.writeHead(upstreamResponse.status, {
        "content-type": "application/json",
      });
      response.end(errorBody);
      return;
    }

    // Wait before next attempt.
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  process.stdout.write(
    `${JSON.stringify({ ready: true, port: address.port, pid: process.pid })}\n`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
