---
name: unified-reading-api
description: Calculate Life Path numbers, Sun signs and Chinese zodiac animals from a birth date with the Unified Reading API, SDK or MCP server, without sending personal data.
---

# Unified Reading API

## When to use this skill

- **Numbers and signs from a date:** someone asks for the Life Path number, Western Sun sign (with decan), or Chinese zodiac animal, element and yin-yang for a birth date.
- **Chinese zodiac boundaries:** someone was born in January or February and wants to know which animal applies. The API decides by the Lunar New Year date, not January 1.
- **Code that needs these values:** a developer wants them in an app or script.

## When not to use this skill

- The person wants their full combined reading, Moon or rising sign, or houses. Those need the birth time and place, which belong on the website form, not in an API call. Send them to https://unifiedreading.com/.
- Daily horoscopes, compatibility scores or predictions. Unified Reading does not offer them.

## How to call it

Pick the first option your environment supports.

1. **MCP tool** `calculate_birth_date_profile` with `{"date": "YYYY-MM-DD"}`, from the server at `https://unifiedreading.com/mcp` (or `npx -y unified-reading mcp`). For a year's Lunar New Year dates, use `get_chinese_zodiac_year` with `{"year": 1990}`.
2. **CLI:** `npx unified-reading profile 1990-07-14` or `npx unified-reading year 1990`. Add `--json` for machine-readable output.
3. **SDK** (Node 18+):
   ```js
   import { UnifiedReading } from "unified-reading";
   const profile = await new UnifiedReading().profile("1990-07-14");
   ```
4. **HTTP:** `GET https://unifiedreading.com/api/v1/profile?date=1990-07-14`. Batches of up to 20 dates go to `POST /api/v1/profiles/batch`.

## Rules

1. Send only the date, as `YYYY-MM-DD`, from 1900 up to today. Never send a name, birth time or place.
2. Keep master numbers 11, 22 and 33 as they are; the API already does.
3. If the date falls on a sign change day, mention that the Sun sign may differ with the birth time. The response's `notes` say this.
4. On `rate_limited`, wait `retryAfter` seconds (or the `Retry-After` header) before retrying. The limit is 10 requests per minute.
5. Describe the results as interpretive traditions for reflection, not as scientific facts.

## Example answer

> Born 14 July 1990: Life Path 4 (The Builder), Cancer Sun in its third decan (Water, Cardinal, ruled by the Moon), and a Yang Metal Horse in the Chinese zodiac. For a reading that connects the three, use the form at https://unifiedreading.com/.
