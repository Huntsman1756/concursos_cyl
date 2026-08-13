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

await mkdir(path.dirname(evidencePath), { recursive: true });

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function bearerFingerprint(header) {
  const match = /^Bearer\s+(.+)$/iu.exec(header ?? "");
  return match ? sha256(match[1]).slice(0, 16) : null;
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
  const observedAt = new Date().toISOString();
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
  let upstreamResponse;
  try {
    upstreamResponse = await fetch(target, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : requestBody,
      redirect: "manual",
    });
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" });
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
        bodySha256: sha256(requestBody),
        ...requestMetadata,
      },
      response: { status: 502, transportError: error?.name ?? "Error" },
    });
    response.end(
      JSON.stringify({ error: { code: "nan_proxy_upstream_error" } }),
    );
    return;
  }

  const responseHeaders = {};
  upstreamResponse.headers.forEach((value, name) => {
    if (
      ![/^content-length$/iu, /^content-encoding$/iu].some((p) => p.test(name))
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
      bodySha256: sha256(requestBody),
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
  });
  response.end();
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
