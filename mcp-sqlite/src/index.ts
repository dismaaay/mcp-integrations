#!/usr/bin/env node
/**
 * mcp-sqlite-safe — a read-only Model Context Protocol server for SQLite.
 *
 * Lets an MCP client (Claude Desktop, Cursor, Claude Code) explore and query a
 * SQLite database WITHOUT any ability to modify it. The database path is taken
 * from the SQLITE_DB_PATH env var (or ./demo.db for the bundled demo).
 *
 * Launch with the node SQLite flag:
 *   node --experimental-sqlite dist/index.js
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ReadOnlyDb, UnsafeQueryError, MAX_ROWS } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_DB_PATH ?? join(here, "..", "demo.db");

const db = new ReadOnlyDb(dbPath);

const server = new McpServer({ name: "mcp-sqlite-safe", version: "1.0.0" });

function asTable(rows: any[]): string {
  if (rows.length === 0) return "(no rows)";
  const cols = Object.keys(rows[0]);
  const header = cols.join(" | ");
  const sep = cols.map(() => "---").join(" | ");
  const body = rows
    .map((r) => cols.map((c) => String(r[c] ?? "")).join(" | "))
    .join("\n");
  return `${header}\n${sep}\n${body}`;
}

server.registerTool(
  "list_tables",
  {
    title: "List tables",
    description: "List all tables in the connected SQLite database.",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: db.listTables().join("\n") || "(no tables)" }],
  }),
);

server.registerTool(
  "describe_table",
  {
    title: "Describe a table",
    description: "Show the columns, types and keys of a table.",
    inputSchema: { table: z.string().describe("Table name.") },
  },
  async ({ table }) => {
    try {
      const cols = db.describeTable(table);
      const text = cols
        .map(
          (c) =>
            `${c.name} ${c.type}${c.primaryKey ? " PRIMARY KEY" : ""}${c.notNull ? " NOT NULL" : ""}`,
        )
        .join("\n");
      return { content: [{ type: "text", text }] };
    } catch (e) {
      return { content: [{ type: "text", text: String((e as Error).message) }], isError: true };
    }
  },
);

server.registerTool(
  "run_query",
  {
    title: "Run a read-only SQL query",
    description:
      `Run a single read-only SELECT query against the database. ` +
      `Writes are rejected. Results are capped at ${MAX_ROWS} rows.`,
    inputSchema: {
      sql: z.string().describe("A single SELECT (or WITH…SELECT) statement."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_ROWS)
        .default(100)
        .describe(`Max rows to return (1–${MAX_ROWS}).`),
    },
  },
  async ({ sql, limit }) => {
    try {
      const { rows, truncated } = db.query(sql, limit);
      const note = truncated ? `\n\n(truncated to ${limit} rows)` : "";
      return { content: [{ type: "text", text: asTable(rows) + note }] };
    } catch (e) {
      const msg =
        e instanceof UnsafeQueryError
          ? `Rejected: ${e.message}`
          : `Query error: ${(e as Error).message}`;
      return { content: [{ type: "text", text: msg }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`mcp-sqlite-safe running on stdio (db: ${dbPath}, read-only)`);
}

main().catch((err) => {
  console.error("Fatal error starting mcp-sqlite-safe:", err);
  process.exit(1);
});
