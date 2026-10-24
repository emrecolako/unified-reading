export declare const DEFAULT_BASE_URL: "https://unifiedreading.com";

export type ErrorCode =
  | "invalid_date"
  | "invalid_body"
  | "invalid_cursor"
  | "invalid_idempotency_key"
  | "missing_parameter"
  | "not_found"
  | "method_not_allowed"
  | "rate_limited"
  | "unexpected_response";

export declare class UnifiedReadingError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly hint?: string;
  readonly docs: string;
  /** Seconds to wait, set on 429 responses. */
  readonly retryAfter?: number;
}

export type LifePathNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;
export type WesternElement = "Fire" | "Earth" | "Air" | "Water";
export type ChineseElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";
export type ChineseAnimal = "Rat" | "Ox" | "Tiger" | "Rabbit" | "Dragon" | "Snake" | "Horse" | "Goat" | "Monkey" | "Rooster" | "Dog" | "Pig";

export interface Profile {
  date: string;
  lifePath: { number: LifePathNumber; title: string; brief: string; keywords: string[]; guide: string };
  sunSign: { sign: string; glyph: string; decan: 1 | 2 | 3; element: WesternElement; modality: "Cardinal" | "Fixed" | "Mutable"; rulingPlanet: string; guide: string };
  chineseZodiac: { animal: ChineseAnimal; element: ChineseElement; yinYang: "Yin" | "Yang"; bestWith: string[]; guide: string };
  notes: string[];
  fullReading: string;
}

export type BatchResult =
  | { date: string; ok: true; profile: Profile }
  | { date: string | null; ok: false; error: { code: "invalid_date"; message: string } };

export interface ZodiacYear {
  year: number;
  animal: ChineseAnimal;
  element: ChineseElement;
  yinYang: "Yin" | "Yang";
  /** Lunar New Year, YYYY-MM-DD. */
  starts: string;
  /** The day before the next Lunar New Year; null for 2044. */
  ends: string | null;
  guide: string;
}

export interface YearPage {
  data: ZodiacYear[];
  has_more: boolean;
  next_cursor: string | null;
  next: string | null;
  total: number;
}

export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  userAgent?: string;
}

export declare class UnifiedReading {
  constructor(options?: ClientOptions);
  readonly baseUrl: string;
  /** @throws TypeError when date is not a YYYY-MM-DD string or a valid Date. */
  profile(date: string | Date): Promise<Profile>;
  /** @throws TypeError unless dates is an array of 1-20 YYYY-MM-DD strings or Dates. */
  profiles(dates: Array<string | Date>, options?: { idempotencyKey?: string }): Promise<BatchResult[]>;
  /** @throws TypeError when limit is not a positive integer or cursor is not a string. */
  chineseZodiacYears(options?: { limit?: number; cursor?: string | null }): Promise<YearPage>;
  allChineseZodiacYears(options?: { limit?: number; cursor?: string | null }): AsyncGenerator<ZodiacYear, void, unknown>;
  chineseZodiacYear(year: number): Promise<ZodiacYear | null>;
}

export declare function toDateString(date: string | Date): string;
