#!/usr/bin/env node
/**
 * Fix the usuario table CHECK constraint - change double quotes to single quotes
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function fix() {
  const dbPath = path.join(__dirname, '..', 'database', 'capu.db');
  const db = new DatabaseSync(dbPath);

  try {
    console.log('Fixing usuario table CHECK constraint...');

    // First, drop the leftover tarea_new table
    db.exec(`DROP TABLE IF EXISTS tarea_new;`);
    console.log('Dropped tarea_new table');

    // Check current usuario table schema
    const usuarioSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('Current usuario schema:', usuarioSchema.sql);

    // Get current data
    const users = db.prepare('SELECT * FROM usuario').all();
    console.log('Current users:', users.length);
    users.forEach(u => console.log('  User:', u));

    // The issue is the CHECK constraint uses double quotes
    // We need to recreate the usuario table with correct single quotes
    db.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE usuario_new (
        id_usuario    INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id     TEXT UNIQUE,
        nombre        TEXT NOT NULL,
        correo        TEXT NOT NULL,
        rol           TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante','admin')),
        saldo_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (saldo_tokens >= 0),
        racha_dias    INTEGER NOT NULL DEFAULT 0,
        ultima_entrega_ok TEXT,
        preferencias_notificaciones TEXT DEFAULT '{"push":true,"correo":false,"recordatorio_24h":true,"recordatorio_1h":true}',
        avatar_url    TEXT,
        created_at    TEXT DEFAULT '2024-01-01 00:00:00'
      );

      INSERT INTO usuario_new (id_usuario, google_id, nombre, correo, rol, saldo_tokens, racha_dias, ultima_entrega_ok, preferencias_notificaciones, avatar_url, created_at)
      SELECT id_usuario, google_id, nombre, correo, rol, saldo_tokens, racha_dias, ultima_entrega_ok, preferencias_notificaciones, avatar_url, created_at FROM usuario;

      DROP TABLE usuario;
      ALTER TABLE usuario_new RENAME TO usuario;

      COMMIT;
    `);
    console.log('Recreated usuario table with correct CHECK constraint');

    // Verify
    const newSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('New usuario schema:', newSchema.sql);

    console.log('\nFix completed successfully!');
  } catch (error) {
    console.error('Fix failed:', error);
    try { db.exec('ROLLBACK'); } catch {}
    process.exit(1);
  }
}

fix();