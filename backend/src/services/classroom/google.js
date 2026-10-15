// Adaptador real de Google Classroom (solo lectura, RF-02/RF-03).
// Requiere un token OAuth 2.0 con los alcances: classroom.courses.readonly,
// classroom.coursework.me.readonly y classroom.student-submissions.me.readonly.
// Estado: escrito a partir de la documentación oficial; PENDIENTE de probar con credenciales reales (Etapa III).
const BASE = 'https://classroom.googleapis.com/v1';

module.exports = function googleAdapter(accessToken, fetchFn = fetch) {
  async function get(path) {
    const r = await fetchFn(`${BASE}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) throw Object.assign(new Error(`Google Classroom respondió ${r.status}`), { status: 502 });
    return r.json();
  }
  // La API omite los campos en cero; sin hora de entrega se asume 23:59.
  const aIso = (d, h) => (d?.year ? new Date(Date.UTC(d.year, d.month - 1, d.day, h ? (h.hours ?? 0) : 23, h ? (h.minutes ?? 0) : 59)).toISOString() : null);

  return {
    nombre: 'google',
    async obtenerCursos() {
      const d = await get('/courses?courseStates=ACTIVE&studentId=me');
      return (d.courses || []).map((c) => ({ id: c.id, nombre: c.name }));
    },
    async obtenerTareas(idCurso) {
      const [w, s] = await Promise.all([
        get(`/courses/${idCurso}/courseWork`),
        get(`/courses/${idCurso}/courseWork/-/studentSubmissions?userId=me`),
      ]);
      const entregas = new Map((s.studentSubmissions || []).map((e) => [e.courseWorkId, e]));
      return (w.courseWork || []).filter((t) => t.dueDate).map((t) => {
        const e = entregas.get(t.id);
        const entregada = !!e && ['TURNED_IN', 'RETURNED'].includes(e.state);
        return { id: t.id, titulo: t.title, descripcion: t.description || '', fechaLimite: aIso(t.dueDate, t.dueTime),
          entregada, fechaEntrega: entregada ? e.updateTime : null, enlace: t.alternateLink };
      });
    },
  };
};
