let _db: D1Database;

export function initDB(db: D1Database) {
  _db = db;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stmt = _db.prepare(sql).bind(...params);
  const { results } = await stmt.all<T>();
  return results ?? [];
}

export async function get<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const stmt = _db.prepare(sql).bind(...params);
  const row = await stmt.first<T>();
  return row ?? undefined;
}

export async function run(
  sql: string,
  params: unknown[] = [],
): Promise<{ changes: number; lastInsertRowid: number }> {
  const stmt = _db.prepare(sql).bind(...params);
  const result = await stmt.run();
  return {
    changes: result.meta?.changes ?? 0,
    lastInsertRowid: Number(result.meta?.last_row_id ?? 0),
  };
}
