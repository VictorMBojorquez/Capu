#!/usr/bin/env node
/**
 * Migration script to make classroom_id nullable in tarea table
 * Run with: node backend/migrate_classroom_id_nullable.js
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function migrate() {
  const dbPath = path.join(__dirname, '..', 'database', 'capu.db');
  const db = new DatabaseSync(dbPath);

  try {
    console.log('Checking if classroom_id needs to be made nullable...');

    // Check current classroom_id constraint
    const columns = db.prepare("PRAGMA table_info(tarea)").all();
    const classroomIdCol = columns.find(col => col.name === 'classroom_id');

    if (classroomIdCol && classroomIdCol.notnull === 1) {
      console.log('Making classroom_id nullable (requires table recreation)...');

      // Recreate the table with nullable classroom_id
      // Step 1: Create new table
      db.exec(`
        CREATE TABLE tarea_new (
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
      `);
      console.log('Created tarea_new table');

      // Step 2: Copy data
      db.exec(`
        INSERT INTO tarea_new (id_tarea, id_curso, classroom_id, source, titulo, descripcion, fecha_limite, estado, avance_pct, fecha_entrega, enlace)
        SELECT id_tarea, id_curso, classroom_id, source, titulo, descripcion, fecha_limite, estado, avance_pct, fecha_entrega, enlace FROM tarea;
      `);
      console.log('Copied data to tarea_new');

      // Step 3: Drop old table and rename
      db.exec(`
        DROP TABLE tarea;
      `);
      console.log('Dropped old tarea table');

      db.exec(`
        ALTER TABLE tarea_new RENAME TO tarea;
      `);
      console.log('Renamed tarea_new to tarea');

      // Step 4: Recreate indexes
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tarea_fecha ON tarea(fecha_limite);
        CREATE INDEX IF NOT EXISTS idx_tarea_source ON tarea(source);
      `);
      console.log('Recreated indexes');
    } else {
      console.log('classroom_id is already nullable or table already migrated');
    }

    // Verify the migration
    const newColumns = db.prepare("PRAGMA table_info(tarea)").all();
    console.log('\nCurrent tarea table columns:');
    newColumns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
    });

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();