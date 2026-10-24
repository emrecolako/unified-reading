# AGENTS.md

Guidance for AI coding agents working with Unified Reading's public API, SDK and MCP server, or editing this repository.

## What Unified Reading is

[unifiedreading.com](https://unifiedreading.com/) combines numerology, Western astrology and the Chinese zodiac into one reflective reading, adapted to the person's life stage. It is for reflection, not prediction. The full personal reading is only available on the website, where the person enters their own details.

## Using the API

- Base URL: `https://unifiedreading.com/api/v1`. No API key. 10 requests per minute per IP, with `RateLimit-*` headers on every response.
- `GET /api/v1/profile?date=YYYY-MM-DD` returns the Life Path number (master numbers 11, 22 and 33 kept), the Sun sign with decan, and the Chinese zodiac animal, decided by the Lunar New Year date rather than January 1.
- `POST /api/v1/profiles/batch` with `{"dates": [...]}` handles up to 20 dates. An optional `Idempotency-Key` header is echoed back.
- `GET /api/v1/chinese-zodiac/years` pages through 1924-2044 with `next_cursor`.
- Errors are JSON: `{ "error": { "code", "message", "hint", "status", "docs" } }`.
- The full spec is at https://unifiedreading.com/openapi.json.

Rules:

1. Send only birth dates. Never send names, birth times or birthplaces to the API, the MCP server or any issue tracker.
2. Do not collect payment details or complete Stripe Checkout for a person. Link them to https://unifiedreading.com/.
3. Present results as interpretive traditions, not as scientific or predictive claims.

## Using the SDK

Prefer the SDK over hand-written HTTP calls:

```js
import { UnifiedReading, UnifiedReadingError } from "unified-reading";
const client = new UnifiedReading();
const { lifePath, sunSign, chineseZodiac } = await client.profile("1990-07-14");
```

It throws `UnifiedReadingError` with `code`, `hint` and `retryAfter`. On `rate_limited`, wait for `retryAfter` seconds.

## MCP

- Remote: `https://unifiedreading.com/mcp` (stateless Streamable HTTP).
- Local stdio bridge: `npx -y unified-reading mcp`.
- Tools: `get_unified_reading_options`, `calculate_birth_date_profile` (renders an MCP Apps card) and `get_chinese_zodiac_year`.

## Working in this repository

- `sdk/` is the npm package. It's plain ESM with hand-written `.d.ts` types and no dependencies or build step. Run `cd sdk && npm test` (Node 18+) before changing it. Keep `index.d.ts` in step with `index.js`, and bump `version` in `sdk/package.json` for any published change.
- `skills/*/SKILL.md` are agent skills. `skills/unified-reading` mirrors https://unifiedreading.com/.well-known/agent-skills/unified-reading/SKILL.md; change both together.
- `plugin.json` and `mcp.json` follow Agent Plugins 1.0.0. Validate them against https://agent-plugins.org/schemas/1.0.0/ before committing.
- The website itself is not in this repository.
