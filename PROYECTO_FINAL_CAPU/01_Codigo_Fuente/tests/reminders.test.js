const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularRecordatorios, programarRecordatorios, pendientes, procesar } = require('../backend/src/services/reminders');
const { openDb } = require('../backend/src/db');
const { seed } = require('../backend/src/seed');

const H = 3600e3;
const ahora = '2026-10-14T12:00:00Z';
const en = (h) => new Date(new Date(ahora).getTime() + h * H).toISOString();

test('genera recordatorios a 24 h y 3 h antes de la fecha límite', () => {
  assert.deepEqual(calcularRecordatorios(en(48), ahora), [en(24), en(45)]);
});
test('descarta recordatorios que ya pasaron', () => {
  assert.deepEqual(calcularRecordatorios(en(10), ahora), [en(7)]);
  assert.deepEqual(calcularRecordatorios(en(2), ahora), []);
});
test('programar es idempotente y procesar marca como enviados', () => {
  const db = openDb(':memory:'); seed(db);
  db.prepare("INSERT INTO curso (id_usuario, classroom_id, nombre) VALUES (1,'c','Curso')").run();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t','Tarea',?)").run(en(48));
  assert.equal(programarRecordatorios(db, ahora), 2);
  assert.equal(programarRecordatorios(db, ahora), 0);
  assert.equal(pendientes(db, ahora).length, 0);                // aún no es la hora
  assert.equal(pendientes(db, en(30)).length, 1);               // pasó el de 24 h
  assert.equal(procesar(db, en(30)).length, 1);
  assert.equal(pendientes(db, en(30)).length, 0);               // ya enviado
});
test('no hay recordatorios pendientes de tareas ya entregadas', () => {
  const db = openDb(':memory:'); seed(db);
  db.prepare("INSERT INTO curso (id_usuario, classroom_id, nombre) VALUES (1,'c','Curso')").run();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t','Tarea',?)").run(en(48));
  programarRecordatorios(db, ahora);
  db.prepare("UPDATE tarea SET estado='entregada'").run();
  assert.equal(pendientes(db, en(30)).length, 0);
});
