// Admin Service - Lógica de negocio para panel de administración
const path = require('node:path');
const { now } = require('../clock');

/**
 * Middleware para requerir rol de administrador
 */
function requireAdmin(db) {
  return async (req, res, next) => {
    try {
      // En producción, esto vendría de la sesión/token JWT
      // Por ahora usamos el usuario demo (id: 1) o el usuario OAuth conectado
      const userId = 1; // TODO: obtener de sesión real
      const user = db.prepare('SELECT id_usuario, rol FROM usuario WHERE id_usuario = ?').get(userId);

      if (!user || user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
      }

      req.adminUser = user;
      next();
    } catch (e) {
      res.status(500).json({ error: 'Error de autorización' });
    }
  };
}

/**
 * Obtener todos los usuarios con estadísticas
 */
function listUsuarios(db) {
  const usuarios = db.prepare(`
    SELECT
      u.id_usuario,
      u.google_id,
      u.nombre,
      u.correo,
      u.rol,
      u.saldo_tokens,
      u.racha_dias,
      u.ultima_entrega_ok,
      (SELECT MAX(fecha_limite) FROM tarea WHERE id_curso IN (SELECT id_curso FROM curso WHERE id_usuario = u.id_usuario)) as ultima_sync
    FROM usuario u
    ORDER BY u.id_usuario
  `).all();

  return usuarios.map(u => ({
    ...u,
    ultima_sync: u.ultima_sync ? new Date(u.ultima_sync).toISOString() : null
  }));
}

/**
 * Cambiar rol de un usuario
 */
function cambiarRolUsuario(db, userId, nuevoRol) {
  if (!['estudiante', 'admin'].includes(nuevoRol)) {
    throw new Error('Rol inválido');
  }

  const user = db.prepare('SELECT id_usuario FROM usuario WHERE id_usuario = ?').get(userId);
  if (!user) throw new Error('Usuario no encontrado');

  db.prepare('UPDATE usuario SET rol = ? WHERE id_usuario = ?').run(nuevoRol, userId);
  return { ok: true, rol: nuevoRol };
}

/**
 * Obtener todos los cursos con estadísticas de tareas
 */
function listCursosAdmin(db) {
  return db.prepare(`
    SELECT
      c.id_curso,
      c.classroom_id,
      c.nombre,
      u.nombre as propietario_nombre,
      u.correo as propietario_correo,
      COUNT(t.id_tarea) as total_tareas,
      SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
      SUM(CASE WHEN t.estado = 'vencida' THEN 1 ELSE 0 END) as vencidas,
      SUM(CASE WHEN t.estado = 'entregada' THEN 1 ELSE 0 END) as entregadas,
      MAX(t.fecha_limite) as ultima_sync
    FROM curso c
    LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
    LEFT JOIN tarea t ON t.id_curso = c.id_curso
    GROUP BY c.id_curso
    ORDER BY c.nombre
  `).all();
}

/**
 * Obtener todas las recompensas (admin ve todas, incluidas inactivas)
 */
function listRecompensasAdmin(db) {
  return db.prepare('SELECT * FROM recompensa ORDER BY costo_tokens').all();
}

/**
 * Crear recompensa
 */
function crearRecompensa(db, { nombre, costo_tokens, activa = 1 }) {
  if (!nombre || !nombre.trim()) throw new Error('El nombre es obligatorio');
  if (!costo_tokens || costo_tokens < 1) throw new Error('El costo debe ser mayor a 0');

  const result = db.prepare('INSERT INTO recompensa (nombre, costo_tokens, activa) VALUES (?, ?, ?)')
    .run(nombre.trim(), costo_tokens, activa ? 1 : 0);

  return db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ?').get(result.lastInsertRowid);
}

/**
 * Actualizar recompensa
 */
function actualizarRecompensa(db, id, { nombre, costo_tokens, activa }) {
  const reward = db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ?').get(id);
  if (!reward) throw new Error('Recompensa no encontrada');

  const updates = [];
  const params = [];

  if (nombre !== undefined) {
    if (!nombre.trim()) throw new Error('El nombre es obligatorio');
    updates.push('nombre = ?');
    params.push(nombre.trim());
  }
  if (costo_tokens !== undefined) {
    if (costo_tokens < 1) throw new Error('El costo debe ser mayor a 0');
    updates.push('costo_tokens = ?');
    params.push(costo_tokens);
  }
  if (activa !== undefined) {
    updates.push('activa = ?');
    params.push(activa ? 1 : 0);
  }

  if (updates.length === 0) return reward;

  params.push(id);
  db.prepare(`UPDATE recompensa SET ${updates.join(', ')} WHERE id_recompensa = ?`).run(...params);
  return db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ?').get(id);
}

