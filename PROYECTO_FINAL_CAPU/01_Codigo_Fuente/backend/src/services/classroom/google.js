// Adaptador real de Google Classroom (solo lectura, RF-02/RF-03).
// Requiere un token OAuth 2.0 con los alcances de classroom.* (los define services/oauth.js).
// Validado contra la respuesta real de la API: due={year,month,day} + dueTime={hours,minutes}.
// FORMATO: la API omite los campos en cero; sin hora de vencimiento se asume 23:59.
// NOTA: lista TODAS las páginas de cursos, trabajos y entregas (pageSize + pageToken).
const BASE = 'https://classroom.googleapis.com/v1';

module.exports = function googleAdapter(accessToken, fetchFn = fetch) {
  async function get(ruta, params = {}) {
    const r = await fetchFn(`${BASE}${ruta}?${new URLSearchParams(params)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) throw Object.assign(new Error(`Google Classroom respondió ${r.status}`), { status: 502 });
    return r.json();
  }
  // Recorre todas las páginas de una colección paginada de la API.
  async function listar(ruta, campo, params = {}) {
    const out = [];
    let pagina;
    do {
      const d = await get(ruta, { pageSize: 100, ...params, ...(pagina ? { pageToken: pagina } : {}) });
      out.push(...(d[campo] || []));
      pagina = typeof d.nextPageToken === 'undefined' ? undefined : d.nextPageToken;
    } while (pagina);
    return out;
  }
  const aIso = (d, h) => (d?.year
    ? new Date(Date.UTC(d.year, d.month - 1, d.day, h ? (h.hours ?? 0) : 23, h ? (h.minutes ?? 0) : 59)).toISOString()
    : null);

  return {
    nombre: 'google',
    async obtenerCursos() {
      const cursos = await listar('/courses', 'courses', { courseStates: 'ACTIVE', studentId: 'me', pageSize: 200 });
      return cursos.map((c) => ({ id: c.id, nombre: c.name }));
    },
    async obtenerTareas(idCurso) {
      const [trabajos, entregas] = await Promise.all([
        listar(`/courses/${idCurso}/courseWork`, 'courseWork'),
        listar(`/courses/${idCurso}/courseWork/-/studentSubmissions`, 'studentSubmissions', { userId: 'me' }),
      ]);
      const entregasMap = new Map(entregas.map((e) => [e.courseWorkId, e]));
      return trabajos.filter((t) => t.dueDate && (!t.state || t.state === 'PUBLISHED')).map((t) => {
        const e = entregasMap.get(t.id);
        const entregada = !!e && ['TURNED_IN', 'RETURNED'].includes(e.state);
        return { id: t.id, titulo: t.title, descripcion: t.description || '', fechaLimite: aIso(t.dueDate, t.dueTime),
          entregada, fechaEntrega: entregada ? (e.updateTime) : null, enlace: t.alternateLink };
      });
    },
  };
};
