const { now } = require('../clock');

/**
 * Obtener notificaciones del usuario con filtros y paginación
 */
function listar(db, userId, { tipo, leida, limit = 50, offset = 0 } = {}) {
  let query = `SELECT * FROM notificacion WHERE id_usuario = ?`;
  const params = [userId];

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }
  if (leida !== undefined) {
    query += ` AND leida = ?`;
    params.push(leida ? 1 : 0);
  }

  query += ` ORDER BY fecha DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const filas = db.prepare(query).all(...params);
  return filas.map(f => ({
    ...f,
    leida: Boolean(f.leida),
    datos: f.datos_json ? JSON.parse(f.datos_json) : null
  }));
}

/**
 * Contar notificaciones totales (para paginación)
 */
function contar(db, userId, { tipo, leida } = {}) {
  let query = `SELECT COUNT(*) as n FROM notificacion WHERE id_usuario = ?`;
  const params = [userId];

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }
  if (leida !== undefined) {
    query += ` AND leida = ?`;
    params.push(leida ? 1 : 0);
  }

  return db.prepare(query).get(...params).n;
}

/**
 * Marcar notificación como leída
 */
function marcarLeida(db, userId, notificacionId) {
  const result = db.prepare(`
    UPDATE notificacion SET leida = 1 WHERE id_notificacion = ? AND id_usuario = ?
  `).run(notificacionId, userId);
  return { ok: result.changes > 0 };
}

/**
 * Marcar todas las notificaciones como leídas
 */
function marcarTodasLeidas(db, userId) {
  const result = db.prepare(`
    UPDATE notificacion SET leida = 1 WHERE id_usuario = ? AND leida = 0
  `).run(userId);
  return { ok: true, count: result.changes };
}

/**
 * Crear notificación (uso interno)
 */
function crear(db, userId, { tipo, titulo, mensaje, datos }) {
  const result = db.prepare(`
    INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje, datos_json, fecha, leida)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(userId, tipo, titulo, mensaje || null, datos ? JSON.stringify(datos) : null, now().toISOString());

  return { id_notificacion: result.lastInsertRowid };
}

/**
 * Crear notificaciones para entrega completada
 */
function notificarEntrega(db, userId, tarea) {
  return crear(db, userId, {
    tipo: 'entrega',
    titulo: 'Tarea entregada',
    mensaje: `Has entregado "${tarea.titulo}"`,
    datos: { id_tarea: tarea.id_tarea, id_curso: tarea.id_curso }
  });
}

/**
 * Crear notificaciones para recordatorio
 */
function notificarRecordatorio(db, userId, tarea, horas) {
  return crear(db, userId, {
    tipo: 'recordatorio',
    titulo: 'Recordatorio de entrega',
    mensaje: `La tarea "${tarea.titulo}" vence en ${horas} hora${horas > 1 ? 's' : ''}`,
    datos: { id_tarea: tarea.id_tarea, id_curso: tarea.id_curso, horas }
  });
}

/**
 * Crear notificaciones para tarea vencida
 */
function notificarVencida(db, userId, tarea) {
  return crear(db, userId, {
    tipo: 'vencida',
    titulo: 'Tarea vencida',
    mensaje: `La tarea "${tarea.titulo}" ha vencido sin ser entregada`,
    datos: { id_tarea: tarea.id_tarea, id_curso: tarea.id_curso }
  });
}

/**
 * Crear notificaciones de sistema
 */
function notificarSistema(db, userId, { titulo, mensaje, datos }) {
  return crear(db, userId, {
    tipo: 'sistema',
    titulo,
    mensaje,
    datos
  });
}

/**
 * Crear notificaciones de recompensa
 */
function notificarRecompensa(db, userId, recompensa) {
  return crear(db, userId, {
    tipo: 'recompensa',
    titulo: '¡Recompensa canjeada!',
    mensaje: `Has canjeado "${recompensa.nombre}" por ${recompensa.costo_tokens} tokens`,
    datos: { id_recompensa: recompensa.id_recompensa, costo: recompensa.costo_tokens }
  });
}

module.exports = {
  listar,
  contar,
  marcarLeida,
  marcarTodasLeidas,
  crear,
  notificarEntrega,
  notificarRecordatorio,
  notificarVencida,
  notificarSistema,
  notificarRecompensa
};