/**
 * Tests for the read-only guard and query layer. Seeds an in-test DB file.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlinkSync } from "node:fs";
import { assertReadOnlySql, UnsafeQueryError, ReadOnlyDb } from "./db.ts";

const dbPath = join(tmpdir(), `mcp-sqlite-test-${process.pid}.db`);

before(() => {
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE items(id INTEGER PRIMARY KEY, name TEXT)");
  const ins = db.prepare("INSERT INTO items(name) VALUES (?)");
  for (let i = 0; i < 50; i++) ins.run(`item-${i}`);
  db.close();
});

after(() => {
  try { unlinkSync(dbPath); } catch {}
});

test("assertReadOnlySql accepts a plain SELECT", () => {
  assert.equal(assertReadOnlySql("SELECT * FROM items"), "SELECT * FROM items");
});

test("assertReadOnlySql accepts a CTE", () => {
  const q = "WITH x AS (SELECT 1) SELECT * FROM x";
  assert.equal(assertReadOnlySql(q), q);
});

test("assertReadOnlySql rejects INSERT/UPDATE/DELETE/DROP", () => {
  for (const q of [
    "INSERT INTO items(name) VALUES ('x')",
    "UPDATE items SET name='x'",
    "DELETE FROM items",
    "DROP TABLE items",
  ]) {
    assert.throws(() => assertReadOnlySql(q), UnsafeQueryError, q);
  }
});

test("assertReadOnlySql blocks stacked statements", () => {
  assert.throws(
    () => assertReadOnlySql("SELECT 1; DROP TABLE items"),
    UnsafeQueryError,
  );
});

test("assertReadOnlySql blocks DELETE hidden in a comment + stacked stmt", () => {
  assert.throws(
    () => assertReadOnlySql("SELECT 1 -- ok\n; DELETE FROM items"),
    UnsafeQueryError,
  );
});

test("ReadOnlyDb enforces the row cap", () => {
  const db = new ReadOnlyDb(dbPath);
  const { rows, truncated } = db.query("SELECT * FROM items", 10);
  assert.equal(rows.length, 10);
  assert.equal(truncated, true);
  db.close();
});

test("ReadOnlyDb connection physically refuses writes", () => {
  const db = new ReadOnlyDb(dbPath);
  // Even if the guard were bypassed, the read-only connection must reject it.
  assert.throws(() => (db as any).db.exec("INSERT INTO items(name) VALUES('x')"));
  db.close();
});

test("describeTable rejects unknown / injected table names", () => {
  const db = new ReadOnlyDb(dbPath);
  assert.throws(() => db.describeTable("items; DROP TABLE items"), UnsafeQueryError);
  assert.throws(() => db.describeTable("nope"), UnsafeQueryError);
  db.close();
});
