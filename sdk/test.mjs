import assert from "node:assert/strict";
import { test } from "node:test";
import { UnifiedReading, UnifiedReadingError, toDateString } from "./index.js";
import { main } from "./bin/cli.js";

/** A fetch stub that records calls and answers from a route table. */
function stub(routes) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    const { pathname, search } = new URL(url);
    const reply = routes[`${init.method ?? "GET"} ${pathname}${search}`] ?? routes[`${init.method ?? "GET"} ${pathname}`];
    if (!reply) return new Response(JSON.stringify({ error: { code: "not_found", message: "nope", docs: "d" } }), { status: 404 });
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: reply.headers });
  };
  return { fetch, calls };
}

const PROFILE = {
  date: "1990-07-14",
  lifePath: { number: 4, title: "The Builder", brief: "", keywords: [], guide: "g" },
  sunSign: { sign: "Cancer", glyph: "♋", decan: 3, element: "Water", modality: "Cardinal", rulingPlanet: "Moon", guide: "g" },
  chineseZodiac: { animal: "Horse", element: "Metal", yinYang: "Yang", bestWith: [], guide: "g" },
  notes: [],
  fullReading: "https://unifiedreading.com/#details",
};
const year = (y) => ({ year: y, animal: "Rat", element: "Wood", yinYang: "Yang", starts: `${y}-02-01`, ends: `${y + 1}-01-31`, guide: "g" });

test("profile sends the date and returns the body", async () => {
  const { fetch, calls } = stub({ "GET /api/v1/profile?date=1990-07-14": { body: PROFILE } });
  const client = new UnifiedReading({ fetch });
  assert.deepEqual(await client.profile(new Date(1990, 6, 14)), PROFILE);
  assert.equal(calls[0].url, "https://unifiedreading.com/api/v1/profile?date=1990-07-14");
});

test("errors become UnifiedReadingError with code, hint and retryAfter", async () => {
  const { fetch } = stub({ "GET /api/v1/profile?date=bad": { status: 429, headers: { "Retry-After": "42" }, body: { error: { code: "rate_limited", message: "Too many requests.", hint: "Wait.", docs: "d" } } } });
  await assert.rejects(new UnifiedReading({ fetch }).profile("bad"), (error) => {
    assert.ok(error instanceof UnifiedReadingError);
    assert.equal(error.status, 429);
    assert.equal(error.code, "rate_limited");
    assert.equal(error.hint, "Wait.");
    assert.equal(error.retryAfter, 42);
    return true;
  });
});

test("profiles posts the batch with the idempotency key", async () => {
  const { fetch, calls } = stub({ "POST /api/v1/profiles/batch": { body: { results: [{ date: "1990-07-14", ok: true, profile: PROFILE }] } } });
  const results = await new UnifiedReading({ fetch }).profiles(["1990-07-14"], { idempotencyKey: "k-1" });
  assert.equal(results[0].ok, true);
  assert.equal(calls[0].init.headers["Idempotency-Key"], "k-1");
  assert.deepEqual(JSON.parse(calls[0].init.body), { dates: ["1990-07-14"] });
});

test("allChineseZodiacYears follows next_cursor to the end", async () => {
  const { fetch, calls } = stub({
    "GET /api/v1/chinese-zodiac/years?limit=2": { body: { data: [year(1924), year(1925)], has_more: true, next_cursor: "1926", next: "n", total: 3 } },
    "GET /api/v1/chinese-zodiac/years?limit=2&cursor=1926": { body: { data: [year(1926)], has_more: false, next_cursor: null, next: null, total: 3 } },
  });
  const years = [];
  for await (const y of new UnifiedReading({ fetch }).allChineseZodiacYears({ limit: 2 })) years.push(y.year);
  assert.deepEqual(years, [1924, 1925, 1926]);
  assert.equal(calls.length, 2);
});

test("chineseZodiacYear returns null outside the table", async () => {
  const { fetch } = stub({ "GET /api/v1/chinese-zodiac/years?limit=1&cursor=1800": { status: 400, body: { error: { code: "invalid_cursor", message: "x", docs: "d" } } } });
  assert.equal(await new UnifiedReading({ fetch }).chineseZodiacYear(1800), null);
});

test("toDateString pads and rejects bad input", () => {
  assert.equal(toDateString(new Date(2001, 0, 5)), "2001-01-05");
  assert.throws(() => toDateString(new Date("nope")), TypeError);
});

test("CLI prints a readable profile, JSON on request, and help", async () => {
  const client = { profile: async () => PROFILE };
  const lines = [];
  await main(["profile", "1990-07-14"], { client, out: (l) => lines.push(l) });
  assert.match(lines[0], /Life Path {3}4 {2}The Builder/);
  assert.match(lines[0], /Yang Metal Horse/);
  lines.length = 0;
  await main(["profile", "1990-07-14", "--json"], { client, out: (l) => lines.push(l) });
  assert.deepEqual(JSON.parse(lines[0]), PROFILE);
  lines.length = 0;
  await main([], { client, out: (l) => lines.push(l) });
  assert.match(lines[0], /^unified-reading \d+\.\d+\.\d+/);
  await assert.rejects(main(["profile"], { client, out: () => {} }), /profile takes one date/);
  await assert.rejects(main(["nope"], { client, out: () => {} }), /Unknown command/);
});

test("stdio MCP bridge forwards requests, skips notification replies and reports failures", async () => {
  const { PassThrough } = await import("node:stream");
  const { runStdioBridge } = await import("./mcp.js");
  const input = new PassThrough();
  const output = new PassThrough();
  const sent = [];
  const fetch = async (url, init) => {
    sent.push({ url, body: JSON.parse(init.body) });
    const message = JSON.parse(init.body);
    if (message.id === undefined) return new Response(null, { status: 202 });
    if (message.method === "boom") throw new Error("offline");
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { echo: message.method } }));
  };
  const done = runStdioBridge({ input, output, fetch, endpoint: "https://example.test/mcp" });
  input.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');
  input.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
  input.write('{"jsonrpc":"2.0","id":2,"method":"boom"}\n');
  input.write("not json\n");
  input.end();
  await done;
  const replies = output.read().toString().trim().split("\n").map((line) => JSON.parse(line));
  const byId = Object.fromEntries(replies.map((r) => [String(r.id), r]));
  assert.equal(replies.length, 3);
  assert.deepEqual(byId["1"].result, { echo: "tools/list" });
  assert.equal(byId["2"].error.code, -32603);
  assert.equal(byId["null"].error.code, -32700);
  assert.equal(sent.length, 3);
  assert.equal(sent[0].url, "https://example.test/mcp");
});
