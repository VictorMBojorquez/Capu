#!/usr/bin/env node
/**
 * Migration script to add auth columns to usuario table
 * Run with: node backend/migrate_auth.js
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function migrate() {
  const dbPath = path.join(__dirname, '..', 'database', 'capu.db');
  const db = new DatabaseSync(dbPath);

  try {
    console.log('=== Migration: Add Auth Columns to Usuario ===\n');

    // Disable foreign keys temporarily
    db.exec(`PRAGMA foreign_keys = OFF;`);

    // Check current usuario schema
    const currentSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('Current usuario schema:');
    console.log(currentSchema.sql);

    // Check if auth columns already exist
    const columns = db.prepare("PRAGMA table_info(usuario)").all();
    const columnNames = columns.map(c => c.name);

    const hasPasswordHash = columnNames.includes('password_hash');
    const hasEmailVerificado = columnNames.includes('email_verificado');
    const hasEmailVerificationToken = columnNames.includes('email_verification_token');
    const hasEmailVerificationExpires = columnNames.includes('email_verification_expires');
    const hasPasswordResetToken = columnNames.includes('password_reset_token');
    const hasPasswordResetExpires = columnNames.includes('password_reset_expires');
    const hasAuthProvider = columnNames.includes('auth_provider');

    if (hasPasswordHash && hasEmailVerificado && hasEmailVerificationToken && hasEmailVerificationExpires &&
        hasPasswordResetToken && hasPasswordResetExpires && hasAuthProvider) {
      console.log('\n✓ All auth columns already exist, skipping migration');
      // Still need to check unique index on email
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_usuario_email'").all();
      if (indexes.length === 0) {
        console.log('Adding unique index on correo...');
        db.exec(`CREATE UNIQUE INDEX idx_usuario_email ON usuario(correo);`);
        console.log('✓ Added unique index on correo');
      }
      db.exec(`PRAGMA foreign_keys = ON;`);
      return;
    }

    // Get current user data
    const users = db.prepare('SELECT * FROM usuario').all();
    console.log(`\nFound ${users.length} user(s) to migrate`);

    console.log('\nRecreating usuario table with auth columns...');

    // Recreate usuario table with all auth columns
    db.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE usuario_new (
        id_usuario    INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id     TEXT UNIQUE,
        nombre        TEXT NOT NULL,
        correo        TEXT NOT NULL,
        password_hash TEXT,
        email_verificado INTEGER NOT NULL DEFAULT 0,
        email_verification_token TEXT,
        email_verification_expires TEXT,
        password_reset_token TEXT,
        password_reset_expires TEXT,
        auth_provider TEXT NOT NULL DEFAULT 'google' CHECK (auth_provider IN ('google', 'email', 'both')),
        rol           TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante','admin')),
        saldo_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (saldo_tokens >= 0),
        racha_dias    INTEGER NOT NULL DEFAULT 0,
        ultima_entrega_ok TEXT,
        preferencias_notificaciones TEXT DEFAULT '{"push":true,"correo":false,"recordatorio_24h":true,"recordatorio_1h":true}',
        avatar_url    TEXT,
        created_at    TEXT DEFAULT '2024-01-01 00:00:00'
      );

      INSERT INTO usuario_new (
        id_usuario, google_id, nombre, correo, password_hash, email_verificado,
        email_verification_token, email_verification_expires,
        password_reset_token, password_reset_expires, auth_provider,
        rol, saldo_tokens, racha_dias, ultima_entrega_ok,
        preferencias_notificaciones, avatar_url, created_at
      )
      SELECT
        id_usuario, google_id, nombre, correo,
        NULL as password_hash,
        0 as email_verificado,
        NULL as email_verification_token,
        NULL as email_verification_expires,
        NULL as password_reset_token,
        NULL as password_reset_expires,
        'google' as auth_provider,
        rol, saldo_tokens, racha_dias, ultima_entrega_ok,
        preferencias_notificaciones, avatar_url, created_at
      FROM usuario;

      DROP TABLE usuario;
      ALTER TABLE usuario_new RENAME TO usuario;

      CREATE UNIQUE INDEX idx_usuario_email ON usuario(correo);

      COMMIT;
    `);

    console.log('✓ Recreated usuario table with auth columns');
    console.log('✓ Added unique index on correo');

    // Verify the migration
    const newSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('\nNew usuario schema:');
    console.log(newSchema.sql);

    const newColumns = db.prepare("PRAGMA table_info(usuario)").all();
    console.log('\nColumns:');
    newColumns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
    });

    // Check indexes
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_usuario%'").all();
    console.log('\nIndexes:', indexes.map(i => i.name).join(', '));

    // Re-enable foreign keys
    db.exec(`PRAGMA foreign_keys = ON;`);

    console.log('\n=== Migration completed successfully! ===');
  } catch (error) {
    console.error('Migration failed:', error);
    try { db.exec('ROLLBACK'); } catch {}
    process.exit(1);
  }
}

migrate();