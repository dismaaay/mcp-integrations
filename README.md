# mkdev/integrations — portfolio

A small, **runnable** portfolio for selling AI-integration work: Model Context Protocol (MCP) servers
and disciplined automation. Everything here is built and verified locally — the screenshots in the
landing page show real output from these exact programs.

| Asset | What it proves | Status |
|-------|----------------|--------|
| [`mcp-weather/`](mcp-weather/) | Wrap any REST API as a typed, tested MCP server | ✅ 7 tests + MCP handshake pass |
| [`mcp-sqlite/`](mcp-sqlite/) | Safe, read-only database access for AI (SELECT-only guard) | ✅ 8 tests incl. injection rejection |
| [`public-scraper/`](public-scraper/) | Polite, resilient public-data scraping | ✅ runs against live sandbox |
| [`site/`](site/) | Landing page that sells the above | ✅ responsive, verified in browser |
| [`SELLING.md`](SELLING.md) | Profile, gigs, proposals, pricing, legal filter | — |

## Run everything

```bash
# MCP weather server
cd mcp-weather && npm install && npm run build && npm test && node smoke-test.mjs

# Safe SQLite MCP server
cd ../mcp-sqlite && npm install && npm run build && npm run seed && npm test

# Public-data scraper
cd ../public-scraper && uv run scraper.py --max-pages 3

# Landing page
open site/index.html
```

## The honest part

These are the assets. They don't earn money by sitting in a repo — they earn money when a real person
(you) puts them in front of a real client, passes KYC, and ships the first gig. The full go-to-market
is in [`SELLING.md`](SELLING.md). The strategy and legal guardrails come from a multi-model Fusion
analysis saved under `~/.claude/fusion-runs/`.

## License

MIT.
