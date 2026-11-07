const path = require('node:path');
const express = require('express');
const rateLimit = require('express-rate-limit');
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
const auth = require('./services/auth');
const notificaciones = require('./services/notificaciones');
const email = require('./services/email');
const { authMiddleware } = require('./services/jwt');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('./config/env');
const mockAdapter = require('./services/classroom/mock');
const googleAdapter = require('./services/classroom/google');

/**
 * Middleware para registrar acciones de auditoría
 */
function auditMiddleware(db) {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      // Log sensitive actions after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id_usuario || req.adminUser?.id_usuario;
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('user-agent');

        // Define sensitive actions to log
        const sensitiveActions = {
          'POST /api/auth/login': { accion: 'login', entidad: 'usuario' },
          'POST /api/auth/registro': { accion: 'registro', entidad: 'usuario' },
          'PATCH /api/auth/cambiar-password': { accion: 'cambiar_password', entidad: 'usuario' },
          'POST /api/auth/olvide-password': { accion: 'solicitar_reset_password', entidad: 'usuario' },
          'POST /api/auth/reset-password': { accion: 'reset_password', entidad: 'usuario' },
          'DELETE /api/auth/google': { accion: 'desconectar_google', entidad: 'usuario' },
          'PATCH /api/usuario/perfil': { accion: 'actualizar_perfil', entidad: 'usuario' },
          'DELETE /api/usuario/cuenta': { accion: 'eliminar_cuenta', entidad: 'usuario' },
          'POST /api/sync': { accion: 'sincronizar', entidad: 'sync' },
          'POST /api/tareas/custom': { accion: 'crear_tarea_custom', entidad: 'tarea' },
          'PATCH /api/tareas/custom/': { accion: 'actualizar_tarea_custom', entidad: 'tarea' },
          'DELETE /api/tareas/custom/': { accion: 'eliminar_tarea_custom', entidad: 'tarea' },
          'POST /api/tareas/:id/completar': { accion: 'completar_tarea', entidad: 'tarea' },
          'POST /api/recompensas/:id/canjear': { accion: 'canjear_recompensa', entidad: 'recompensa' },
          'PATCH /api/admin/usuarios/': { accion: 'cambiar_rol_usuario', entidad: 'usuario', entidad_id_param: 'id' },
          'POST /api/admin/recompensas': { accion: 'crear_recompensa', entidad: 'recompensa' },
          'PATCH /api/admin/recompensas/': { accion: 'actualizar_recompensa', entidad: 'recompensa', entidad_id_param: 'id' },
          'DELETE /api/admin/recompensas/': { accion: 'eliminar_recompensa', entidad: 'recompensa', entidad_id_param: 'id' },
          'POST /api/admin/oauth': { accion: 'actualizar_oauth_config', entidad: 'config' },
          'POST /api/admin/tareas': { accion: 'crear_tarea_admin', entidad: 'tarea' },
          'PATCH /api/admin/tareas/': { accion: 'actualizar_tarea_admin', entidad: 'tarea', entidad_id_param: 'id' },
          'DELETE /api/admin/tareas/': { accion: 'eliminar_tarea_admin', entidad: 'tarea', entidad_id_param: 'id' }
        };

        const routeKey = `${req.method} ${req.route?.path || req.path}`;
        const actionConfig = sensitiveActions[routeKey];

        // Check for dynamic routes (with :id)
        if (!actionConfig) {
          for (const [pattern, config] of Object.entries(sensitiveActions)) {
            const regexPattern = pattern.replace(/\/:[^/]+/g, '/[^/]+');
            const regex = new RegExp('^' + regexPattern + '$');
            if (regex.test(req.path) && req.method === pattern.split(' ')[0]) {
              Object.assign(config, { matched: true });
              Object.assign(actionConfig || {}, config);
              break;
            }
          }
        }

        if (actionConfig && userId) {
          try {
            admin.registrarAuditoria(db, {
              id_usuario: userId,
              accion: actionConfig.accion,
              entidad: actionConfig.entidad,
              entidad_id: actionConfig.entidad_id_param ? Number(req.params[actionConfig.entidad_id_param]) : undefined,
              ip,
              user_agent: userAgent
            });
          } catch (e) {
            // Silently fail audit logging to not affect the main response
            console.error('Audit logging error:', e.message);
          }
        }
      }
      return originalSend.call(this, body);
    };
    next();
  };
}

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

  // ============================================================
  // Email Background Job Functions (Fase 12)
  // ============================================================
  async function processEmailReminders(dbInstance) {
    try {
      console.log('[Email] Processing task reminders...');
      // Obtener tareas que vencen en 24h y 1h
      const ahora = now();
      const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
      const en1h = new Date(ahora.getTime() + 60 * 60 * 1000);

      // Tareas que vencen en ~24h (con margen de 15 min)
      const tareas24h = dbInstance.prepare(`
        SELECT t.*, u.correo, u.nombre, c.nombre as curso
        FROM tarea t
        JOIN curso c ON t.id_curso = c.id_curso
        JOIN usuario u ON c.id_usuario = u.id_usuario
        WHERE t.estado = 'pendiente'
          AND t.fecha_limite BETWEEN ? AND ?
          AND u.preferencias_notificaciones LIKE '%"recordatorio_24h":true%'
          AND u.correo IS NOT NULL
          AND u.correo != ''
      `).all(en24h.toISOString(), new Date(en24h.getTime() + 15 * 60 * 1000).toISOString());

      // Tareas que vencen en ~1h (con margen de 15 min)
      const tareas1h = dbInstance.prepare(`
        SELECT t.*, u.correo, u.nombre, c.nombre as curso
        FROM tarea t
        JOIN curso c ON t.id_curso = c.id_curso
        JOIN usuario u ON c.id_usuario = u.id_usuario
        WHERE t.estado = 'pendiente'
          AND t.fecha_limite BETWEEN ? AND ?
          AND u.preferencias_notificaciones LIKE '%"recordatorio_1h":true%'
          AND u.correo IS NOT NULL
          AND u.correo != ''
      `).all(en1h.toISOString(), new Date(en1h.getTime() + 15 * 60 * 1000).toISOString());

      // Enviar recordatorios 24h
      for (const tarea of tareas24h) {
        try {
          await email.enviarRecordatorioTarea(tarea.correo, tarea.nombre, { ...tarea, curso: tarea.curso }, 24);
          console.log(`[Email] 24h reminder sent to ${tarea.correo} for task ${tarea.titulo}`);
        } catch (e) {
          console.error('[Email] Failed to send 24h reminder:', e.message);
        }
      }

      // Enviar recordatorios 1h
      for (const tarea of tareas1h) {
        try {
          await email.enviarRecordatorioTarea(tarea.correo, tarea.nombre, { ...tarea, curso: tarea.curso }, 1);
          console.log(`[Email] 1h reminder sent to ${tarea.correo} for task ${tarea.titulo}`);
        } catch (e) {
          console.error('[Email] Failed to send 1h reminder:', e.message);
        }
      }
    } catch (err) {
      console.error('[Email] Error in processEmailReminders:', err);
    }
  }

  async function processWeeklyDigest(dbInstance) {
    try {
      console.log('[Email] Processing weekly digest...');
      // Obtener todos los usuarios con email habilitado
      const usuarios = dbInstance.prepare(`
        SELECT id_usuario, nombre, correo
        FROM usuario
        WHERE correo IS NOT NULL AND correo != ''
      `).all();

      for (const user of usuarios) {
        try {
          // Obtener métricas de la semana
          const semanaPasada = new Date(now().getTime() - 7 * 24 * 60 * 60 * 1000);
          const entregadas = dbInstance.prepare(`
            SELECT COUNT(*) as count FROM transaccion_token
            WHERE id_usuario = ? AND cantidad > 0 AND fecha >= ?
          `).get(user.id_usuario, semanaPasada.toISOString());

          const tokensGanados = dbInstance.prepare(`
            SELECT SUM(cantidad) as total FROM transaccion_token
            WHERE id_usuario = ? AND cantidad > 0 AND fecha >= ?
          `).get(user.id_usuario, semanaPasada.toISOString());

          const racha = dbInstance.prepare('SELECT racha_dias FROM usuario WHERE id_usuario = ?').get(user.id_usuario);

          // Próximas a vencer
          const proximas = dbInstance.prepare(`
            SELECT t.titulo, t.fecha_limite, c.nombre as curso
            FROM tarea t
            JOIN curso c ON t.id_curso = c.id_curso
            WHERE c.id_usuario = ? AND t.estado = 'pendiente' AND t.fecha_limite >= ?
            ORDER BY t.fecha_limite ASC LIMIT 5
          `).all(user.id_usuario, now().toISOString());

          const resumen = {
            entregadas: entregadas?.count || 0,
            tokens_ganados: tokensGanados?.total || 0,
            racha_actual: racha?.racha_dias || 0,
            proximas_vencer: proximas
          };

          await email.enviarResumenSemanal(user.correo, user.nombre, resumen);
          console.log(`[Email] Weekly digest sent to ${user.correo}`);
        } catch (e) {
          console.error(`[Email] Failed to send weekly digest to ${user.correo}:`, e.message);
        }
      }
    } catch (err) {
      console.error('[Email] Error in processWeeklyDigest:', err);
    }
  }

  // Apply audit middleware to all API routes
  app.use('/api', auditMiddleware(db));

  // Health check
  app.get('/api/health', (req, res) => res.json({ ok: true, version: require('../../package.json').version, ahora: now().toISOString() }));

  // Rate limiter para endpoints de auth públicos
  const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: { error: 'Demasiadas solicitudes, inténtalo más tarde' },
    standardHeaders: true,
    legacyHeaders: false
  });

  // ============================================================
  // Auth Email/Password (Fase 11)
  // ============================================================
  // POST /api/auth/registro - Registro público
  app.post('/api/auth/registro', authLimiter, wrap(async (req) => auth.registrarUsuario(db, req.body)));

  // POST /api/auth/login - Login email/password
  app.post('/api/auth/login', authLimiter, wrap(async (req) => auth.loginEmailPassword(db, req.body)));

  // GET /api/auth/verificar-email?token= - Verificación email
  app.get('/api/auth/verificar-email', wrap(async (req) => auth.verificarEmail(db, req.query.token)));

  // POST /api/auth/olvide-password - Solicitar reset
  app.post('/api/auth/olvide-password', authLimiter, wrap(async (req) => auth.solicitarResetPassword(db, req.body.correo)));

  // POST /api/auth/reset-password - Reset con token
  app.post('/api/auth/reset-password', wrap(async (req) => auth.resetPassword(db, req.body)));

  // PATCH /api/auth/cambiar-password - Protegido (usuario actual)
  app.patch('/api/auth/cambiar-password', authMiddleware(db), wrap(async (req) => auth.cambiarPassword(db, req.user.id_usuario, req.body)));

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

      // Obtener identidad de Google (sub, email, name)
      const identidad = t.id_token ? oauth.identidad(t.id_token) : null;

      if (identidad?.email) {
        // Buscar si ya existe un usuario con este email
        const existing = db.prepare('SELECT id_usuario, auth_provider FROM usuario WHERE correo = ?').get(identidad.email.toLowerCase());
        if (existing) {
          // Si existe con auth_provider='email', vincular Google
          if (existing.auth_provider === 'email') {
            await auth.vincularGoogle(db, existing.id_usuario, identidad.sub);
          }
          // Guardar credencial y redirigir
          oauth.guardar(db, existing.id_usuario, t, now());
          return res.redirect(302, '/?classroom=ok');
        }

        // Si no existe, crear nuevo usuario con Google
        const nombre = identidad.name || identidad.email.split('@')[0];
        const correo = identidad.email.toLowerCase();
        const google_id = identidad.sub;

        const result = db.prepare(`
          INSERT INTO usuario (google_id, nombre, correo, auth_provider, rol, saldo_tokens, racha_dias, verificado)
          VALUES (?, ?, ?, 'google', 'estudiante', 0, 0, 1)
        `).run(google_id, nombre, correo);

        const newUserId = result.lastInsertRowid;
        oauth.guardar(db, newUserId, t, now());
        return res.redirect(302, '/?classroom=ok');
      }

      // Si no hay email en la identidad, error
      return res.status(400).json({ error: 'No se pudo obtener el email de Google' });
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      return res.status(status).json({ error: e.message });
    }
  });
  app.get('/api/auth/google/estado', authMiddleware(db), wrap(async (req) => {
    const conectado = Boolean(await oauth.tokenValido(db, req.user.id_usuario, now()));
    const u = db.prepare('SELECT nombre, correo, rol FROM usuario WHERE id_usuario = ?').get(req.user.id_usuario);
    return { conectado, nombre: u.nombre, correo: u.correo, rol: u.rol };
  }));
  app.delete('/api/auth/google', authMiddleware(db), wrap(async (req) => { await oauth.desconectar(db, req.user.id_usuario); return { ok: true }; }));

  // ============================================================
  // Perfil de Usuario y Preferencias (Protected with JWT)
  // ============================================================
  // Obtener perfil completo
  app.get('/api/usuario/perfil', authMiddleware(db), wrap(async (req) => usuario.getPerfil(db, req.user.id_usuario)));

  // Actualizar perfil (nombre)
  app.patch('/api/usuario/perfil', authMiddleware(db), wrap(async (req) => usuario.actualizarPerfil(db, req.user.id_usuario, req.body)));

  // Preferencias de notificaciones
  app.get('/api/usuario/preferencias', authMiddleware(db), wrap(async (req) => usuario.getPreferencias(db, req.user.id_usuario)));
  app.patch('/api/usuario/preferencias', authMiddleware(db), wrap(async (req) => usuario.actualizarPreferencias(db, req.user.id_usuario, req.body)));

  // Desconectar Google (wrapper)
  app.delete('/api/usuario/google', authMiddleware(db), wrap(async (req) => usuario.desconectarGoogle(db, req.user.id_usuario)));

  // Eliminar cuenta
  app.delete('/api/usuario/cuenta', authMiddleware(db), wrap(async (req) => usuario.eliminarCuenta(db, req.user.id_usuario)));

  // ============================================================
  // RF-03: Sincronización (Protected with JWT)
  // ============================================================
  app.post('/api/sync', authMiddleware(db), wrap(async (req) => {
    const token = req.get('x-google-token') || await oauth.tokenValido(db, req.user.id_usuario, now());
    const adaptador = token ? googleAdapter(token) : mockAdapter(now());
    return { adaptador: adaptador.nombre, ...(await sincronizar(db, adaptador, now())) };
  }));

  // ============================================================
  // RF-04: Agenda con filtros (Protected with JWT)
  // ============================================================
  app.get('/api/cursos', authMiddleware(db), wrap(async (req) => db.prepare('SELECT id_curso, nombre FROM curso ORDER BY nombre').all()));

  // ============================================================
  // Tareas Personalizadas (Custom Tasks) - MUST come before /api/tareas/:id
  // ============================================================
  app.get('/api/tareas/custom', authMiddleware(db), wrap(async (req) => tareas.listarTareasCustom(db, req.user.id_usuario, { curso: req.query.curso, estado: req.query.estado })));
  app.post('/api/tareas/custom', authMiddleware(db), wrap(async (req) => tareas.crearTareaCustom(db, req.user.id_usuario, req.body)));
  app.patch('/api/tareas/custom/:id', authMiddleware(db), wrap(async (req) => tareas.actualizarTareaCustom(db, req.user.id_usuario, Number(req.params.id), req.body)));
  app.delete('/api/tareas/custom/:id', authMiddleware(db), wrap(async (req) => tareas.eliminarTareaCustom(db, req.user.id_usuario, Number(req.params.id))));

  app.get('/api/tareas/calendario', authMiddleware(db), wrap(async (req) => {
  const mes = req.query.mes; // Format: YYYY-MM
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    throw Object.assign(new Error('Parámetro mes requerido (formato YYYY-MM)'), { status: 400 });
  }
  return tareas.calendario(db, mes, req.user.id_usuario);
}));

