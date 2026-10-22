const test = require('node:test');
const assert = require('node:assert/strict');
const oauth = require('../backend/src/services/oauth');
const { openDb } = require('../backend/src/db');
const { seed } = require('../backend/src/seed');

const cfg = { id: 'cid', secret: 'csecret', redirect: 'http://localhost:3000/api/auth/google/callback' };

test('urlAutorizacion pide los alcances de lectura de Classroom y acceso offline', () => {
  const url = new URL(oauth.urlAutorizacion(cfg, 'st'));
  assert.equal(String(url), `https://accounts.google.com/o/oauth2/v2/auth?${url.searchParams}`);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('redirect_uri'), cfg.redirect);
  assert.equal(url.searchParams.get('state'), 'st');
  const scope = url.searchParams.get('scope');
  for (const s of oauth.SCOPES) assert.ok(scope.includes(s), `falta el alcance ${s}`);
});

test('config falla con 503 si no hay credenciales en el entorno', () => {
  const prev = { CLIENT_ID: process.env.GOOGLE_CLIENT_ID, CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET };
  delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET;
  try { assert.throws(() => oauth.config(), (e) => e.status === 503); }
  finally {
    if (prev.CLIENT_ID) process.env.GOOGLE_CLIENT_ID = prev.CLIENT_ID;
    if (prev.CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = prev.CLIENT_SECRET;
  }
});

test('el estado anti-CSRF es de un solo uso', () => {
  const s = oauth.crearEstado();
  assert.equal(oauth.validarEstado(s), true);
  assert.equal(oauth.validarEstado(s), false);
  assert.equal(oauth.validarEstado('inventado'), false);
});

test('canjearCodigo interpola el token_url con las credenciales y guarda la credencial', async () => {
  let llamada;
  const fetchFalso = async (url, opciones) => {
    llamada = { url, opciones: { ...opciones, body: new URLSearchParams(opciones.body) } };
    return { ok: true, json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 }) };
  };
  const t = await oauth.canjearCodigo('codigo123', cfg, fetchFalso);
  assert.equal(new URL(llamada.url).href, 'https://oauth2.googleapis.com/token');
  assert.equal(llamada.opciones.body.get('code'), 'codigo123');
  assert.equal(llamada.opciones.body.get('grant_type'), 'authorization_code');
  assert.equal(llamada.opciones.body.get('client_id'), 'cid');

  const db = openDb(':memory:'); seed(db);
  oauth.guardar(db, 1, t, '2026-10-14T12:00:00Z');
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T12:01:00Z', fetchFalso), 'AT');   // vigente: sin red

  // Expirado: se renueva con el refresh_token y la credencial conserva el refresh_token previo
  const antes = db.prepare('SELECT refresh_token FROM credencial_google WHERE id_usuario = 1').get();
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T13:01:00Z', fetchFalso, cfg), 'AT');
  assert.equal(antes.refresh_token, 'RT');
  assert.equal(db.prepare('SELECT refresh_token FROM credencial_google WHERE id_usuario = 1').get().refresh_token, 'RT');

  oauth.borrar(db, 1);
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T13:01:00Z', fetchFalso), null);
});
