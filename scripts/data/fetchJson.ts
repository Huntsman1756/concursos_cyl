export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const RETRY_DELAYS_MS = [250, 750, 1500] as const;

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function fetchJson<T>(
  url: string,
  fetchImpl: FetchLike = fetch,
  sleep: (milliseconds: number) => Promise<void> = defaultSleep,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }
      lastError = error;
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    const responseError = new Error(
      `HTTP ${response.status} while fetching ${url}`,
    );
    if (
      !isRetryableStatus(response.status) ||
      attempt === RETRY_DELAYS_MS.length
    ) {
      throw responseError;
    }
    lastError = responseError;
    await sleep(RETRY_DELAYS_MS[attempt]);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to fetch ${url}`);
}
