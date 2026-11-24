# CAPU · Bitácora Individual de Participación (Etapa IV y V — Entrega Final)

**Proyecto:** CAPU — Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
**Docente:** Mtra. María Guadalupe Rodríguez López
**Fecha de entrega final:** 26 de noviembre de 2026
**Repositorio:** https://github.com/VictorMBojorquez/Capu

---

## 1. Datos de los integrantes

| Integrante | Matrícula | Rol | Responsabilidad principal |
|---|---|---|---|
| Aldo Juventino Ballesteros Cruz | 23211920 | Líder de proyecto / Promotor | — |
| Victor Manuel Bojorquez Valdez | 23211926 | Desarrollador de integraciones (backend/API) | Integración Google Classroom, backend |
| Luis Adao Leonel Duran Ponce | 23211951 | Responsable de gamificación / producto | Gamificación, tokens, producto |
| Maximiliano Alberto Grande Ortega | 23211974 | Diseñador UX/UI y accesibilidad | Interfaz, UI, PWA |
| Jorge Luis Lopez Molgado | 23212002 | Responsable de seguridad y privacidad | Seguridad, JWT, OAuth |

---

## 2. Bitácora por integrante

### 2.1 Victor Manuel Bojorquez Valdez (23211926) — Desarrollador de integraciones

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-10-21 | Implementación de OAuth 2.0 + PKCE para Google Classroom | `backend/src/services/oauth.js`, `backend/src/app.js` | — | ✔ Integración base (RF-01) |
| 2026-10-21 | Sincronización de cursos/tareas/entregas con Classroom | `backend/src/services/sync.js`, `backend/src/services/classroom/google.js` | — | ✔ Integración (RF-03) |
| 2026-10-27 | Correcciones finales de aislamiento multiusuario y flujo OAuth | `backend/src/app.js`, servicios | — | ✔ Entrega final |

### 2.2 Maximiliano Alberto Grande Ortega (23211974) — Diseñador UX/UI y accesibilidad

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-11-07 | Mejoras de UI, PWA y notificaciones | `frontend/`, `frontend/sw.js` | — | ✔ Interfaz actualizada |

### 2.3 Otros integrantes

Las actividades de los integrantes restantes se registran en sus bitácoras individuales o en el
historial de commits del repositorio; la suite completa de pruebas y la revisión final del backend
corrieron bajo la coordinación del equipo.

---

## 3. Registro de actividades del equipo (complemento)

- Desarrollo de backend: tareas, tokens, recordatorios, alertas, sincronización, OAuth, notificaciones, admin.
- Desarrollo frontend: agenda, tokens, notificaciones, manuales, PWA/offline.
- Pruebas automatizadas: 37 pruebas iniciales + 4 de aislamiento = **41/41 ✔**.
- Correcciones finales: aislamiento multiusuario, flujo OAuth, administración de OAuth.

---

## 4. Historial de commits (evidencia de trabajo)

| Commit | Descripción |
|---|---|
| `6767409` | Aislamiento multiusuario backend + pruebas |
| `6f01ef4` | JWT en login Google + corrección OAuth |
| `28b64f8` | Actualización de estado/docs de entrega |

---

## 5. Conclusión de la bitácora individual

Cada integrante conoce el funcionamiento general del sistema y participó en las fases que le fueron
asignadas; las actividades se complementan con el historial de commits y las capturas del sistema.

---

**Nota:** Este documento debe completarse con los datos reales de participación de cada integrante
(actividades, tiempos, evidencias) antes de la entrega.
