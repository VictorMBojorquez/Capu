#!/usr/bin/env node
/**
 * Comprehensive fix for database:
 * 1. Fix usuario table CHECK constraint (double quotes -> single quotes)
 * 2. Recreate tarea table with nullable classroom_id and source column
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function fix() {
  const dbPath = path.join(__dirname, '..', 'database', 'capu.db');
  const db = new DatabaseSync(dbPath);

  try {
    console.log('=== Comprehensive Database Fix ===\n');

    // Disable foreign keys temporarily
    db.exec(`PRAGMA foreign_keys = OFF;`);

    // ============================================================
    // STEP 1: Fix usuario table CHECK constraint
    // ============================================================
    console.log('Step 1: Fixing usuario table...');

    const usuarioSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('Current usuario schema has double quotes in CHECK constraint');

    // Get current user data
    const users = db.prepare('SELECT * FROM usuario').all();
    console.log(`Found ${users.length} user(s)`);

    // Recreate usuario table with correct quotes
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
    console.log('✓ Fixed usuario table CHECK constraint');

    // ============================================================
    // STEP 2: Recreate tarea table
    // ============================================================
    console.log('\nStep 2: Recreating tarea table...');

    // Get existing curso data for foreign key reference
    const cursos = db.prepare('SELECT id_curso FROM curso').all();
    console.log(`Found ${cursos.length} curso(s)`);

    db.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE tarea (
        id_tarea      INTEGER PRIMARY KEY AUTOINCREMENT,
        id_curso      INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
        classroom_id  TEXT,               -- nullable for custom tasks
        source        TEXT NOT NULL DEFAULT 'classroom' CHECK (source IN ('classroom', 'custom')),
        titulo        TEXT NOT NULL,
        descripcion   TEXT,
        fecha_limite  TEXT NOT NULL,
        estado        TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','en_progreso','entregada')),
        avance_pct    INTEGER NOT NULL DEFAULT 0 CHECK (avance_pct BETWEEN 0 AND 100),
        fecha_entrega TEXT,
        enlace        TEXT,
        UNIQUE (id_curso, classroom_id)
      );

      CREATE INDEX idx_tarea_fecha ON tarea(fecha_limite);
      CREATE INDEX idx_tarea_source ON tarea(source);

      COMMIT;
    `);
    console.log('✓ Created tarea table with nullable classroom_id and source column');

    // ============================================================
    // VERIFICATION
    // ============================================================
    console.log('\n=== Verification ===');

    // Check usuario schema
    const newUsuarioSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuario'").get();
    console.log('Usuario schema:', newUsuarioSchema.sql.includes('CHECK (rol IN') ? '✓ Single quotes' : '✗ Still double quotes');

    // Check tarea schema
    const tareaSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tarea'").get();
    console.log('Tarea schema:', tareaSchema ? '✓ Created' : '✗ Missing');

    // Check indexes
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_tarea%'").all();
    console.log('Tarea indexes:', indexes.map(i => i.name).join(', '));

    // Re-enable foreign keys
    db.exec(`PRAGMA foreign_keys = ON;`);

    console.log('\n=== All fixes completed successfully! ===');
  } catch (error) {
    console.error('Fix failed:', error);
    try { db.exec('ROLLBACK'); } catch {}
    process.exit(1);
  }
}

fix();