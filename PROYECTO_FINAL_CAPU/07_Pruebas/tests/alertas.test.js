const test = require('node:test');
const assert = require('node:assert/strict');
const { generar } = require('../backend/src/services/alertas');
const { openDb } = require('../backend/src/db');
const { seed } = require('../backend/src/seed');

const H = 3600e3;
const ahora = '2026-10-14T12:00:00Z';
const en = (h) => new Date(new Date(ahora).getTime() + h * H).toISOString();

function base() {
  const db = openDb(':memory:'); seed(db);
  db.prepare("INSERT INTO curso (id_usuario, classroom_id, nombre) VALUES (1,'c','Curso')").run();
  return db;
}
test('alerta como urgente las tareas que vencen en 24 h o menos', () => {
  const db = base();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t1','Pronta',?)").run(en(10));
  const a = generar(db, ahora);
  assert.equal(a.length, 1);
  assert.equal(a[0].tipo, 'proxima'); assert.equal(a[0].nivel, 'urgente');
  assert.equal(a[0].faltanH, 10); assert.equal(a[0].titulo, 'Pronta');
});
test('alerta como crítica las tareas vencidas sin entrega', () => {
  const db = base();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t2','Pasada',?)").run(en(-5));
  const a = generar(db, ahora);
  assert.equal(a[0].tipo, 'vencida'); assert.equal(a[0].nivel, 'critico');
  assert.equal(a[0].vencidasH, 5);
});
test('no alerta tareas lejanas ni tareas ya entregadas', () => {
  const db = base();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t3','Lejos',?)").run(en(72));
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite, estado, fecha_entrega) VALUES (1,'t4','Hecha',?, 'entregada', ?)").run(en(-2), en(-3));
  assert.equal(generar(db, ahora).length, 0);
});
