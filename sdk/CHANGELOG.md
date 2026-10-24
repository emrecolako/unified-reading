# Changelog

## 0.3.1 (2026-10-24)

- Arguments are checked before any request is sent. A wrong type now throws a
  `TypeError` that names the argument, instead of being sent to the API (an
  object `cursor` used to go out as `cursor=[object Object]`):
  - `cursor` must be the `next_cursor` string from a previous page (or
    `null`/omitted). Numbers are no longer accepted; pass `"1990"`, or use
    `chineseZodiacYear(1990)`.
  - `limit` must be a positive integer.
  - dates must be `YYYY-MM-DD` strings or valid `Date`s. Whether a well-formed
    date is real (and not in the future) is still checked by the API.
  - `profiles()` takes an array of 1 to 20 dates; `idempotencyKey` must be a
    string of 1-255 visible ASCII characters.
  - `chineseZodiacYear()` takes an integer year.
- The CLI reports these errors as usage errors (exit code 2).
- `homepage` is now https://unifiedreading.com.

## 0.3.0

- SDK, CLI and stdio MCP server for the Unified Reading API.
