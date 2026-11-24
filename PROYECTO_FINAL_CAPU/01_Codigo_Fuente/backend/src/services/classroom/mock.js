// Adaptador de demostración: datos simulados con el mismo formato que devuelve el adaptador real.
// Permite desarrollar y probar sin credenciales de Google (mitiga el riesgo de dependencia de la API).
const H = 3600e3;
module.exports = function mockAdapter(ahora) {
  const t0 = new Date(ahora).getTime();
  const en = (horas) => new Date(t0 + horas * H).toISOString();
  const cursos = [
    { id: 'c-gps', nombre: 'Gestión de Proyectos de Software' },
    { id: 'c-bd', nombre: 'Bases de Datos' },
    { id: 'c-red', nombre: 'Redes de Computadoras' },
  ];
  const tareas = {
    'c-gps': [
      { id: 't1', titulo: 'Plan del Proyecto (Etapa II)', descripcion: 'Entregar plan, repositorio y avances.', fechaLimite: en(13 * 24), entregada: false },
      { id: 't2', titulo: 'Plan de Calidad (Etapa I)', descripcion: 'Documento de calidad del proyecto.', fechaLimite: en(-8 * 24), entregada: true, fechaEntrega: en(-9 * 24) },
    ],
    'c-bd': [
      { id: 't3', titulo: 'Normalización: ejercicios 1-5', descripcion: 'Llevar hasta 3FN.', fechaLimite: en(20), entregada: false },
      { id: 't4', titulo: 'Consultas SQL con JOIN', descripcion: 'Práctica de laboratorio 4.', fechaLimite: en(-30), entregada: false },
      { id: 't5', titulo: 'Diagrama E-R de la biblioteca', descripcion: 'Entregar en PDF.', fechaLimite: en(-5 * 24), entregada: true, fechaEntrega: en(-5 * 24 - 40) },
    ],
    'c-red': [
      { id: 't6', titulo: 'Subnetting: hoja de ejercicios', descripcion: 'Resolver los 10 problemas.', fechaLimite: en(2 * 24 + 6), entregada: false },
      { id: 't7', titulo: 'Reporte de práctica VLAN', descripcion: 'Incluir capturas de Packet Tracer.', fechaLimite: en(5 * 24), entregada: false },
    ],
  };
  return {
    nombre: 'mock',
    async obtenerCursos() { return cursos; },
    async obtenerTareas(idCurso) {
      return (tareas[idCurso] || []).map((t) => ({ ...t, enlace: `https://classroom.google.com/c/${idCurso}/a/${t.id}` }));
    },
  };
};
