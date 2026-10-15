const path = require('node:path');
const express = require('express');
const { openDb } = require('./db');
const { seed } = require('./seed');
const { now } = require('./clock');
const tareas = require('./services/tareas');
const tokens = require('./services/tokens');
const reminders = require('./services/reminders');
const { sincronizar } = require('./services/sync');
const mockAdapter = require('./services/classroom/mock');
const googleAdapter = require('./services/classroom/google');

/**
 * Crea la aplicación Express. Recibe la base de datos para poder probarla con ':memory:'.
 * Etapa II: usuario único de demostración (id 1). La autenticación con Google (RF-01) se integra en la Etapa III.
 */
function createApp(db = openDb()) {
  seed(db);
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then((r) => r !== undefined && res.json(r)).catch(next);

  app.get('/api/health', (req, res) => res.json({ ok: true, version: require('../../package.json').version, ahora: now().toISOString() }));

  // RF-03: sincronización. Con cabecera x-google-token usa Google real; si no, datos de demostración.
  app.post('/api/sync', wrap(async (req) => {
    const token = req.get('x-google-token');
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

  // RF-06: recordatorios.
  app.get('/api/recordatorios/pendientes', wrap(async () => reminders.pendientes(db, now())));
  app.post('/api/recordatorios/procesar', wrap(async () => ({ enviados: reminders.procesar(db, now()) })));

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
