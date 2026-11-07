/** Estado visible: 'vencida' se deriva (no se guarda) si pasó la fecha límite sin entrega. */
function estadoVisible(t, ahora) {
  if (t.estado === 'entregada') return 'entregada';
  if (new Date(t.fecha_limite) < new Date(ahora)) return 'vencida';
  return t.estado;
}

/** Obtener una tarea por ID con estado visible */
function obtener(db, ahora, id) {
  const t = db.prepare(`SELECT t.*, c.nombre AS curso FROM tarea t JOIN curso c USING (id_curso) WHERE t.id_tarea = ?`).get(id);
  if (!t) return null;
  return { ...t, estado_visible: estadoVisible(t, ahora) };
}

function listar(db, ahora, { curso, estado, source } = {}) {
  let query = `SELECT t.*, c.nombre AS curso FROM tarea t JOIN curso c USING (id_curso)`;
  const params = [];
  const where = [];

  if (curso) {
    where.push('t.id_curso = ?');
    params.push(curso);
  }
  if (source) {
    where.push('t.source = ?');
    params.push(source);
  }

  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }

  query += ` ORDER BY (t.estado = 'entregada'), t.fecha_limite`;

  const filas = db.prepare(query).all(...params);
  return filas
    .map((t) => ({ ...t, estado_visible: estadoVisible(t, ahora) }))
    .filter((t) => !estado || t.estado_visible === estado);
}

function actualizarAvance(db, id, avance) {
  const n = Number(avance);
  if (!Number.isInteger(n) || n < 0 || n > 100)
    throw Object.assign(new Error('El avance debe ser un entero entre 0 y 100'), { status: 400 });
  const t = db.prepare('SELECT estado FROM tarea WHERE id_tarea = ?').get(id);
  if (!t) throw Object.assign(new Error('Tarea no encontrada'), { status: 404 });
  if (t.estado === 'entregada') throw Object.assign(new Error('La tarea ya fue entregada'), { status: 409 });
  db.prepare('UPDATE tarea SET avance_pct = ?, estado = ? WHERE id_tarea = ?').run(n, n > 0 ? 'en_progreso' : 'pendiente', id);
}

/** Crear una tarea personalizada */
function crearTareaCustom(db, userId, { titulo, descripcion, fecha_limite, id_curso, prioridad = 'media' }) {
  // Verificar que el curso pertenece al usuario
  const curso = db.prepare('SELECT id_curso FROM curso WHERE id_curso = ? AND id_usuario = ?').get(id_curso, userId);
  if (!curso) throw Object.assign(new Error('Curso no encontrado'), { status: 404 });

  const info = db.prepare(`
    INSERT INTO tarea (id_curso, classroom_id, source, titulo, descripcion, fecha_limite, estado, avance_pct)
    VALUES (?, NULL, 'custom', ?, ?, ?, 'pendiente', 0)
  `).run(id_curso, titulo, descripcion || null, fecha_limite);

  const nuevaTarea = db.prepare(`SELECT t.*, c.nombre AS curso FROM tarea t JOIN curso c USING (id_curso) WHERE t.id_tarea = ?`).get(info.lastInsertRowid);
  return { ...nuevaTarea, estado_visible: estadoVisible(nuevaTarea, new Date().toISOString()) };
}

/** Actualizar una tarea personalizada */
function actualizarTareaCustom(db, userId, tareaId, { titulo, descripcion, fecha_limite, id_curso, prioridad }) {
  // Verificar que la tarea existe y es personalizada del usuario
  const tarea = db.prepare(`
    SELECT t.*, c.id_usuario FROM tarea t JOIN curso c ON t.id_curso = c.id_curso WHERE t.id_tarea = ? AND t.source = 'custom'
  `).get(tareaId);

  if (!tarea) throw Object.assign(new Error('Tarea personalizada no encontrada'), { status: 404 });
  if (tarea.id_usuario !== userId) throw Object.assign(new Error('No autorizado'), { status: 403 });

  // Si se cambia de curso, verificar que pertenece al usuario
  if (id_curso && id_curso !== tarea.id_curso) {
    const curso = db.prepare('SELECT id_curso FROM curso WHERE id_curso = ? AND id_usuario = ?').get(id_curso, userId);
    if (!curso) throw Object.assign(new Error('Curso no encontrado'), { status: 404 });
  }

  const updates = [];
  const params = [];

  if (titulo !== undefined) { updates.push('titulo = ?'); params.push(titulo); }
  if (descripcion !== undefined) { updates.push('descripcion = ?'); params.push(descripcion); }
  if (fecha_limite !== undefined) { updates.push('fecha_limite = ?'); params.push(fecha_limite); }
  if (id_curso !== undefined) { updates.push('id_curso = ?'); params.push(id_curso); }

  if (updates.length === 0) return obtener(db, new Date().toISOString(), tareaId);

  params.push(tareaId);
  db.prepare(`UPDATE tarea SET ${updates.join(', ')} WHERE id_tarea = ?`).run(...params);

  return obtener(db, new Date().toISOString(), tareaId);
}

/** Eliminar una tarea personalizada */
function eliminarTareaCustom(db, userId, tareaId) {
  const tarea = db.prepare(`
    SELECT t.*, c.id_usuario FROM tarea t JOIN curso c ON t.id_curso = c.id_curso WHERE t.id_tarea = ? AND t.source = 'custom'
  `).get(tareaId);

  if (!tarea) throw Object.assign(new Error('Tarea personalizada no encontrada'), { status: 404 });
  if (tarea.id_usuario !== userId) throw Object.assign(new Error('No autorizado'), { status: 403 });

  db.prepare('DELETE FROM tarea WHERE id_tarea = ?').run(tareaId);
  return { ok: true };
}

/** Listar tareas personalizadas del usuario */
function listarTareasCustom(db, userId, filtros = {}) {
  return listar(db, new Date().toISOString(), { ...filtros, source: 'custom' });
}

/** Indicadores de seguimiento del producto (Plan de Calidad, sección 13.2). */
function metricas(db, ahora, idUsuario = 1) {
  const tareas = listar(db, ahora);
  const entregadas = tareas.filter((t) => t.estado === 'entregada');
  const aTiempo = entregadas.filter((t) => new Date(t.fecha_entrega) <= new Date(t.fecha_limite));
  const u = db.prepare('SELECT saldo_tokens, racha_dias FROM usuario WHERE id_usuario = ?').get(idUsuario);
  const ganados = db.prepare('SELECT COALESCE(SUM(cantidad),0) AS n FROM transaccion_token WHERE id_usuario = ? AND cantidad > 0').get(idUsuario).n;
  const cuenta = (e) => tareas.filter((t) => t.estado_visible === e).length;
  return {
    total: tareas.length, entregadas: entregadas.length, a_tiempo: aTiempo.length,
    porcentaje_a_tiempo: entregadas.length ? Math.round((aTiempo.length / entregadas.length) * 100) : null,
    pendientes: cuenta('pendiente') + cuenta('en_progreso'), vencidas: cuenta('vencida'),
    saldo_tokens: u.saldo_tokens, tokens_ganados: ganados, racha_dias: u.racha_dias,
  };
}

module.exports = {
  listar,
  obtener,
  actualizarAvance,
  metricas,
  estadoVisible,
  crearTareaCustom,
  actualizarTareaCustom,
  eliminarTareaCustom,
  listarTareasCustom
};