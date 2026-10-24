# unified-reading

SDK, CLI and stdio MCP server for the public [Unified Reading API](https://unifiedreading.com/docs). Give it a birth date and it returns the Life Path number, the Western Sun sign and the Chinese zodiac animal. It also covers the 1924-2044 Lunar New Year table. There is no API key and nothing is stored.

Send only birth dates, never names, birth times or places. The combined personal reading is at [unifiedreading.com](https://unifiedreading.com/).

## CLI

```bash
npx unified-reading profile 1990-07-14
```

```
1990-07-14
Life Path   4  The Builder
Sun sign    ♋ Cancer, decan 3 (Water, Cardinal, ruled by Moon)
Chinese     Yang Metal Horse
```

| Command | What it does |
| --- | --- |
| `unified-reading profile <YYYY-MM-DD>` | Life Path, Sun sign and Chinese zodiac for one date |
| `unified-reading batch <YYYY-MM-DD>...` | The same for up to 20 dates |
| `unified-reading year <YYYY>` | A Chinese zodiac year and its Lunar New Year start and end |
| `unified-reading years [--limit N] [--cursor YYYY] [--all]` | Page through the year table |
| `unified-reading mcp` | Run as a stdio MCP server |

Add `--json` to any command for the raw API response. `--base-url` points the CLI at another origin.

## MCP server

`unified-reading mcp` runs a stdio MCP server that forwards to the remote server at `https://unifiedreading.com/mcp`. It is for MCP clients that only launch local commands:

```json
{ "mcpServers": { "unified-reading": { "command": "npx", "args": ["-y", "unified-reading", "mcp"] } } }
```

The server has tools for reading options, the birth date profile (with an MCP Apps card) and Chinese zodiac years. It is listed in the [official MCP registry](https://registry.modelcontextprotocol.io/v0/servers/com.unifiedreading%2Funified-reading/versions/latest) as `com.unifiedreading/unified-reading`.

## SDK

Needs Node 18 or later, or any runtime with `fetch`.

```js
import { UnifiedReading, UnifiedReadingError } from "unified-reading";

const client = new UnifiedReading();

const profile = await client.profile("1990-07-14");
console.log(profile.lifePath.number, profile.sunSign.sign, profile.chineseZodiac.animal); // 4 Cancer Horse

const results = await client.profiles(["1990-07-14", "1990-01-20"], { idempotencyKey: crypto.randomUUID() });

for await (const year of client.allChineseZodiacYears()) {
  console.log(year.year, year.animal, year.starts, year.ends);
}

try {
  await client.profile("1990-02-30");
} catch (error) {
  if (error instanceof UnifiedReadingError) console.log(error.code, error.hint); // invalid_date ...
}
```

| Method | Endpoint |
| --- | --- |
| `profile(date)` | `GET /api/v1/profile?date=` |
| `profiles(dates, { idempotencyKey })` | `POST /api/v1/profiles/batch` |
| `chineseZodiacYears({ limit, cursor })` | `GET /api/v1/chinese-zodiac/years` (one page) |
| `allChineseZodiacYears()` | Every page, as an async iterator |
| `chineseZodiacYear(year)` | One year, or `null` outside 1924-2044 |

Dates can be `YYYY-MM-DD` strings or `Date` objects; a `Date` is sent as its local calendar date. Errors throw `UnifiedReadingError`, which carries `status`, `code`, `hint` and `retryAfter`. The API allows 10 requests per minute per IP.

## Links

- API guide: https://unifiedreading.com/docs
- OpenAPI spec: https://unifiedreading.com/openapi.json
- MCP server (same calculations for AI agents): https://unifiedreading.com/mcp
- Source: https://github.com/emrecolako/unified-reading/tree/main/sdk
- Bug reports: https://github.com/emrecolako/unified-reading/issues (no personal data), or hello@unifiedreading.com
