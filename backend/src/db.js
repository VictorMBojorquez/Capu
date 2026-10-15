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

const profundidad = new WeakMap();

/** Ejecuta fn dentro de una transacción (admite anidamiento con SAVEPOINT); revierte si lanza error. */
function transaction(db, fn) {
  const nivel = profundidad.get(db) || 0;
  const punto = `sp_${nivel}`;
  db.exec(nivel === 0 ? 'BEGIN' : `SAVEPOINT ${punto}`);
  profundidad.set(db, nivel + 1);
  try {
    const r = fn();
    db.exec(nivel === 0 ? 'COMMIT' : `RELEASE ${punto}`);
    return r;
  } catch (e) {
    db.exec(nivel === 0 ? 'ROLLBACK' : `ROLLBACK TO ${punto}; RELEASE ${punto}`);
    throw e;
  } finally {
    profundidad.set(db, nivel);
  }
}

module.exports = { openDb, transaction };