app.get('/api/tareas', authMiddleware(db), wrap(async (req) => tareas.listar(db, now(), { curso: req.query.curso, estado: req.query.estado, source: req.query.source })));
  app.get('/api/tareas/:id', authMiddleware(db), wrap(async (req) => {
    const tarea = tareas.obtener(db, now(), Number(req.params.id));
    if (!tarea) throw { status: 404, message: 'Tarea no encontrada' };
    return tarea;
  }));

  // ============================================================
  // RF-05: Seguimiento de avance (Protected with JWT)
  // ============================================================
  app.patch('/api/tareas/:id', authMiddleware(db), wrap(async (req) => {
    tareas.actualizarAvance(db, Number(req.params.id), req.body.avance_pct);
    return { ok: true };
  }));

  // ============================================================
  // RF-07: Entrega completada (otorga tokens) (Protected with JWT)
  // ============================================================
  app.post('/api/tareas/:id/completar', authMiddleware(db), wrap(async (req) => tokens.registrarEntrega(db, Number(req.params.id), now(), { idUsuario: req.user.id_usuario })));

  // ============================================================
  // RF-06: Recordatorios y alertas (Protected with JWT)
  // ============================================================
  app.get('/api/recordatorios/pendientes', authMiddleware(db), wrap(async (req) => reminders.pendientes(db, now())));
  app.post('/api/recordatorios/procesar', authMiddleware(db), wrap(async () => ({ enviados: reminders.procesar(db, now()) })));
  app.get('/api/alertas', authMiddleware(db), wrap(async () => alertas.generar(db, now())));

  // ============================================================
  // Notificaciones (Centro de Notificaciones - Fase 4)
  // ============================================================
  app.get('/api/notificaciones', authMiddleware(db), wrap(async (req) => {
    const { tipo, leida, limit = 50, offset = 0 } = req.query;
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (leida !== undefined) filtros.leida = leida === 'true';
    filtros.limit = Number(limit);
    filtros.offset = Number(offset);
    const items = notificaciones.listar(db, req.user.id_usuario, filtros);
    const total = notificaciones.contar(db, req.user.id_usuario, { tipo: filtros.tipo, leida: filtros.leida });
    return { items, total, limit: filtros.limit, offset: filtros.offset };
  }));

  app.patch('/api/notificaciones/:id/leer', authMiddleware(db), wrap(async (req) => {
    return notificaciones.marcarLeida(db, req.user.id_usuario, Number(req.params.id));
  }));

  app.post('/api/notificaciones/leer-todas', authMiddleware(db), wrap(async (req) => {
    return notificaciones.marcarTodasLeidas(db, req.user.id_usuario);
  }));

  // ============================================================
  // RF-08 / RF-09: Tokens y recompensas (Protected with JWT)
  // ============================================================
  app.get('/api/tokens', authMiddleware(db), wrap(async (req) => ({
    ...db.prepare('SELECT saldo_tokens, racha_dias FROM usuario WHERE id_usuario = ?').get(req.user.id_usuario),
    historial: db.prepare('SELECT * FROM transaccion_token WHERE id_usuario = ? ORDER BY fecha DESC, id_transaccion DESC LIMIT 50').all(req.user.id_usuario),
  })));
  app.get('/api/recompensas', authMiddleware(db), wrap(async () => db.prepare('SELECT * FROM recompensa WHERE activa = 1 ORDER BY costo_tokens').all()));
  app.post('/api/recompensas/:id/canjear', authMiddleware(db), wrap(async (req) => tokens.canjear(db, Number(req.params.id), now())));

  // ============================================================
  // RF-12: Indicadores (Protected with JWT)
  // ============================================================
  app.get('/api/metricas', authMiddleware(db), wrap(async (req) => tareas.metricas(db, now())));

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

  // Tareas (Admin)
  app.get('/api/admin/tareas', adminMiddleware, wrap(async (req) => {
    const { usuario, curso, estado, fechaDesde, fechaHasta, limit = 50, offset = 0 } = req.query;
    const items = admin.listTareasAdmin(db, {
      usuario: usuario ? Number(usuario) : undefined,
      curso: curso ? Number(curso) : undefined,
      estado,
      fechaDesde,
      fechaHasta,
      limit: Number(limit),
      offset: Number(offset)
    });
    const total = admin.countTareasAdmin(db, {
      usuario: usuario ? Number(usuario) : undefined,
      curso: curso ? Number(curso) : undefined,
      estado,
      fechaDesde,
      fechaHasta
    });
    return { items, total, limit: Number(limit), offset: Number(offset) };
  }));
  app.get('/api/admin/tareas/:id', adminMiddleware, wrap(async (req) => {
    const tarea = admin.getTareaAdmin(db, Number(req.params.id));
    if (!tarea) throw { status: 404, message: 'Tarea no encontrada' };
    return tarea;
  }));
  app.post('/api/admin/tareas', adminMiddleware, wrap(async (req) => admin.crearTareaAdmin(db, req.body)));
  app.patch('/api/admin/tareas/:id', adminMiddleware, wrap(async (req) => admin.actualizarTareaAdmin(db, Number(req.params.id), req.body)));
  app.delete('/api/admin/tareas/:id', adminMiddleware, wrap(async (req) => admin.eliminarTareaAdmin(db, Number(req.params.id))));

  // Auditoría (Admin)
  app.get('/api/admin/auditoria', adminMiddleware, wrap(async (req) => {
    const { usuario, accion, entidad, fechaDesde, fechaHasta, limit = 50, offset = 0 } = req.query;
    const items = admin.listarAuditoria(db, {
      usuario: usuario ? Number(usuario) : undefined,
      accion,
      entidad,
      fechaDesde,
      fechaHasta,
      limit: Number(limit),
      offset: Number(offset)
    });
    const total = admin.countAuditoria(db, {
      usuario: usuario ? Number(usuario) : undefined,
      accion,
      entidad,
      fechaDesde,
      fechaHasta
    });
    return { items, total, limit: Number(limit), offset: Number(offset) };
  }));
  app.get('/api/admin/auditoria/acciones', adminMiddleware, wrap(async () => admin.getAccionesAuditoria(db)));
  app.get('/api/admin/auditoria/entidades', adminMiddleware, wrap(async () => admin.getEntidadesAuditoria(db)));

  // Exportar datos (Admin)
  app.get('/api/admin/exportar', adminMiddleware, wrap(async (req) => {
    const { tipo = 'usuarios', formato = 'csv', ...filtros } = req.query;

    const tiposValidos = ['usuarios', 'cursos', 'tareas', 'recompensas', 'tokens', 'auditoria'];
    if (!tiposValidos.includes(tipo)) {
      throw { status: 400, message: 'Tipo de exportación no válido' };
    }

    const formatosValidos = ['csv', 'json'];
    if (!formatosValidos.includes(formato)) {
      throw { status: 400, message: 'Formato no válido (csv o json)' };
    }

    let result;
    if (formato === 'csv') {
      result = admin.exportarCSV(db, tipo, filtros);
      const csv = admin.toCSV(result);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csv);
    } else {
      result = admin.exportarJSON(db, tipo, filtros);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.json"`);
      return res.send(result);
    }
  }));

  // ============================================================
  // Email Background Jobs (Fase 12)
  // ============================================================
  // Solo ejecutar en producción/desarrollo, no en tests
  if (!process.env.CAPU_FIXED_NOW) {
    // Procesar recordatorios de tareas cada 15 minutos
    const EMAIL_REMINDER_INTERVAL_MS = 15 * 60 * 1000;
    setInterval(() => {
      processEmailReminders(db);
    }, EMAIL_REMINDER_INTERVAL_MS);
    console.log('[Email] Background job started: email reminders every 15 minutes');

    // Procesar resumen semanal cada día a las 9:00 AM
    const checkWeeklyDigest = () => {
      const now = new Date();
      // Verificar si es lunes a las 9:00 AM (o configurar según necesidad)
      if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 5) {
        processWeeklyDigest(db);
      }
    };
    setInterval(checkWeeklyDigest, 60 * 1000); // Check every minute
    console.log('[Email] Background job started: weekly digest check every minute');
  }

  // Admin: Test email configuration
  app.post('/api/admin/email/test', adminMiddleware, wrap(async (req) => {
    const { to, template = 'test' } = req.body;
    const config = email.cargarConfigEmail();

    if (!config.auth.user || !config.auth.pass) {
      throw { status: 400, message: 'SMTP no configurado. Define SMTP_USER y SMTP_PASS en .env' };
    }

    try {
      // Test SMTP connection
      await email.testEmailConfig(config);

      // If email provided, send test email
      if (to) {
        const testHtml = `
          <p>Este es un email de prueba de CAPU.</p>
          <p>Si recibes este email, la configuración SMTP funciona correctamente.</p>
          <p>Plantilla: ${template}</p>
        `;
        await email.enviarEmail({
          to,
          subject: 'CAPU - Test de configuración SMTP',
          html: email.baseTemplate({ title: 'Test SMTP', content: testHtml })
        });
      }

      return { ok: true, message: 'Configuración SMTP válida' + (to ? `, email de prueba enviado a ${to}` : '') };
    } catch (err) {
      throw { status: 500, message: err.message };
    }
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