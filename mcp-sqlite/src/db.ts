/**
 * Core database logic for the read-only SQLite MCP server.
 *
 * Safety model (defense in depth):
 *   1. The connection is opened read-only — the OS/driver refuses writes.
 *   2. assertReadOnlySql() statically rejects anything that isn't a single
 *      SELECT / WITH…SELECT statement, before it ever reaches the driver.
 *   3. Every query is wrapped with an enforced LIMIT so a careless model
 *      can't pull a million rows.
 *
 * No MCP imports here on purpose — this module is unit-tested on its own.
 */
import { DatabaseSync } from "node:sqlite";

export const MAX_ROWS = 1000;

/** Keywords that must never appear as the leading verb of a query. */
const WRITE_VERBS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "create",
  "replace",
  "truncate",
  "attach",
  "detach",
  "reindex",
  "vacuum",
  "pragma",
];

export class UnsafeQueryError extends Error {}

/**
 * Throws UnsafeQueryError unless `sql` is a single read-only SELECT/CTE query.
 * Returns the cleaned single statement on success.
 */
export function assertReadOnlySql(sqlRaw: string): string {
  if (!sqlRaw || !sqlRaw.trim()) {
    throw new UnsafeQueryError("Query is empty.");
  }
  // Strip line and block comments so they can't hide a second statement.
  const sql = sqlRaw
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .trim();

  // Reject multiple statements (allow a single optional trailing semicolon).
  const withoutTrailing = sql.replace(/;\s*$/, "");
  if (withoutTrailing.includes(";")) {
    throw new UnsafeQueryError("Only a single statement is allowed (no ';').");
  }

  const firstWord = withoutTrailing.split(/[\s(]/, 1)[0].toLowerCase();
  if (firstWord !== "select" && firstWord !== "with") {
    throw new UnsafeQueryError(
      `Only SELECT queries are allowed. This query starts with "${firstWord}".`,
    );
  }

  // Belt-and-braces: forbid write verbs appearing as standalone tokens.
  const lowered = withoutTrailing.toLowerCase();
  for (const verb of WRITE_VERBS) {
    if (new RegExp(`\\b${verb}\\b`).test(lowered)) {
      throw new UnsafeQueryError(`Disallowed keyword "${verb}" in query.`);
    }
  }
  return withoutTrailing;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
}

export class ReadOnlyDb {
  private db: DatabaseSync;

  constructor(path: string) {
    // open=true, readOnly=true → the driver rejects any write at the C level.
    this.db = new DatabaseSync(path, { readOnly: true });
  }

  listTables(): string[] {
    const rows = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  describeTable(table: string): ColumnInfo[] {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
      throw new UnsafeQueryError(`Invalid table name: ${table}`);
    }
    const known = this.listTables();
    if (!known.includes(table)) {
      throw new UnsafeQueryError(
        `Unknown table "${table}". Available: ${known.join(", ") || "(none)"}`,
      );
    }
    const rows = this.db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    return rows.map((r) => ({
      name: r.name,
      type: r.type || "",
      notNull: r.notnull === 1,
      primaryKey: r.pk === 1,
    }));
  }

  query(sql: string, limit = MAX_ROWS): { rows: any[]; truncated: boolean } {
    const safe = assertReadOnlySql(sql);
    const cap = Math.min(Math.max(Math.trunc(limit), 1), MAX_ROWS);
    // Wrap so a missing LIMIT can't dump the whole table. Fetch cap+1 to
    // detect truncation.
    const wrapped = `SELECT * FROM (${safe}) LIMIT ${cap + 1}`;
    const rows = this.db.prepare(wrapped).all() as any[];
    const truncated = rows.length > cap;
    return { rows: truncated ? rows.slice(0, cap) : rows, truncated };
  }

  close(): void {
    this.db.close();
  }
}
