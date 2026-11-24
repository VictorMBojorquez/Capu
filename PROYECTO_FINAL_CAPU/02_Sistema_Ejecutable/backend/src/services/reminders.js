const ANTICIPACIONES_HORAS = [24, 3]; // valores por defecto (RF-06); configurables en una etapa posterior

/** Calcula las fechas de recordatorio futuras para una fecha límite. Función pura. */
function calcularRecordatorios(fechaLimite, ahora, horas = ANTICIPACIONES_HORAS) {
  const limite = new Date(fechaLimite).getTime();
  const t0 = new Date(ahora).getTime();
  return horas.map((h) => limite - h * 3600e3).filter((t) => t > t0).map((t) => new Date(t).toISOString());
}

/** Crea los recordatorios faltantes de las tareas no entregadas. Devuelve cuántos creó. */
function programarRecordatorios(db, ahora, horas, idUsuario = null) {
  const params = [];
  let filtro = '';
  if (idUsuario !== null) {
    filtro = ' AND id_curso IN (SELECT id_curso FROM curso WHERE id_usuario = ?)';
    params.push(idUsuario);
  }
  const tareas = db.prepare(`SELECT id_tarea, fecha_limite FROM tarea WHERE estado != 'entregada'${filtro}`).all(...params);
  const ins = db.prepare('INSERT OR IGNORE INTO recordatorio (id_tarea, fecha_hora, canal) VALUES (?,?,?)');
  let creados = 0;
  for (const t of tareas)
    for (const f of calcularRecordatorios(t.fecha_limite, ahora, horas))
      creados += Number(ins.run(t.id_tarea, f, 'push').changes);
  return creados;
}

/** Recordatorios que ya debieron enviarse, de tareas aún no entregadas. */
function pendientes(db, ahora, idUsuario = null) {
  const params = [new Date(ahora).toISOString()];
  let filtro = '';
  if (idUsuario !== null) {
    filtro = ' AND c.id_usuario = ?';
    params.push(idUsuario);
  }
  return db.prepare(`SELECT r.id_recordatorio, r.fecha_hora, r.canal, t.id_tarea, t.titulo, t.fecha_limite, c.nombre AS curso
    FROM recordatorio r JOIN tarea t USING (id_tarea) JOIN curso c USING (id_curso)
    WHERE r.enviado = 0 AND r.fecha_hora <= ? AND t.estado != 'entregada'${filtro} ORDER BY r.fecha_hora`).all(...params);
}

/** Marca como enviados (el envío real Web Push/correo se implementa en la Etapa III). */
function procesar(db, ahora, idUsuario = null) {
  const lista = pendientes(db, ahora, idUsuario);
  const up = db.prepare('UPDATE recordatorio SET enviado = 1 WHERE id_recordatorio = ?');
  lista.forEach((r) => up.run(r.id_recordatorio));
  return lista;
}

module.exports = { calcularRecordatorios, programarRecordatorios, pendientes, procesar, ANTICIPACIONES_HORAS };
