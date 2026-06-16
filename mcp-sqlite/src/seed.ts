/**
 * Creates a small demo database (demo.db) so the server has something to query
 * out of the box. Run with: npm run seed
 */
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = join(here, "..", "demo.db");

const db = new DatabaseSync(dbPath);
db.exec(`
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS orders;
  CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    signed_up TEXT NOT NULL
  );
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount_pln REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const customers = [
  [1, "Anna Kowalska", "Poland", "2026-01-12"],
  [2, "Jan Nowak", "Poland", "2026-02-03"],
  [3, "Maria García", "Spain", "2026-02-19"],
  [4, "Tom Becker", "Germany", "2026-03-08"],
  [5, "Yuki Tanaka", "Japan", "2026-03-22"],
];
const insC = db.prepare("INSERT INTO customers VALUES (?,?,?,?)");
for (const c of customers) insC.run(...c);

const orders = [
  [1, 1, 1200.0, "paid", "2026-04-01"],
  [2, 1, 450.5, "paid", "2026-04-15"],
  [3, 2, 980.0, "pending", "2026-05-02"],
  [4, 3, 2500.0, "paid", "2026-05-10"],
  [5, 4, 175.25, "refunded", "2026-05-18"],
  [6, 5, 640.0, "paid", "2026-06-01"],
  [7, 2, 1320.0, "paid", "2026-06-09"],
];
const insO = db.prepare("INSERT INTO orders VALUES (?,?,?,?,?)");
for (const o of orders) insO.run(...o);

db.close();
console.log(`Seeded demo database at ${dbPath}`);
