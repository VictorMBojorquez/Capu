// Aislamiento multiusuario: cada cuenta sólo ve y modifica sus propios datos.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../backend/src/app');
const { openDb } = require('../backend/src/db');

process.env.CAPU_FIXED_NOW = '2026-10-14T17:00:00Z';

let server, url;

async function crearUsuario(nombre) {
  const correo = `${nombre.toLowerCase()}${Date.now()}@example.com`;
  const password = 'TestPass123!';
  await fetch(url + '/api/auth/registro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ correo, password, nombre }),
  });
  const r = await fetch(url + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  const data = await r.json();
  return { token: data.token, id: data.usuario.id_usuario };
}

function cliente(token) {
  return async (m, p, body) => {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(url + p, { method: m, headers, body: body && JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  };
}

let a, b;

test.before(async () => {
  server = createApp(openDb(':memory:')).listen(0);
  await new Promise((r) => server.once('listening', r));
  url = `http://127.0.0.1:${server.address().port}`;
  a = await crearUsuario('Ana');
  b = await crearUsuario('Beto');
  a.api = cliente(a.token);
  b.api = cliente(b.token);
});

test.after(() => server.close());

test('cada usuario sincroniza y ve únicamente sus cursos y tareas', async () => {
  assert.equal((await a.api('POST', '/api/sync')).status, 200);
  assert.equal((await b.api('POST', '/api/sync')).status, 200);

  const cursosA = (await a.api('GET', '/api/cursos')).data;
  const cursosB = (await b.api('GET', '/api/cursos')).data;
  assert.equal(cursosA.length, 3);
  assert.equal(cursosB.length, 3);
  assert.ok(cursosA.every((c) => !cursosB.some((x) => x.id_curso === c.id_curso)));

  const tareasA = (await a.api('GET', '/api/tareas')).data;
  const tareasB = (await b.api('GET', '/api/tareas')).data;
  assert.equal(tareasA.length, 7);
  assert.equal(tareasB.length, 7);
  assert.ok(tareasA.every((t) => !tareasB.some((x) => x.id_tarea === t.id_tarea)));
});

test('un usuario no puede leer, avanzar ni completar tareas de otro', async () => {
  const tareaA = (await a.api('GET', '/api/tareas')).data[0];

  assert.equal((await b.api('GET', `/api/tareas/${tareaA.id_tarea}`)).status, 404);
  assert.equal((await b.api('PATCH', `/api/tareas/${tareaA.id_tarea}`, { avance_pct: 50 })).status, 404);
  assert.equal((await b.api('POST', `/api/tareas/${tareaA.id_tarea}/completar`)).status, 404);

  assert.equal((await a.api('GET', `/api/tareas/${tareaA.id_tarea}`)).status, 200);
});

test('las métricas, alertas y recordatorios son independientes por usuario', async () => {
  const mA = (await a.api('GET', '/api/metricas')).data;
  const mB = (await b.api('GET', '/api/metricas')).data;
  assert.equal(mA.total, 7);
  assert.equal(mB.total, 7);

  const alertasA = (await a.api('GET', '/api/alertas')).data;
  const alertasB = (await b.api('GET', '/api/alertas')).data;
  const idsA = new Set(alertasA.map((x) => x.id_tarea));
  assert.ok(alertasB.every((x) => !idsA.has(x.id_tarea)));

  const recA = (await a.api('GET', '/api/recordatorios/pendientes')).data;
  const recB = (await b.api('GET', '/api/recordatorios/pendientes')).data;
  const idsRecA = new Set(recA.map((x) => x.id_tarea));
  assert.ok(recB.every((x) => !idsRecA.has(x.id_tarea)));
});

test('el canje descuenta del saldo del usuario autenticado', async () => {
  const recompensa = (await a.api('GET', '/api/recompensas')).data[0];
  const saldoB = (await b.api('GET', '/api/tokens')).data.saldo_tokens;

  // Beto intenta canjear; si no le alcanza, el error debe ser suyo (422), no tocar el saldo de Ana.
  const saldoA = (await a.api('GET', '/api/tokens')).data.saldo_tokens;
  const r = await b.api('POST', `/api/recompensas/${recompensa.id_recompensa}/canjear`);
  assert.ok([200, 422].includes(r.status));

  if (r.status === 200) {
    assert.equal((await b.api('GET', '/api/tokens')).data.saldo_tokens, saldoB - recompensa.costo_tokens);
  }
  assert.equal((await a.api('GET', '/api/tokens')).data.saldo_tokens, saldoA);
});
