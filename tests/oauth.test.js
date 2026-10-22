const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const oauth = require('../backend/src/services/oauth');
const { openDb } = require('../backend/src/db');
const { seed } = require('../backend/src/seed');

const cfg = { id: 'cid', secret: 'csecret', redirect: 'http://localhost:3000/api/auth/google/callback' };

test('urlAutorizacion pide los alcances de lectura de Classroom, offline y PKCE', () => {
  const url = new URL(oauth.urlAutorizacion(cfg, 'st', 'reto123'));
  assert.equal(String(url), `https://accounts.google.com/o/oauth2/v2/auth?${url.searchParams}`);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('redirect_uri'), cfg.redirect);
  assert.equal(url.searchParams.get('state'), 'st');
  assert.equal(url.searchParams.get('code_challenge'), 'reto123');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  const scope = url.searchParams.get('scope');
  for (const s of oauth.SCOPES) assert.ok(scope.includes(s), `falta el alcance ${s}`);
});

test('crearPkce devuelve un par S256 coherente (reto = SHA-256 del verificador)', () => {
  const { verificador, reto } = oauth.crearPkce();
  assert.equal(reto, crypto.createHash('sha256').update(verificador).digest('base64url'));
});

test('consumirEstado es de un solo uso y devuelve el verificador PKCE', () => {
  const { estado } = oauth.crearEstado();
  const v = oauth.consumirEstado(estado);
  assert.equal(typeof v, 'string'); assert.ok(v.length >= 16);
  assert.equal(oauth.consumirEstado(estado), null);
  assert.equal(oauth.consumirEstado('inventado'), null);
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

test('identidad decodifica el id_token de Google (sub, nombre, correo)', () => {
  const jwt = (p) => 'eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify(p)).toString('base64url') + '.';
  const d = oauth.identidad({ id_token: jwt({ sub: '123', name: 'Maxi', email: 'm@x.mx' }) });
  assert.deepEqual(d, { google_id: '123', nombre: 'Maxi', correo: 'm@x.mx' });
  assert.deepEqual(oauth.identidad({}), {});
});

const jwt = (p) => 'eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify(p)).toString('base64url') + '.';

test('canjearCodigo usa PKCE, guarda la credencial y registra la identidad real del usuario', async () => {
  let llamada;
  const fetchFalso = async (url, opciones) => {
    llamada = { url, opciones: { ...opciones, body: new URLSearchParams(opciones.body) } };
    return { ok: true, json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600, id_token: jwt({ sub: '999', name: 'Estudiante Real', email: 'real@capu.mx' }) }) };
  };
  const t = await oauth.canjearCodigo('codigo123', cfg, { verificador: 'verificador123', fetchFn: fetchFalso });
  assert.equal(new URL(llamada.url).href, 'https://oauth2.googleapis.com/token');
  assert.equal(llamada.opciones.body.get('code'), 'codigo123');
  assert.equal(llamada.opciones.body.get('code_verifier'), 'verificador123');
  assert.equal(llamada.opciones.body.get('grant_type'), 'authorization_code');
  assert.equal(llamada.opciones.body.get('client_id'), 'cid');

  const db = openDb(':memory:'); seed(db);
  oauth.guardar(db, 1, t, '2026-10-14T12:00:00Z');
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T12:01:00Z', fetchFalso), 'AT');   // vigente: sin red

  const u = db.prepare('SELECT google_id, nombre, correo FROM usuario WHERE id_usuario = 1').get();
  assert.equal(u.google_id, '999'); assert.equal(u.nombre, 'Estudiante Real'); assert.equal(u.correo, 'real@capu.mx');

  // Expirado: se renueva con el refresh_token y la credencial conserva el refresh_token previo
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T13:01:00Z', fetchFalso, cfg), 'AT');
  assert.equal(db.prepare('SELECT refresh_token FROM credencial_google WHERE id_usuario = 1').get().refresh_token, 'RT');

  // Desconectar: borra y revoca ante Google
  let revocado;
  await oauth.desconectar(db, 1, async (url) => { revocado = url; return { ok: true, json: async () => ({}) }; });
  assert.equal(new URL(revocado).href, 'https://oauth2.googleapis.com/revoke');
  assert.equal(await oauth.tokenValido(db, 1, '2026-10-14T13:01:00Z', fetchFalso), null);
});
