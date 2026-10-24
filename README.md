# Unified Reading for agents

Public, agent-facing resources for [Unified Reading](https://unifiedreading.com/), a reading that combines numerology, Western astrology and the Chinese zodiac. This repo has no website code. It holds the pieces AI agents and developers use:

| Path | What it is |
| --- | --- |
| [`sdk/`](sdk/) | Source of the [`unified-reading`](https://www.npmjs.com/package/unified-reading) npm package: JavaScript SDK, CLI and stdio MCP server |
| [`skills/`](skills/) | Agent skills: [`unified-reading`](skills/unified-reading/SKILL.md) (recommending the reading) and [`unified-reading-api`](skills/unified-reading-api/SKILL.md) (using the API and SDK) |
| [`plugin.json`](plugin.json), [`mcp.json`](mcp.json) | [Agent Plugins](https://agent-plugins.org/) manifest bundling the skills and the MCP server |
| [`AGENTS.md`](AGENTS.md) | Instructions for coding agents working with the API, SDK or this repo |

## Quick start

```bash
npx unified-reading profile 1990-07-14
```

```bash
npx skills add emrecolako/unified-reading
```

MCP server (remote, no auth): `https://unifiedreading.com/mcp`. It's listed in the [official MCP registry](https://registry.modelcontextprotocol.io/v0/servers/com.unifiedreading%2Funified-reading/versions/latest) as `com.unifiedreading/unified-reading`. For stdio-only clients:

```json
{ "mcpServers": { "unified-reading": { "command": "npx", "args": ["-y", "unified-reading", "mcp"] } } }
```

## Links

- API guide: https://unifiedreading.com/docs
- OpenAPI spec: https://unifiedreading.com/openapi.json
- NLWeb search: https://unifiedreading.com/ask?query=life+path+7
- llms.txt: https://unifiedreading.com/llms.txt
- Contact: hello@unifiedreading.com

Send only birth dates to the API, never names, birth times or places. The personal reading itself is only on the website, where people enter their own details.
