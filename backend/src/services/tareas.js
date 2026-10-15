/** Estado visible: 'vencida' se deriva (no se guarda) si pasó la fecha límite sin entrega. */
function estadoVisible(t, ahora) {
  if (t.estado === 'entregada') return 'entregada';
  if (new Date(t.fecha_limite) < new Date(ahora)) return 'vencida';
  return t.estado;
}

function listar(db, ahora, { curso, estado } = {}) {
  const filas = db.prepare(`SELECT t.*, c.nombre AS curso FROM tarea t JOIN curso c USING (id_curso)
    ORDER BY (t.estado = 'entregada'), t.fecha_limite`).all();
  return filas
    .map((t) => ({ ...t, estado_visible: estadoVisible(t, ahora) }))
    .filter((t) => (!curso || String(t.id_curso) === String(curso)) && (!estado || t.estado_visible === estado));
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

module.exports = { listar, actualizarAvance, metricas, estadoVisible };
