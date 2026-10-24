/**
 * Client for the public Unified Reading API (https://unifiedreading.com/docs).
 * No API key; send only birth dates, never names, birth times or places.
 */

export const DEFAULT_BASE_URL = "https://unifiedreading.com";

export class UnifiedReadingError extends Error {
  constructor({ status, code, message, hint, docs, retryAfter }) {
    super(message);
    this.name = "UnifiedReadingError";
    this.status = status;
    this.code = code;
    this.hint = hint;
    this.docs = docs;
    this.retryAfter = retryAfter;
  }
}

export class UnifiedReading {
  /**
   * @param {{ baseUrl?: string, fetch?: typeof fetch, userAgent?: string }} [options]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetch = options.fetch ?? globalThis.fetch;
    this.userAgent = options.userAgent ?? "unified-reading-js/0.3.0";
    if (typeof this.fetch !== "function") throw new Error("No fetch available; pass options.fetch (Node 18+ has one built in).");
  }

  async request(path, init = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Accept: "application/json", "User-Agent": this.userAgent, ...init.headers },
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      // A non-JSON body is reported as an error below.
    }
    if (!response.ok || body === null) {
      const error = body?.error ?? {};
      const retryAfter = response.headers.get("retry-after");
      throw new UnifiedReadingError({
        status: response.status,
        code: error.code ?? "unexpected_response",
        message: error.message ?? `Unexpected ${response.status} response from ${path}`,
        hint: error.hint,
        docs: error.docs ?? `${DEFAULT_BASE_URL}/docs`,
        retryAfter: retryAfter === null ? undefined : Number(retryAfter),
      });
    }
    return body;
  }

  /** Life Path number, Sun sign and Chinese zodiac animal for one YYYY-MM-DD date. */
  profile(date) {
    return this.request(`/api/v1/profile?date=${encodeURIComponent(toDateString(date))}`);
  }

  /** The same profile for up to 20 dates; a bad date fails only its own item. */
  async profiles(dates, options = {}) {
    const headers = { "Content-Type": "application/json" };
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    const body = await this.request("/api/v1/profiles/batch", {
      method: "POST",
      headers,
      body: JSON.stringify({ dates: dates.map(toDateString) }),
    });
    return body.results;
  }

  /** One page of the Chinese zodiac year table (1924-2044). */
  chineseZodiacYears(options = {}) {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set("limit", String(options.limit));
    if (options.cursor !== undefined && options.cursor !== null) params.set("cursor", String(options.cursor));
    const query = params.toString();
    return this.request(`/api/v1/chinese-zodiac/years${query ? `?${query}` : ""}`);
  }

  /** Every year in the table, following next_cursor page by page. */
  async *allChineseZodiacYears(options = {}) {
    let cursor = options.cursor;
    do {
      const page = await this.chineseZodiacYears({ limit: options.limit ?? 60, cursor });
      yield* page.data;
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }

  /** One zodiac year, or null outside 1924-2044. */
  async chineseZodiacYear(year) {
    try {
      const page = await this.chineseZodiacYears({ limit: 1, cursor: year });
      return page.data[0] ?? null;
    } catch (error) {
      if (error instanceof UnifiedReadingError && error.code === "invalid_cursor") return null;
      throw error;
    }
  }
}

/** Accepts "YYYY-MM-DD" or a Date (its local calendar date). */
export function toDateString(date) {
  if (typeof date === "string") return date;
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  throw new TypeError("date must be a YYYY-MM-DD string or a valid Date");
}
