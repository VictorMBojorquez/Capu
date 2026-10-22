const path = require('node:path');
const express = require('express');
const { openDb } = require('./db');
const { seed } = require('./seed');
const { now } = require('./clock');
const tareas = require('./services/tareas');
const tokens = require('./services/tokens');
const reminders = require('./services/reminders');
const { sincronizar } = require('./services/sync');
const alertas = require('./services/alertas');
const oauth = require('./services/oauth');
const mockAdapter = require('./services/classroom/mock');
const googleAdapter = require('./services/classroom/google');

/**
 * Crea la aplicación Express. Recibe la base de datos para poder probarla con ':memory:'.
 * Etapa III: OAuth con Google (RF-01) para sincronizar Classroom; un usuario de demostración (id 1).
 */
function createApp(db = openDb()) {
  seed(db);
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));
  app.set('db', db);

  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then((r) => r !== undefined && res.json(r)).catch(next);

  app.get('/api/health', (req, res) => res.json({ ok: true, version: require('../../package.json').version, ahora: now().toISOString() }));

  // RF-01: OAuth 2.0 con Google (código de autorización + PKCE).
  // 'iniciar' manda al consentimiento; 'callback' guarda la credencial y la identidad real.
  app.get('/api/auth/google/iniciar', (req, res) => {
    try {
      const { estado, reto } = oauth.crearEstado();
      return res.redirect(302, oauth.urlAutorizacion(oauth.config(), estado, reto));
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  });
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      if (req.query.error) return res.redirect(302, '/?classroom=' + encodeURIComponent(req.query.error));
      const verificador = oauth.consumirEstado(String(req.query.state || ''));
      if (!verificador)
        return res.status(400).json({ error: 'Estado de OAuth inválido o expirado; inténtalo de nuevo' });
      const t = await oauth.canjearCodigo(String(req.query.code || ''), oauth.config(), { verificador });
      oauth.guardar(db, 1, t, now());
      return res.redirect(302, '/?classroom=ok');
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      return res.status(status).json({ error: e.message });
    }
  });
  app.get('/api/auth/google/estado', wrap(async () => {
    const conectado = Boolean(await oauth.tokenValido(db, 1, now()));
    const u = db.prepare('SELECT nombre, correo FROM usuario WHERE id_usuario = 1').get();
    return { conectado, nombre: u.nombre, correo: u.correo };
  }));
  app.delete('/api/auth/google', wrap(async () => { await oauth.desconectar(db, 1); return { ok: true }; }));

  // RF-03: sincronización. Prioridad: cabecera x-google-token > credencial OAuth guardada > datos de demostración.
  app.post('/api/sync', wrap(async (req) => {
    const token = req.get('x-google-token') || await oauth.tokenValido(db, 1, now());
    const adaptador = token ? googleAdapter(token) : mockAdapter(now());
    return { adaptador: adaptador.nombre, ...(await sincronizar(db, adaptador, now())) };
  }));

  // RF-04: agenda con filtros por curso y estado.
  app.get('/api/cursos', wrap(async () => db.prepare('SELECT id_curso, nombre FROM curso ORDER BY nombre').all()));
  app.get('/api/tareas', wrap(async (req) => tareas.listar(db, now(), { curso: req.query.curso, estado: req.query.estado })));

  // RF-05: seguimiento de avance.
  app.patch('/api/tareas/:id', wrap(async (req) => {
    tareas.actualizarAvance(db, Number(req.params.id), req.body.avance_pct);
    return { ok: true };
  }));

  // RF-07: entrega completada (otorga tokens).
  app.post('/api/tareas/:id/completar', wrap(async (req) => tokens.registrarEntrega(db, Number(req.params.id), now())));

  // RF-06: recordatorios y alertas de la app (próximas a vencer y vencidas).
  app.get('/api/recordatorios/pendientes', wrap(async () => reminders.pendientes(db, now())));
  app.post('/api/recordatorios/procesar', wrap(async () => ({ enviados: reminders.procesar(db, now()) })));
  app.get('/api/alertas', wrap(async () => alertas.generar(db, now())));

  // RF-08 / RF-09: tokens y recompensas.
  app.get('/api/tokens', wrap(async () => ({
    ...db.prepare('SELECT saldo_tokens, racha_dias FROM usuario WHERE id_usuario = 1').get(),
    historial: db.prepare('SELECT * FROM transaccion_token WHERE id_usuario = 1 ORDER BY fecha DESC, id_transaccion DESC LIMIT 50').all(),
  })));
  app.get('/api/recompensas', wrap(async () => db.prepare('SELECT * FROM recompensa WHERE activa = 1 ORDER BY costo_tokens').all()));
  app.post('/api/recompensas/:id/canjear', wrap(async (req) => tokens.canjear(db, Number(req.params.id), now())));

  // RF-12: indicadores.
  app.get('/api/metricas', wrap(async () => tareas.metricas(db, now())));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
  });
  return app;
}

module.exports = { createApp };
