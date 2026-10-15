const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = path.join(__dirname, '..', '..', 'database', 'schema.sql');

/** Abre (o crea) la base de datos y aplica el esquema. Usa ':memory:' en pruebas. */
function openDb(file = process.env.CAPU_DB || path.join(__dirname, '..', '..', 'database', 'capu.db')) {
  const db = new DatabaseSync(file);
  db.exec(fs.readFileSync(SCHEMA, 'utf8'));
  return db;
}

/** Ejecuta fn dentro de una transacción; revierte si lanza error. */
function transaction(db, fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { openDb, transaction };
