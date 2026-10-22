// Autenticación OAuth 2.0 con Google (RF-01): flujo de código de autorización.
// Requiere GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el entorno (ver README).
// Los alcances son de solo lectura de Classroom, el mínimo necesario para sincronizar.
const crypto = require('node:crypto');

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
];

/** Lee la configuración de OAuth del entorno; lanza un error claro (503) si falta algo. */
function config() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret)
    throw Object.assign(new Error('Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET para conectar con Classroom (ver README)'), { status: 503 });
  return { id, secret, redirect: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback' };
}

/** URL de consentimiento de Google. access_type=offline permite renovar el token sin repetir el permiso. */
function urlAutorizacion(cfg, state) {
  const p = new URLSearchParams({
    client_id: cfg.id, redirect_uri: cfg.redirect, response_type: 'code',
    scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', state,
  });
  return `${AUTH_URL}?${p}`;
}

/** Estados anti-CSRF: válidos 10 minutos y de un solo uso. */
const estados = new Map();
function crearEstado() {
  const s = crypto.randomBytes(16).toString('hex');
  estados.set(s, Date.now() + 600e3);
  return s;
}
function validarEstado(s) {
  const vence = estados.get(s);
  estados.delete(s); // de un solo uso
  return Boolean(s && vence && vence > Date.now());
}

/** Pide tokens a Google (intercambio de código o renovación). fetchFn inyectable para pruebas. */
async function pedirTokens(params, cfg, fetchFn = fetch) {
  const r = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: cfg.redirect }),
  });
  const d = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(`Google OAuth respondió ${r.status}: ${d.error_description || d.error || 'error desconocido'}`), { status: 502 });
  return d;
}

const canjearCodigo = (codigo, cfg, fetchFn = fetch) => pedirTokens({ code: codigo, grant_type: 'authorization_code' }, cfg, fetchFn);
const renovar = (refreshToken, cfg, fetchFn = fetch) => pedirTokens({ refresh_token: refreshToken, grant_type: 'refresh_token' }, cfg, fetchFn);

/** Guarda (o actualiza) la credencial del usuario. Conserva el refresh_token previo si Google no lo reenvía. */
function guardar(db, idUsuario, t, ahora) {
  db.prepare(`INSERT INTO credencial_google (id_usuario, access_token, refresh_token, expira, actualizado)
    VALUES (?,?,?,?,?)
    ON CONFLICT(id_usuario) DO UPDATE SET access_token = excluded.access_token,
      refresh_token = COALESCE(excluded.refresh_token, credencial_google.refresh_token),
      expira = excluded.expira, actualizado = excluded.actualizado`)
    .run(idUsuario, t.access_token, t.refresh_token || null,
      new Date(Date.parse(ahora) + (Number(t.expires_in) - 60) * 1000).toISOString(), new Date(ahora).toISOString());
}

/** Devuelve un access token vigente; lo renueva con el refresh_token si está por vencer.
 *  cfg se puede inyectar en pruebas; si no, se lee del entorno. */
async function tokenValido(db, idUsuario, ahora, fetchFn = fetch, cfg = null) {
  const c = db.prepare('SELECT * FROM credencial_google WHERE id_usuario = ?').get(idUsuario);
  if (!c) return null;
  if (Date.parse(c.expira) > Date.parse(ahora)) return c.access_token;
  if (!c.refresh_token) { borrar(db, idUsuario); return null; }
  const t = await renovar(c.refresh_token, cfg || config(), fetchFn);
  guardar(db, idUsuario, t, ahora);
  return t.access_token;
}

/** Olvida la credencial del usuario (desconectar). */
function borrar(db, idUsuario) {
  db.prepare('DELETE FROM credencial_google WHERE id_usuario = ?').run(idUsuario);
}

module.exports = { config, urlAutorizacion, crearEstado, validarEstado, canjearCodigo, renovar, guardar, tokenValido, borrar, SCOPES };
