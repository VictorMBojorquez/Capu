const H = 3600e3;

/**
 * Genera las alertas visibles en la app (RF-06), derivadas al vuelo de las tareas:
 * - tipo 'vencida' (nivel crítico): pasó la fecha límite sin entrega.
 * - tipo 'proxima'  (nivel urgente): vence en 24 h o menos.
 * No duplica los recordatorios programados en la base (RF-06), que quedan listos
 * para el envío real (push/correo) en una etapa posterior.
 */
function generar(db, ahora) {
  const t0 = new Date(ahora).getTime();
  const filas = db.prepare(`SELECT t.*, c.nombre AS curso FROM tarea t JOIN curso c USING (id_curso)
    WHERE t.estado != 'entregada' ORDER BY t.fecha_limite`).all();
  return filas.flatMap((t) => {
    const faltan = new Date(t.fecha_limite).getTime() - t0;
    if (faltan < 0)
      return [{ tipo: 'vencida', nivel: 'critico', id_tarea: t.id_tarea, titulo: t.titulo,
        curso: t.curso, fecha_limite: t.fecha_limite, enlace: t.enlace, vencidasH: Math.round(-faltan / H) }];
    if (faltan <= 24 * H)
      return [{ tipo: 'proxima', nivel: 'urgente', id_tarea: t.id_tarea, titulo: t.titulo,
        curso: t.curso, fecha_limite: t.fecha_limite, enlace: t.enlace, faltanH: Math.max(0, Math.round(faltan / H)) }];
    return [];
  });
}

module.exports = { generar };
