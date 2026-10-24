#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { UnifiedReading, UnifiedReadingError } from "../index.js";
import { DEFAULT_MCP_ENDPOINT, runStdioBridge } from "../mcp.js";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const HELP = `unified-reading ${version}: numerology and astrology facts from a birth date

Usage
  unified-reading profile <YYYY-MM-DD>        Life Path, Sun sign and Chinese zodiac
  unified-reading batch <YYYY-MM-DD>...       The same for up to 20 dates
  unified-reading year <YYYY>                 Chinese zodiac year and its Lunar New Year dates
  unified-reading years [--limit N] [--cursor YYYY] [--all]
                                              Page through the 1924-2044 year table
  unified-reading mcp                         Run as a stdio MCP server (bridges to
                                              https://unifiedreading.com/mcp)

Options
  --json             Print the raw API response
  --base-url <url>   API origin (default https://unifiedreading.com)
  -h, --help         Show this help
  -v, --version      Show the version

Send only birth dates: never names, birth times or places. The combined
personal reading is at https://unifiedreading.com/. API docs: https://unifiedreading.com/docs`;

function parseArgs(argv) {
  const flags = { json: false, all: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") flags.json = true;
    else if (arg === "--all") flags.all = true;
    else if (arg === "-h" || arg === "--help") flags.help = true;
    else if (arg === "-v" || arg === "--version") flags.version = true;
    else if (arg === "--limit" || arg === "--cursor" || arg === "--base-url") {
      const value = argv[++i];
      if (value === undefined) throw new UsageError(`${arg} needs a value`);
      flags[arg.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = value;
    } else if (arg.startsWith("-")) throw new UsageError(`Unknown option ${arg}`);
    else positional.push(arg);
  }
  return { flags, command: positional[0], args: positional.slice(1) };
}

class UsageError extends Error {}

const profileLines = (p) => [
  `Life Path   ${p.lifePath.number}  ${p.lifePath.title}`,
  `Sun sign    ${p.sunSign.glyph} ${p.sunSign.sign}, decan ${p.sunSign.decan} (${p.sunSign.element}, ${p.sunSign.modality}, ruled by ${p.sunSign.rulingPlanet})`,
  `Chinese     ${p.chineseZodiac.yinYang} ${p.chineseZodiac.element} ${p.chineseZodiac.animal}`,
];
const yearLine = (y) => `${y.year}  ${y.yinYang} ${y.element} ${y.animal}`.padEnd(30) + `${y.starts} to ${y.ends ?? "(end of table)"}`;

export async function main(argv, { out = console.log, client: injected } = {}) {
  const { flags, command, args } = parseArgs(argv);
  if (flags.version) return out(version);
  if (flags.help || !command) return out(HELP);
  const client = injected ?? new UnifiedReading({ baseUrl: flags.baseUrl, userAgent: `unified-reading-cli/${version}` });
  const print = (value, lines) => out(flags.json ? JSON.stringify(value, null, 2) : lines.join("\n"));

  switch (command) {
    case "profile": {
      if (args.length !== 1) throw new UsageError("profile takes one date, e.g. unified-reading profile 1990-07-14");
      const profile = await client.profile(args[0]);
      return print(profile, [profile.date, ...profileLines(profile), "", `Full reading: ${profile.fullReading}`]);
    }
    case "batch": {
      if (args.length === 0) throw new UsageError("batch takes one or more dates");
      const results = await client.profiles(args);
      return print(results, results.flatMap((r) => r.ok ? [r.profile.date, ...profileLines(r.profile).map((l) => `  ${l}`)] : [`${r.date}  ERROR: ${r.error.message}`]));
    }
    case "year": {
      if (args.length !== 1 || !/^\d{4}$/.test(args[0])) throw new UsageError("year takes a four-digit year from 1924 to 2044");
      const year = await client.chineseZodiacYear(Number(args[0]));
      if (!year) throw new UsageError(`${args[0]} is outside the 1924-2044 table`);
      return print(year, [yearLine(year), `Guide: ${year.guide}`]);
    }
    case "years": {
      const limit = flags.limit === undefined ? undefined : Number(flags.limit);
      if (flags.all) {
        const years = [];
        for await (const year of client.allChineseZodiacYears({ cursor: flags.cursor })) years.push(year);
        return print(years, years.map(yearLine));
      }
      const page = await client.chineseZodiacYears({ limit, cursor: flags.cursor });
      return print(page, [...page.data.map(yearLine), ...(page.has_more ? ["", `More: --cursor ${page.next_cursor}`] : [])]);
    }
    case "mcp":
      // stdout carries only JSON-RPC from here on.
      return runStdioBridge({ endpoint: flags.baseUrl ? `${flags.baseUrl.replace(/\/+$/, "")}/mcp` : DEFAULT_MCP_ENDPOINT, userAgent: `unified-reading-mcp-stdio/${version}` });
    default:
      throw new UsageError(`Unknown command ${command}. Run unified-reading --help.`);
  }
}

// Run only as the bin (npm links it, hence realpath), not when imported by the tests.
const isBin = (() => {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (isBin) {
  main(process.argv.slice(2)).catch((error) => {
    // TypeError: the SDK rejected an argument before sending it.
    if (error instanceof UsageError || error instanceof TypeError) {
      console.error(`ERROR: ${error.message}`);
      process.exit(2);
    }
    if (error instanceof UnifiedReadingError) {
      console.error(`ERROR: ${error.message}${error.hint ? `\n${error.hint}` : ""}`);
      process.exit(1);
    }
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
