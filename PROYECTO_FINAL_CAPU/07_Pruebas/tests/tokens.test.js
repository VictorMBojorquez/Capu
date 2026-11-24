const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularTokens, nuevaRacha, registrarEntrega, canjear } = require('../backend/src/services/tokens');
const { openDb } = require('../backend/src/db');
const { seed } = require('../backend/src/seed');

const H = 3600e3;
const base = new Date('2026-10-14T12:00:00Z').getTime();
const iso = (h) => new Date(base + h * H).toISOString();

test('entrega a tiempo sin anticipación otorga 10 tokens', () => {
  const r = calcularTokens({ fechaLimite: iso(5), fechaEntrega: iso(0) });
  assert.equal(r.cantidad, 10); assert.equal(r.aTiempo, true);
});
test('entrega con 24 h o más de anticipación suma 5 tokens', () => {
  assert.equal(calcularTokens({ fechaLimite: iso(24), fechaEntrega: iso(0) }).cantidad, 15);
});
test('el bono por racha se limita a 5 tokens', () => {
  assert.equal(calcularTokens({ fechaLimite: iso(2), fechaEntrega: iso(0), racha: 3 }).cantidad, 13);
  assert.equal(calcularTokens({ fechaLimite: iso(2), fechaEntrega: iso(0), racha: 99 }).cantidad, 15);
});
test('entrega tardía no otorga tokens', () => {
  const r = calcularTokens({ fechaLimite: iso(-1), fechaEntrega: iso(0) });
  assert.equal(r.cantidad, 0); assert.equal(r.aTiempo, false);
});
test('la entrega exactamente en la fecha límite cuenta como a tiempo', () => {
  assert.equal(calcularTokens({ fechaLimite: iso(0), fechaEntrega: iso(0) }).aTiempo, true);
});
test('racha: consecutiva si la última entrega fue ayer, se reinicia si no', () => {
  assert.equal(nuevaRacha('2026-10-13', 2, '2026-10-14T10:00:00Z'), 3);
  assert.equal(nuevaRacha('2026-10-14', 2, '2026-10-14T10:00:00Z'), 2);
  assert.equal(nuevaRacha('2026-10-10', 4, '2026-10-14T10:00:00Z'), 1);
});

function dbConTarea(fechaLimite) {
  const db = openDb(':memory:'); seed(db);
  db.prepare("INSERT INTO curso (id_usuario, classroom_id, nombre) VALUES (1,'c','Curso')").run();
  db.prepare("INSERT INTO tarea (id_curso, classroom_id, titulo, fecha_limite) VALUES (1,'t','Tarea',?)").run(fechaLimite);
  return db;
}
test('registrarEntrega actualiza saldo, racha e historial', () => {
  const db = dbConTarea(iso(30));
  const r = registrarEntrega(db, 1, iso(0));
  assert.equal(r.cantidad, 15);
  const u = db.prepare('SELECT saldo_tokens, racha_dias FROM usuario WHERE id_usuario=1').get();
  assert.deepEqual({ ...u }, { saldo_tokens: 15, racha_dias: 1 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM transaccion_token').get().n, 1);
});
test('no se premia dos veces la misma tarea', () => {
  const db = dbConTarea(iso(30));
  registrarEntrega(db, 1, iso(0));
  assert.throws(() => registrarEntrega(db, 1, iso(1)), /ya fue entregada/);
  assert.equal(db.prepare('SELECT saldo_tokens FROM usuario').get().saldo_tokens, 15);
});
test('canje: descuenta tokens y rechaza si el saldo es insuficiente', () => {
  const db = dbConTarea(iso(30));
  assert.throws(() => canjear(db, 1, iso(0)), /insuficientes/);   // costo 20, saldo 0
  registrarEntrega(db, 1, iso(0));                                  // +15
  assert.throws(() => canjear(db, 1, iso(0)), /faltan 5/);
  db.prepare('UPDATE usuario SET saldo_tokens = 25').run();
  canjear(db, 1, iso(0));
  assert.equal(db.prepare('SELECT saldo_tokens FROM usuario').get().saldo_tokens, 5);
});
