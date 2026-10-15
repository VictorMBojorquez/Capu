const { transaction } = require('../db');
const { registrarEntrega } = require('./tokens');
const { programarRecordatorios } = require('./reminders');

/** Sincroniza cursos y tareas desde un adaptador de Classroom (RF-03). */
async function sincronizar(db, adaptador, ahora, idUsuario = 1) {
  const cursos = await adaptador.obtenerCursos();
  const detalle = [];
  for (const c of cursos) detalle.push({ c, tareas: await adaptador.obtenerTareas(c.id) });

  return transaction(db, () => {
    let nuevas = 0, actualizadas = 0, entregasDetectadas = 0;
    for (const { c, tareas } of detalle) {
      db.prepare('INSERT OR IGNORE INTO curso (id_usuario, classroom_id, nombre) VALUES (?,?,?)').run(idUsuario, c.id, c.nombre);
      const idCurso = db.prepare('SELECT id_curso FROM curso WHERE id_usuario=? AND classroom_id=?').get(idUsuario, c.id).id_curso;
      for (const t of tareas) {
        const ex = db.prepare('SELECT id_tarea FROM tarea WHERE id_curso=? AND classroom_id=?').get(idCurso, t.id);
        if (!ex) {
          db.prepare('INSERT INTO tarea (id_curso, classroom_id, titulo, descripcion, fecha_limite, enlace) VALUES (?,?,?,?,?,?)')
            .run(idCurso, t.id, t.titulo, t.descripcion, t.fechaLimite, t.enlace);
          nuevas++;
        } else {
          db.prepare('UPDATE tarea SET titulo=?, descripcion=?, fecha_limite=?, enlace=? WHERE id_tarea=?')
            .run(t.titulo, t.descripcion, t.fechaLimite, t.enlace, ex.id_tarea);
          actualizadas++;
        }
      }
    }
    // Entregas hechas directamente en Classroom: se registran (con tokens) sin alterar la racha.
    for (const { c, tareas } of detalle) {
      for (const t of tareas.filter((x) => x.entregada)) {
        const fila = db.prepare(`SELECT t.id_tarea, t.estado FROM tarea t JOIN curso k USING (id_curso)
          WHERE k.id_usuario=? AND k.classroom_id=? AND t.classroom_id=?`).get(idUsuario, c.id, t.id);
        if (fila && fila.estado !== 'entregada') {
          registrarEntrega(db, fila.id_tarea, t.fechaEntrega || ahora, { actualizarRacha: false, idUsuario });
          entregasDetectadas++;
        }
      }
    }
    const recordatorios = programarRecordatorios(db, ahora);
    return { cursos: cursos.length, nuevas, actualizadas, entregasDetectadas, recordatorios };
  });
}

module.exports = { sincronizar };
