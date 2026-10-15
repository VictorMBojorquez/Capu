const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../backend/src/app');
const { openDb } = require('../backend/src/db');
const googleAdapter = require('../backend/src/services/classroom/google');

process.env.CAPU_FIXED_NOW = '2026-10-14T17:00:00Z';

let server, url;
test.before(async () => {
  server = createApp(openDb(':memory:')).listen(0);
  await new Promise((r) => server.once('listening', r));
  url = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const api = async (m, p, body) => {
  const r = await fetch(url + p, { method: m, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  return { status: r.status, data: await r.json() };
};

test('GET /api/health responde correctamente', async () => {
  const r = await api('GET', '/api/health');
  assert.equal(r.status, 200); assert.equal(r.data.ok, true);
});
test('POST /api/sync importa cursos y tareas, y es repetible sin duplicar', async () => {
  const a = await api('POST', '/api/sync');
  assert.equal(a.data.cursos, 3); assert.equal(a.data.nuevas, 7); assert.equal(a.data.entregasDetectadas, 2);
  const b = await api('POST', '/api/sync');
  assert.equal(b.data.nuevas, 0);
  assert.equal((await api('GET', '/api/tareas')).data.length, 7);
});
test('la sincronización registra entregas hechas en Classroom y otorga tokens', async () => {
  const m = (await api('GET', '/api/metricas')).data;
  assert.equal(m.entregadas, 2); assert.ok(m.saldo_tokens > 0);
});
test('las tareas con fecha pasada y sin entrega se muestran como vencidas', async () => {
  const v = (await api('GET', '/api/tareas?estado=vencida')).data;
  assert.equal(v.length, 1); assert.match(v[0].titulo, /JOIN/);
});
test('PATCH avance valida el rango y cambia el estado a en_progreso', async () => {
  const [t] = (await api('GET', '/api/tareas?estado=pendiente')).data;
  assert.equal((await api('PATCH', `/api/tareas/${t.id_tarea}`, { avance_pct: 150 })).status, 400);
  assert.equal((await api('PATCH', `/api/tareas/${t.id_tarea}`, { avance_pct: 40 })).status, 200);
  const act = (await api('GET', '/api/tareas?estado=en_progreso')).data;
  assert.equal(act[0].avance_pct, 40);
});
test('completar una tarea otorga tokens y una segunda vez responde 409', async () => {
  const antes = (await api('GET', '/api/tokens')).data.saldo_tokens;
  const [t] = (await api('GET', '/api/tareas?estado=en_progreso')).data;
  const r = await api('POST', `/api/tareas/${t.id_tarea}/completar`);
  assert.equal(r.status, 200); assert.ok(r.data.cantidad >= 10);
  assert.equal((await api('GET', '/api/tokens')).data.saldo_tokens, antes + r.data.cantidad);
  assert.equal((await api('POST', `/api/tareas/${t.id_tarea}/completar`)).status, 409);
});
test('canjear una recompensa con saldo insuficiente devuelve 422', async () => {
  const caro = (await api('GET', '/api/recompensas')).data.at(-1);
  const saldo = (await api('GET', '/api/tokens')).data.saldo_tokens;
  if (saldo < caro.costo_tokens) assert.equal((await api('POST', `/api/recompensas/${caro.id_recompensa}/canjear`)).status, 422);
});
test('rutas inexistentes devuelven 404 en formato JSON', async () => {
  const r = await api('GET', '/api/nada'); assert.equal(r.status, 404); assert.ok(r.data.error);
});

test('adaptador de Google: transforma la respuesta de la API (con fetch simulado)', async () => {
  const falso = async (u) => ({ ok: true, json: async () => {
    if (u.includes('/courses?')) return { courses: [{ id: '9', name: 'Álgebra' }] };
    if (u.includes('studentSubmissions')) return { studentSubmissions: [{ courseWorkId: 'w1', state: 'TURNED_IN', updateTime: '2026-10-10T10:00:00Z' }] };
    return { courseWork: [{ id: 'w1', title: 'Tarea 1', dueDate: { year: 2026, month: 10, day: 20 }, dueTime: { hours: 18 }, alternateLink: 'https://x' }, { id: 'w2', title: 'Sin fecha' }] };
  } });
  const g = googleAdapter('token', falso);
  assert.deepEqual(await g.obtenerCursos(), [{ id: '9', nombre: 'Álgebra' }]);
  const t = await g.obtenerTareas('9');
  assert.equal(t.length, 1); assert.equal(t[0].entregada, true); assert.equal(t[0].fechaLimite, '2026-10-20T18:00:00.000Z');
});
