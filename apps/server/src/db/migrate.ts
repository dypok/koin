import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';
import path from 'path';

async function runMigration() {
  console.log('[Koin DB] Ejecutando migraciones Drizzle...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
    console.log('[Koin DB] Migraciones aplicadas con éxito.');
  } catch (error) {
    console.error('[Koin DB] Error al ejecutar migraciones:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
