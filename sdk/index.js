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
    this.userAgent = options.userAgent ?? "unified-reading-js/0.3.1";
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
  async profile(date) {
    return this.request(`/api/v1/profile?date=${encodeURIComponent(toDateString(date))}`);
  }

  /**
   * The same profile for up to 20 dates. Each date must be shaped YYYY-MM-DD;
   * one that is not a real date up to today fails only its own item.
   */
  async profiles(dates, options = {}) {
    if (!Array.isArray(dates) || dates.length < 1 || dates.length > MAX_BATCH) {
      throw new TypeError(`dates must be an array of 1 to ${MAX_BATCH} YYYY-MM-DD strings or Dates`);
    }
    const body = dates.map(toDateString);
    const headers = { "Content-Type": "application/json" };
    if (options.idempotencyKey !== undefined) {
      if (typeof options.idempotencyKey !== "string" || !/^[\x21-\x7e]{1,255}$/.test(options.idempotencyKey)) {
        throw new TypeError("idempotencyKey must be a string of 1-255 visible ASCII characters");
      }
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    const response = await this.request("/api/v1/profiles/batch", {
      method: "POST",
      headers,
      body: JSON.stringify({ dates: body }),
    });
    return response.results;
  }

  /** One page of the Chinese zodiac year table (1924-2044). */
  async chineseZodiacYears(options = {}) {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set("limit", String(checkLimit(options.limit)));
    if (options.cursor !== undefined && options.cursor !== null) params.set("cursor", checkCursor(options.cursor));
    const query = params.toString();
    return this.request(`/api/v1/chinese-zodiac/years${query ? `?${query}` : ""}`);
  }

  /** Every year in the table, following next_cursor page by page. */
  async *allChineseZodiacYears(options = {}) {
    let cursor = options.cursor === undefined || options.cursor === null ? null : checkCursor(options.cursor);
    do {
      const page = await this.chineseZodiacYears({ limit: options.limit ?? 60, cursor });
      yield* page.data;
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }

  /** One zodiac year, or null outside 1924-2044. */
  async chineseZodiacYear(year) {
    if (!Number.isInteger(year)) throw new TypeError(`year must be an integer, got ${describe(year)}`);
    try {
      const page = await this.chineseZodiacYears({ limit: 1, cursor: String(year) });
      return page.data[0] ?? null;
    } catch (error) {
      if (error instanceof UnifiedReadingError && error.code === "invalid_cursor") return null;
      throw error;
    }
  }
}

const MAX_BATCH = 20;

/** Short type description for error messages; never echoes the value itself. */
const describe = (value) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);

/** limit must be a positive integer; the API caps it at 60. */
function checkLimit(limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError(`limit must be a positive integer, got ${typeof limit === "number" ? limit : describe(limit)}`);
  return limit;
}

/** cursor is the opaque next_cursor string from a previous page. */
function checkCursor(cursor) {
  if (typeof cursor !== "string" || cursor === "") throw new TypeError(`cursor must be the next_cursor string from a previous page, got ${describe(cursor)}`);
  return cursor;
}

/**
 * Accepts "YYYY-MM-DD" or a Date (its local calendar date). Checks the shape
 * only; whether it is a real date up to today is the API's call.
 */
export function toDateString(date) {
  if (typeof date === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError("date must be a YYYY-MM-DD string or a valid Date");
    return date;
  }
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  throw new TypeError("date must be a YYYY-MM-DD string or a valid Date");
}