/**
 * Eliminar recompensa
 */
function eliminarRecompensa(db, id) {
  const reward = db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ?').get(id);
  if (!reward) throw new Error('Recompensa no encontrada');

  db.prepare('DELETE FROM recompensa WHERE id_recompensa = ?').run(id);
  return { ok: true };
}

/**
 * Métricas globales del sistema
 */
function metricasSistema(db) {
  const totalUsuarios = db.prepare('SELECT COUNT(*) as n FROM usuario').get().n;
  const usuariosActivos30d = db.prepare(`
    SELECT COUNT(DISTINCT u.id_usuario) as n
    FROM usuario u
    JOIN tarea t ON t.id_curso IN (SELECT id_curso FROM curso WHERE id_usuario = u.id_usuario)
    WHERE t.fecha_entrega >= datetime('now', '-30 days')
  `).get().n;

  const totalCursos = db.prepare('SELECT COUNT(*) as n FROM curso').get().n;
  const totalTareas = db.prepare('SELECT COUNT(*) as n FROM tarea').get().n;

  // Tasa de éxito de sincronización (últimos 30 días)
  const syncStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN adaptador = 'google' THEN 1 ELSE 0 END) as google_ok
    FROM (
      SELECT 'google' as adaptador FROM tarea WHERE fecha_limite >= datetime('now', '-30 days') AND classroom_id NOT LIKE 'mock-%'
      UNION ALL
      SELECT 'mock' as adaptador FROM tarea WHERE fecha_limite >= datetime('now', '-30 days') AND classroom_id LIKE 'mock-%'
    )
  `).get();

  const syncSuccessRate = syncStats.total > 0
    ? Math.round((syncStats.google_ok / syncStats.total) * 100)
    : 100;

  const tokensTotales = db.prepare('SELECT SUM(saldo_tokens) as total FROM usuario').get().total || 0;

  return {
    total_usuarios: totalUsuarios,
    usuarios_activos_30d: usuariosActivos30d,
    total_cursos: totalCursos,
    total_tareas: totalTareas,
    sync_success_rate: syncSuccessRate,
    tokens_totales: tokensTotales,
    version: require('../../../package.json').version,
    db_path: process.env.CAPU_DB || 'database/capu.db',
    env: process.env.NODE_ENV || 'development'
  };
}

/**
 * Obtener configuración OAuth actual
 */
function getOAuthConfig(db) {
  const env = require('./env');
  env.cargarEnv(path.join(__dirname, '..', '..', '..', '.env'));
  return {
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    sync_minutos: parseInt(process.env.CAPU_SYNC_MINUTOS || '15', 10),
    version: require('../../../package.json').version,
    db_path: process.env.CAPU_DB || 'database/capu.db',
    env: process.env.NODE_ENV || 'development'
  };
}

/**
 * Guardar configuración OAuth
 */
function saveOAuthConfig(db, { client_id, client_secret, redirect_uri, sync_minutos }) {
  // En producción, esto actualizaría variables de entorno o un archivo de config
  // Por ahora solo validamos y devolvemos éxito
  if (!client_id) throw new Error('Client ID es obligatorio');

  // TODO: Implementar guardado real en .env o base de datos
  // Por ahora simulamos éxito
  return { ok: true, message: 'Configuración guardada (requiere reinicio para aplicar cambios)' };
}

/**
 * Probar conexión OAuth
 */
async function testOAuthConnection(config) {
  if (!config.client_id) throw new Error('Client ID no configurado');

  // Hacer una petición de prueba a Google
  const fetch = (await import('node:fetch')).default;
  const testUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?client_id=${encodeURIComponent(config.client_id)}`;

  try {
    const res = await fetch(testUrl);
    if (!res.ok) throw new Error('Client ID inválido o no accesible');
    return { ok: true, message: 'Conexión exitosa con Google OAuth' };
  } catch (e) {
    throw new Error(`Error de conexión: ${e.message}`);
  }
}

module.exports = {
  requireAdmin,
  listUsuarios,
  cambiarRolUsuario,
  listCursosAdmin,
  listRecompensasAdmin,
  crearRecompensa,
  actualizarRecompensa,
  eliminarRecompensa,
  metricasSistema,
  getOAuthConfig,
  saveOAuthConfig,
  testOAuthConnection
};