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
const admin = require('./services/admin');
const usuario = require('./services/usuario');
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

  // Health check
  app.get('/api/health', (req, res) => res.json({ ok: true, version: require('../../package.json').version, ahora: now().toISOString() }));

  // ============================================================
  // RF-01: OAuth 2.0 con Google (código de autorización + PKCE)
  // ============================================================
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
    const u = db.prepare('SELECT nombre, correo, rol FROM usuario WHERE id_usuario = 1').get();
    return { conectado, nombre: u.nombre, correo: u.correo, rol: u.rol };
  }));
  app.delete('/api/auth/google', wrap(async () => { await oauth.desconectar(db, 1); return { ok: true }; }));

  // ============================================================
  // Perfil de Usuario y Preferencias
  // ============================================================
  // Obtener perfil completo
  app.get('/api/usuario/perfil', wrap(async () => usuario.getPerfil(db, 1)));

  // Actualizar perfil (nombre)
  app.patch('/api/usuario/perfil', wrap(async (req) => usuario.actualizarPerfil(db, 1, req.body)));

  // Preferencias de notificaciones
  app.get('/api/usuario/preferencias', wrap(async () => usuario.getPreferencias(db, 1)));
  app.patch('/api/usuario/preferencias', wrap(async (req) => usuario.actualizarPreferencias(db, 1, req.body)));

  // Desconectar Google (wrapper)
  app.delete('/api/usuario/google', wrap(async () => usuario.desconectarGoogle(db, 1)));

  // Eliminar cuenta
  app.delete('/api/usuario/cuenta', wrap(async () => usuario.eliminarCuenta(db, 1)));

  // ============================================================
  // RF-03: Sincronización
  // ============================================================
  app.post('/api/sync', wrap(async (req) => {
    const token = req.get('x-google-token') || await oauth.tokenValido(db, 1, now());
    const adaptador = token ? googleAdapter(token) : mockAdapter(now());
    return { adaptador: adaptador.nombre, ...(await sincronizar(db, adaptador, now())) };
  }));

  // ============================================================
  // RF-04: Agenda con filtros
  // ============================================================
  app.get('/api/cursos', wrap(async () => db.prepare('SELECT id_curso, nombre FROM curso ORDER BY nombre').all()));
  app.get('/api/tareas', wrap(async (req) => tareas.listar(db, now(), { curso: req.query.curso, estado: req.query.estado })));
  app.get('/api/tareas/:id', wrap(async (req) => {
    const tarea = tareas.obtener(db, now(), Number(req.params.id));
    if (!tarea) throw { status: 404, message: 'Tarea no encontrada' };
    return tarea;
  }));

  // ============================================================
  // RF-05: Seguimiento de avance
  // ============================================================
  app.patch('/api/tareas/:id', wrap(async (req) => {
    tareas.actualizarAvance(db, Number(req.params.id), req.body.avance_pct);
    return { ok: true };
  }));

  // ============================================================
  // RF-07: Entrega completada (otorga tokens)
  // ============================================================
  app.post('/api/tareas/:id/completar', wrap(async (req) => tokens.registrarEntrega(db, Number(req.params.id), now())));

  // ============================================================
  // RF-06: Recordatorios y alertas
  // ============================================================
  app.get('/api/recordatorios/pendientes', wrap(async () => reminders.pendientes(db, now())));
  app.post('/api/recordatorios/procesar', wrap(async () => ({ enviados: reminders.procesar(db, now()) })));
  app.get('/api/alertas', wrap(async () => alertas.generar(db, now())));

  // ============================================================
  // RF-08 / RF-09: Tokens y recompensas
  // ============================================================
  app.get('/api/tokens', wrap(async () => ({
    ...db.prepare('SELECT saldo_tokens, racha_dias FROM usuario WHERE id_usuario = 1').get(),
    historial: db.prepare('SELECT * FROM transaccion_token WHERE id_usuario = 1 ORDER BY fecha DESC, id_transaccion DESC LIMIT 50').all(),
  })));
  app.get('/api/recompensas', wrap(async () => db.prepare('SELECT * FROM recompensa WHERE activa = 1 ORDER BY costo_tokens').all()));
  app.post('/api/recompensas/:id/canjear', wrap(async (req) => tokens.canjear(db, Number(req.params.id), now())));

  // ============================================================
  // RF-12: Indicadores
  // ============================================================
  app.get('/api/metricas', wrap(async () => tareas.metricas(db, now())));

  // ============================================================
  // ADMIN ROUTES (require admin role)
  // ============================================================
  const adminMiddleware = admin.requireAdmin(db);

  // Usuarios
  app.get('/api/admin/usuarios', adminMiddleware, wrap(async () => admin.listUsuarios(db)));
  app.patch('/api/admin/usuarios/:id/rol', adminMiddleware, wrap(async (req) => admin.cambiarRolUsuario(db, Number(req.params.id), req.body.rol)));

  // Cursos
  app.get('/api/admin/cursos', adminMiddleware, wrap(async () => admin.listCursosAdmin(db)));

  // Recompensas (CRUD completo)
  app.get('/api/admin/recompensas', adminMiddleware, wrap(async () => admin.listRecompensasAdmin(db)));
  app.get('/api/admin/recompensas/:id', adminMiddleware, wrap(async (req) => {
    const r = db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ?').get(Number(req.params.id));
    if (!r) throw { status: 404, message: 'Recompensa no encontrada' };
    return r;
  }));
  app.post('/api/admin/recompensas', adminMiddleware, wrap(async (req) => admin.crearRecompensa(db, req.body)));
  app.patch('/api/admin/recompensas/:id', adminMiddleware, wrap(async (req) => admin.actualizarRecompensa(db, Number(req.params.id), req.body)));
  app.delete('/api/admin/recompensas/:id', adminMiddleware, wrap(async (req) => admin.eliminarRecompensa(db, Number(req.params.id))));

  // Métricas del sistema
  app.get('/api/admin/metricas', adminMiddleware, wrap(async () => admin.metricasSistema(db)));

  // Configuración OAuth
  app.get('/api/admin/oauth', adminMiddleware, wrap(async () => admin.getOAuthConfig(db)));
  app.post('/api/admin/oauth', adminMiddleware, wrap(async (req) => admin.saveOAuthConfig(db, req.body)));
  app.post('/api/admin/oauth/test', adminMiddleware, wrap(async (req) => {
    const config = admin.getOAuthConfig(db);
    config.client_id = req.body.client_id || config.client_id;
    return admin.testOAuthConnection(config);
  }));

  // 404 para API
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
  });

  return app;
}

module.exports = { createApp };