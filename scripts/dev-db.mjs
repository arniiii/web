// An actual PostgreSQL server for development when Docker is unavailable.
// Binds only to loopback; data persists in the ignored .local directory.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('.local/postgres');
mkdirSync(directory, { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: directory,
  user: 'semester',
  password: 'semester_local',
  port: 55432,
  persistent: true,
  autoRehydrateSymlinks: true,
  authMethod: 'scram-sha-256',
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
});
if (!existsSync(resolve(directory, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
for (const name of ['semester', 'semester_test']) {
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (rows.length === 0) await pg.createDatabase(name);
}
await client.end();
console.log('PostgreSQL готов: 127.0.0.1:55432. Данные: .local/postgres. Ctrl+C — остановка.');
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 60_000);
