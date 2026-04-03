import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const dbPath = join(rootDir, "data.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

export async function query<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  return db.prepare(sql).all(...params) as T[];
}

export async function get<T>(sql: string, ...params: unknown[]): Promise<T | undefined> {
  return db.prepare(sql).get(...params) as T | undefined;
}

export async function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...params);
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  db.exec("BEGIN");
  try {
    const result = await fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
