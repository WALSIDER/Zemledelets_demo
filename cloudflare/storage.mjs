// Store changed top-level collections in chunks; D1 batches commit atomically.
// Seed content stays in the Worker bundle. Passwords and sessions exist only in D1.
export function createStorage(database, seed) {
  let revision;
  let original;

  async function readDb() {
    if (!database) {
      original = structuredClone(seed);
      return structuredClone(seed);
    }
    await database.batch([
      database.prepare('CREATE TABLE IF NOT EXISTS app_revision (id INTEGER PRIMARY KEY, version INTEGER NOT NULL)'),
      database.prepare('CREATE TABLE IF NOT EXISTS app_data (name TEXT NOT NULL, part INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY (name, part))'),
      database.prepare('INSERT OR IGNORE INTO app_revision (id, version) VALUES (1, 0)')
    ]);
    const results = await database.batch([
      database.prepare('SELECT version FROM app_revision WHERE id = 1'),
      database.prepare('SELECT name, part, value FROM app_data ORDER BY name, part')
    ]);
    revision = results[0].results[0].version;
    const db = structuredClone(seed);
    const chunks = new Map();
    for (const row of results[1].results) {
      if (!chunks.has(row.name)) chunks.set(row.name, []);
      chunks.get(row.name).push(row.value);
    }
    for (const [name, parts] of chunks) db[name] = JSON.parse(parts.join(''));
    original = structuredClone(db);
    return db;
  }

  async function writeDb(db) {
    if (!database) {
      throw Object.assign(new Error('База данных не подключена. Добавьте D1 binding с именем DB в настройках Cloudflare Pages.'), { status: 503 });
    }
    if (revision === undefined) throw new Error('Read the database before writing.');
    const statements = [];
    for (const [name, value] of Object.entries(db)) {
      const json = JSON.stringify(value);
      if (json === JSON.stringify(original[name])) continue;
      statements.push(database.prepare('DELETE FROM app_data WHERE name = ?').bind(name));
      // UTF-16 slices rejoin losslessly; each chunk stays below D1 value limits.
      const chunks = json.match(/[\s\S]{1,32000}/gu) || [''];
      for (const [part, chunk] of chunks.entries()) {
        statements.push(database.prepare('INSERT INTO app_data (name, part, value) VALUES (?, ?, ?)').bind(name, part, chunk));
      }
    }
    if (!statements.length) return;
    // NOT NULL violation aborts the entire batch if another request saved first.
    statements.unshift(database.prepare('UPDATE app_revision SET version = CASE WHEN version = ? THEN version + 1 ELSE NULL END WHERE id = 1').bind(revision));
    try {
      await database.batch(statements);
    } catch (error) {
      if (String(error.message).includes('NOT NULL')) {
        throw Object.assign(new Error('Данные изменились. Повторите действие.'), { status: 409 });
      }
      throw error;
    }
    revision += 1;
    original = structuredClone(db);
  }

  return { readDb, writeDb };
}
