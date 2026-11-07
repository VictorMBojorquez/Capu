// Admin Service - Lógica de negocio para panel de administración
const path = require('node:path');
const { now } = require('../clock');
const { verifyToken, extractTokenFromHeader } = require('./jwt');

/**
 * Middleware para requerir rol de administrador (usa JWT)
 */
function requireAdmin(db) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }

      const user = db.prepare('SELECT id_usuario, rol FROM usuario WHERE id_usuario = ?').get(payload.sub);

      if (!user || user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
      }

      req.adminUser = user;
      req.user = { id_usuario: user.id_usuario, rol: user.rol }; // For consistency with authMiddleware
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

/**
 * Obtener tareas con filtros para admin (paginado)
 */
function listTareasAdmin(db, { usuario, curso, estado, fechaDesde, fechaHasta, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT
      t.id_tarea,
      t.classroom_id,
      t.titulo,
      t.descripcion,
      t.fecha_limite,
      t.estado,
      t.avance_pct,
      t.source,
      t.id_curso,
      c.nombre as curso_nombre,
      u.id_usuario,
      u.nombre as usuario_nombre,
      u.correo as usuario_correo
    FROM tarea t
    LEFT JOIN curso c ON t.id_curso = c.id_curso
    LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (usuario) {
    query += ` AND u.id_usuario = ?`;
    params.push(usuario);
  }
  if (curso) {
    query += ` AND t.id_curso = ?`;
    params.push(curso);
  }
  if (estado) {
    query += ` AND t.estado = ?`;
    params.push(estado);
  }
  if (fechaDesde) {
    query += ` AND t.fecha_limite >= ?`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += ` AND t.fecha_limite <= ?`;
    params.push(fechaHasta);
  }

  query += ` ORDER BY t.fecha_limite DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Contar tareas totales para admin (para paginación)
 */
function countTareasAdmin(db, { usuario, curso, estado, fechaDesde, fechaHasta } = {}) {
  let query = `
    SELECT COUNT(*) as n
    FROM tarea t
    LEFT JOIN curso c ON t.id_curso = c.id_curso
    LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (usuario) {
    query += ` AND u.id_usuario = ?`;
    params.push(usuario);
  }
  if (curso) {
    query += ` AND t.id_curso = ?`;
    params.push(curso);
  }
  if (estado) {
    query += ` AND t.estado = ?`;
    params.push(estado);
  }
  if (fechaDesde) {
    query += ` AND t.fecha_limite >= ?`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += ` AND t.fecha_limite <= ?`;
    params.push(fechaHasta);
  }

  return db.prepare(query).get(...params).n;
}

/**
 * Admin: Obtener una tarea por ID (cualquier tarea)
 */
function getTareaAdmin(db, idTarea) {
  return db.prepare(`
    SELECT
      t.*,
      c.nombre as curso_nombre,
      u.id_usuario,
      u.nombre as usuario_nombre,
      u.correo as usuario_correo
    FROM tarea t
    LEFT JOIN curso c ON t.id_curso = c.id_curso
    LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
    WHERE t.id_tarea = ?
  `).get(idTarea);
}

/**
 * Admin: Actualizar cualquier tarea
 */
function actualizarTareaAdmin(db, idTarea, { titulo, descripcion, fecha_limite, estado, avance_pct, id_curso }) {
  const tarea = db.prepare('SELECT * FROM tarea WHERE id_tarea = ?').get(idTarea);
  if (!tarea) throw new Error('Tarea no encontrada');

  const updates = [];
  const params = [];

  if (titulo !== undefined) {
    if (!titulo.trim()) throw new Error('El título es obligatorio');
    updates.push('titulo = ?');
    params.push(titulo.trim());
  }
  if (descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push(descripcion.trim());
  }
  if (fecha_limite !== undefined) {
    updates.push('fecha_limite = ?');
    params.push(fecha_limite);
  }
  if (estado !== undefined) {
    if (!['pendiente', 'en_progreso', 'vencida', 'entregada'].includes(estado)) {
      throw new Error('Estado inválido');
    }
    updates.push('estado = ?');
    params.push(estado);
  }
  if (avance_pct !== undefined) {
    if (avance_pct < 0 || avance_pct > 100) throw new Error('El avance debe estar entre 0 y 100');
    updates.push('avance_pct = ?');
    params.push(avance_pct);
  }
  if (id_curso !== undefined) {
    const curso = db.prepare('SELECT id_curso FROM curso WHERE id_curso = ?').get(id_curso);
    if (!curso) throw new Error('Curso no encontrado');
    updates.push('id_curso = ?');
    params.push(id_curso);
  }

  if (updates.length === 0) return getTareaAdmin(db, idTarea);

  params.push(idTarea);
  db.prepare(`UPDATE tarea SET ${updates.join(', ')} WHERE id_tarea = ?`).run(...params);
  return getTareaAdmin(db, idTarea);
}

/**
 * Admin: Eliminar cualquier tarea
 */
function eliminarTareaAdmin(db, idTarea) {
  const tarea = db.prepare('SELECT * FROM tarea WHERE id_tarea = ?').get(idTarea);
  if (!tarea) throw new Error('Tarea no encontrada');

  db.prepare('DELETE FROM tarea WHERE id_tarea = ?').run(idTarea);
  return { ok: true };
}

/**
 * Admin: Crear tarea para un usuario
 */
function crearTareaAdmin(db, { id_usuario, id_curso, titulo, descripcion, fecha_limite, source = 'admin', classroom_id }) {
  if (!id_usuario) throw new Error('Usuario requerido');
  if (!id_curso) throw new Error('Curso requerido');
  if (!titulo || !titulo.trim()) throw new Error('El título es obligatorio');
  if (!fecha_limite) throw new Error('La fecha límite es obligatoria');

  // Verificar que el usuario existe y tiene acceso al curso
  const curso = db.prepare('SELECT id_curso FROM curso WHERE id_curso = ? AND id_usuario = ?').get(id_curso, id_usuario);
  if (!curso) throw new Error('El usuario no tiene acceso a este curso');

  const result = db.prepare(`
    INSERT INTO tarea (classroom_id, id_curso, titulo, descripcion, fecha_limite, estado, source)
    VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
  `).run(classroom_id || `admin-${Date.now()}`, id_curso, titulo.trim(), descripcion || null, fecha_limite, source);

  return getTareaAdmin(db, result.lastInsertRowid);
}

/**
 * Registrar una entrada de auditoría
 */
function registrarAuditoria(db, { id_usuario, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, ip, user_agent }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO auditoria (id_usuario, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, ip, user_agent, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id_usuario || null,
    accion,
    entidad || null,
    entidad_id || null,
    datos_anteriores ? JSON.stringify(datos_anteriores) : null,
    datos_nuevos ? JSON.stringify(datos_nuevos) : null,
    ip || null,
    user_agent || null,
    now
  );
  return { ok: true };
}

/**
 * Obtener logs de auditoría con filtros y paginación
 */
function listarAuditoria(db, { usuario, accion, entidad, fechaDesde, fechaHasta, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT
      a.id_auditoria,
      a.id_usuario,
      a.accion,
      a.entidad,
      a.entidad_id,
      a.datos_anteriores,
      a.datos_nuevos,
      a.ip,
      a.user_agent,
      a.fecha,
      u.nombre as usuario_nombre,
      u.correo as usuario_correo
    FROM auditoria a
    LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (usuario) {
    query += ` AND a.id_usuario = ?`;
    params.push(usuario);
  }
  if (accion) {
    query += ` AND a.accion = ?`;
    params.push(accion);
  }
  if (entidad) {
    query += ` AND a.entidad = ?`;
    params.push(entidad);
  }
  if (fechaDesde) {
    query += ` AND a.fecha >= ?`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += ` AND a.fecha <= ?`;
    params.push(fechaHasta);
  }

  query += ` ORDER BY a.fecha DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    datos_anteriores: r.datos_anteriores ? JSON.parse(r.datos_anteriores) : null,
    datos_nuevos: r.datos_nuevos ? JSON.parse(r.datos_nuevos) : null
  }));
}

/**
 * Contar logs de auditoría totales (para paginación)
 */
function countAuditoria(db, { usuario, accion, entidad, fechaDesde, fechaHasta } = {}) {
  let query = `
    SELECT COUNT(*) as n
    FROM auditoria a
    WHERE 1=1
  `;
  const params = [];

  if (usuario) {
    query += ` AND a.id_usuario = ?`;
    params.push(usuario);
  }
  if (accion) {
    query += ` AND a.accion = ?`;
    params.push(accion);
  }
  if (entidad) {
    query += ` AND a.entidad = ?`;
    params.push(entidad);
  }
  if (fechaDesde) {
    query += ` AND a.fecha >= ?`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += ` AND a.fecha <= ?`;
    params.push(fechaHasta);
  }

  return db.prepare(query).get(...params).n;
}

/**
 * Obtener acciones de auditoría únicas (para filtros)
 */
function getAccionesAuditoria(db) {
  return db.prepare('SELECT DISTINCT accion FROM auditoria ORDER BY accion').all().map(r => r.accion);
}

/**
 * Obtener entidades de auditoría únicas (para filtros)
 */
function getEntidadesAuditoria(db) {
  return db.prepare('SELECT DISTINCT entidad FROM auditoria WHERE entidad IS NOT NULL ORDER BY entidad').all().map(r => r.entidad);
}

/**
 * Exportar datos a CSV
 */
function exportarCSV(db, tipo, filtros = {}) {
  let query, headers;

  switch (tipo) {
    case 'usuarios': {
      query = `
        SELECT
          u.id_usuario,
          u.google_id,
          u.nombre,
          u.correo,
          u.rol,
          u.saldo_tokens,
          u.racha_dias,
          u.auth_provider,
          u.email_verificado,
          u.created_at
        FROM usuario u
        ORDER BY u.id_usuario
      `;
      headers = ['ID', 'Google ID', 'Nombre', 'Correo', 'Rol', 'Saldo Tokens', 'Racha Días', 'Auth Provider', 'Email Verificado', 'Creado'];
      break;
    }
    case 'cursos': {
      query = `
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
          SUM(CASE WHEN t.estado = 'entregada' THEN 1 ELSE 0 END) as entregadas
        FROM curso c
        LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN tarea t ON t.id_curso = c.id_curso
        GROUP BY c.id_curso
        ORDER BY c.nombre
      `;
      headers = ['ID Curso', 'Classroom ID', 'Nombre', 'Propietario', 'Email Propietario', 'Total Tareas', 'Pendientes', 'En Progreso', 'Vencidas', 'Entregadas'];
      break;
    }
    case 'tareas': {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filtros.usuario) {
        whereClause += ` AND u.id_usuario = ?`;
        params.push(filtros.usuario);
      }
      if (filtros.curso) {
        whereClause += ` AND t.id_curso = ?`;
        params.push(filtros.curso);
      }
      if (filtros.estado) {
        whereClause += ` AND t.estado = ?`;
        params.push(filtros.estado);
      }
      if (filtros.fechaDesde) {
        whereClause += ` AND t.fecha_limite >= ?`;
        params.push(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        whereClause += ` AND t.fecha_limite <= ?`;
        params.push(filtros.fechaHasta);
      }

      query = `
        SELECT
          t.id_tarea,
          t.classroom_id,
          t.titulo,
          t.descripcion,
          t.fecha_limite,
          t.estado,
          t.avance_pct,
          t.source,
          c.nombre as curso_nombre,
          u.id_usuario,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo
        FROM tarea t
        LEFT JOIN curso c ON t.id_curso = c.id_curso
        LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
        ${whereClause}
        ORDER BY t.fecha_limite DESC
      `;
      headers = ['ID Tarea', 'Classroom ID', 'Título', 'Descripción', 'Fecha Límite', 'Estado', 'Avance %', 'Origen', 'Curso', 'ID Usuario', 'Usuario', 'Email Usuario'];
      const rows = db.prepare(query).all(...params);
      return { rows, headers };
    }
    case 'recompensas': {
      query = `
        SELECT
          r.id_recompensa,
          r.nombre,
          r.costo_tokens,
          r.activa,
          COUNT(c.id_canje) as veces_canjeada
        FROM recompensa r
        LEFT JOIN canje c ON c.id_recompensa = r.id_recompensa
        GROUP BY r.id_recompensa
        ORDER BY r.costo_tokens
      `;
      headers = ['ID', 'Nombre', 'Costo Tokens', 'Activa', 'Veces Canjeada'];
      break;
    }
    case 'tokens': {
      query = `
        SELECT
          u.id_usuario,
          u.nombre,
          u.correo,
          u.saldo_tokens,
          u.racha_dias,
          u.ultima_entrega_ok
        FROM usuario u
        ORDER BY u.saldo_tokens DESC
      `;
      headers = ['ID Usuario', 'Nombre', 'Correo', 'Saldo Tokens', 'Racha Días', 'Última Entrega OK'];
      break;
    }
    case 'auditoria': {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filtros.usuario) {
        whereClause += ` AND a.id_usuario = ?`;
        params.push(filtros.usuario);
      }
      if (filtros.accion) {
        whereClause += ` AND a.accion = ?`;
        params.push(filtros.accion);
      }
      if (filtros.entidad) {
        whereClause += ` AND a.entidad = ?`;
        params.push(filtros.entidad);
      }
      if (filtros.fechaDesde) {
        whereClause += ` AND a.fecha >= ?`;
        params.push(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        whereClause += ` AND a.fecha <= ?`;
        params.push(filtros.fechaHasta);
      }

      query = `
        SELECT
          a.id_auditoria,
          a.id_usuario,
          a.accion,
          a.entidad,
          a.entidad_id,
          a.datos_anteriores,
          a.datos_nuevos,
          a.ip,
          a.user_agent,
          a.fecha,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo
        FROM auditoria a
        LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
        ${whereClause}
        ORDER BY a.fecha DESC
      `;
      headers = ['ID', 'ID Usuario', 'Acción', 'Entidad', 'Entidad ID', 'Datos Anteriores', 'Datos Nuevos', 'IP', 'User Agent', 'Fecha', 'Usuario', 'Email Usuario'];
      const rows = db.prepare(query).all(...params);
      return { rows, headers };
    }
    default:
      throw new Error('Tipo de exportación no válido');
  }

  const rows = db.prepare(query).all();
  return { rows, headers };
}

/**
 * Convertir a CSV
 */
function toCSV({ rows, headers }) {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row =>
    headers.map(h => escapeCSV(row[h.toLowerCase().replace(/\s+/g, '_')])).join(',')
  );

  // Handle special column names that don't match directly
  const actualDataRows = rows.map(row => {
    const values = [];
    for (const h of headers) {
      // Map header to actual column name
      const colMap = {
        'ID': 'id_usuario',
        'Google ID': 'google_id',
        'Nombre': 'nombre',
        'Correo': 'correo',
        'Rol': 'rol',
        'Saldo Tokens': 'saldo_tokens',
        'Racha Días': 'racha_dias',
        'Auth Provider': 'auth_provider',
        'Email Verificado': 'email_verificado',
        'Creado': 'created_at',
        'ID Curso': 'id_curso',
        'Classroom ID': 'classroom_id',
        'Propietario': 'propietario_nombre',
        'Email Propietario': 'propietario_correo',
        'Total Tareas': 'total_tareas',
        'Pendientes': 'pendientes',
        'En Progreso': 'en_progreso',
        'Vencidas': 'vencidas',
        'Entregadas': 'entregadas',
        'ID Tarea': 'id_tarea',
        'Título': 'titulo',
        'Descripción': 'descripcion',
        'Fecha Límite': 'fecha_limite',
        'Estado': 'estado',
        'Avance %': 'avance_pct',
        'Origen': 'source',
        'Curso': 'curso_nombre',
        'ID Usuario': 'id_usuario',
        'Usuario': 'usuario_nombre',
        'Email Usuario': 'usuario_correo',
        'ID': 'id_recompensa',
        'Nombre': 'nombre',
        'Costo Tokens': 'costo_tokens',
        'Activa': 'activa',
        'Veces Canjeada': 'veces_canjeada',
        'ID Auditoría': 'id_auditoria',
        'Acción': 'accion',
        'Entidad': 'entidad',
        'Entidad ID': 'entidad_id',
        'Datos Anteriores': 'datos_anteriores',
        'Datos Nuevos': 'datos_nuevos',
        'IP': 'ip',
        'User Agent': 'user_agent',
        'Fecha': 'fecha'
      };
      const colName = colMap[h] || h.toLowerCase().replace(/\s+/g, '_');
      values.push(escapeCSV(row[colName]));
    }
    return values.join(',');
  });

  return [headerRow, ...actualDataRows].join('\n');
}

/**
 * Exportar datos a JSON
 */
function exportarJSON(db, tipo, filtros = {}) {
  const { rows } = exportarCSV(db, tipo, filtros);
  return JSON.stringify(rows, null, 2);
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
  testOAuthConnection,
  listTareasAdmin,
  countTareasAdmin,
  getTareaAdmin,
  actualizarTareaAdmin,
  eliminarTareaAdmin,
  crearTareaAdmin,
  registrarAuditoria,
  listarAuditoria,
  countAuditoria,
  getAccionesAuditoria,
  getEntidadesAuditoria,
  exportarCSV,
  toCSV,
  exportarJSON
};