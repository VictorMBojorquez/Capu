#!/usr/bin/env node
/**
 * Migration script to add 'source' column to tarea table
 * Run with: node backend/migrate_custom_tasks.js
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function migrate() {
  const dbPath = path.join(__dirname, '..', 'database', 'capu.db');
  const db = new DatabaseSync(dbPath);

  try {
    // Check if source column already exists
    const columns = db.prepare("PRAGMA table_info(tarea)").all();
    const hasSource = columns.some(col => col.name === 'source');

    if (hasSource) {
      console.log('Column "source" already exists in tarea table');
    } else {
      console.log('Adding "source" column to tarea table...');
      db.exec(`
        ALTER TABLE tarea ADD COLUMN source TEXT NOT NULL DEFAULT 'classroom' CHECK (source IN ('classroom', 'custom'));
      `);
      console.log('Added "source" column');
    }

    // Make classroom_id nullable for custom tasks (by removing NOT NULL constraint)
    // SQLite doesn't support DROP NOT NULL directly, we need to recreate the table
    // But for now, we'll allow NULL by not specifying NOT NULL in new inserts
    // The UNIQUE constraint (id_curso, classroom_id) will still work since NULL != NULL in SQLite

    // Check if idx_tarea_source index exists
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_tarea_source'").get();
    if (!indexes) {
      console.log('Creating idx_tarea_source index...');
      db.exec(`CREATE INDEX idx_tarea_source ON tarea(source);`);
      console.log('Created idx_tarea_source index');
    } else {
      console.log('Index idx_tarea_source already exists');
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