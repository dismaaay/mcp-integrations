# mcp-sqlite-safe

A **read-only** Model Context Protocol (MCP) server for SQLite. Point it at a database and let
Claude (or Cursor) explore and query your data in natural language — **without any ability to
modify it**.

This is the pattern most businesses actually want: *"let the AI answer questions about our data,
but never let it touch the data."*

## Why it's safe (defense in depth)

1. **Read-only connection** — the database is opened with `readOnly: true`; the SQLite engine itself
   rejects any write at the C level.
2. **SELECT-only guard** — `assertReadOnlySql()` statically rejects anything that isn't a single
   `SELECT` / `WITH…SELECT`: blocks `INSERT/UPDATE/DELETE/DROP/ALTER/PRAGMA/ATTACH…`, stacked
   statements (`SELECT 1; DROP …`), and write verbs hidden inside comments.
3. **Enforced row cap** — every query is wrapped with a `LIMIT` (max 1000) so a careless model can't
   pull an entire table.

These are independently tested — see `src/db.test.ts` (8 passing tests including SQL-injection attempts).

## Tools

| Tool | What it does |
| --- | --- |
| `list_tables` | List the tables in the database. |
| `describe_table` | Columns, types and keys for a table. |
| `run_query` | Run one read-only `SELECT` (writes rejected, results capped). |

## Quick start

```bash
npm install
npm run build
npm run seed          # creates demo.db (customers + orders)
npm test              # 8 tests incl. injection rejection
node --experimental-sqlite smoke-test.mjs   # full MCP handshake
```

## Use it in Claude Desktop

```json
{
  "mcpServers": {
    "my-db": {
      "command": "node",
      "args": ["--experimental-sqlite", "/ABSOLUTE/PATH/TO/mcp-sqlite/dist/index.js"],
      "env": { "SQLITE_DB_PATH": "/ABSOLUTE/PATH/TO/your.db" }
    }
  }
}
```

Then ask: *"Which customers paid the most? Show me the top 5 by total paid amount."*

## License

MIT.

---

*Built as a demo of safe database access over MCP. Want this for **your** Postgres/MySQL/SQLite —
with row-level access control and audit logging? That's the productized version.*
