# mcp-weather

A small, production-quality **Model Context Protocol (MCP)** server that gives any MCP client
— Claude Desktop, Claude Code, Cursor — live weather data through three tools, backed by the
free, **no-API-key** [Open-Meteo](https://open-meteo.com) service.

This is a portfolio reference implementation: it shows how to wrap *any* third-party REST API as
a clean, typed, well-tested MCP server. The same skeleton wraps your internal API, your CRM, your
database, or your SaaS.

## Tools

| Tool | What it does |
| --- | --- |
| `get_current_weather` | Current conditions for a place by name (temp, feels-like, humidity, wind, sky). |
| `get_forecast` | 1–16 day daily forecast (min/max, conditions, precipitation). |
| `geocode_location` | Resolve a place name to lat/lon, country and timezone. |

## Quick start

```bash
npm install
npm run build
npm test          # unit + live-API tests
node smoke-test.mjs   # full MCP handshake end-to-end
```

## Use it in Claude Desktop

Add this to your `claude_desktop_config.json`
(`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/mcp-weather/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop, then ask: *"What's the weather in Kraków right now, and the 3-day forecast for Zakopane?"*

## Design notes

- **Testable core.** All HTTP/business logic lives in `src/weather.ts` with zero MCP imports, so it
  unit-tests in isolation. `src/index.ts` is only the MCP transport wiring.
- **Typed I/O.** Tool inputs are validated with `zod`; clamping and friendly errors keep the model from
  sending malformed calls.
- **Protocol-safe logging.** All diagnostics go to `stderr`; `stdout` is reserved for the MCP stream.
- **Timeouts + clear errors.** Network calls abort after 10s with actionable messages.

## License

MIT — use it as a starting point for your own integrations.

---

*Built as a demo of MCP server development. Need Claude/Cursor connected to **your** API or database?
This is exactly that, productized.*
