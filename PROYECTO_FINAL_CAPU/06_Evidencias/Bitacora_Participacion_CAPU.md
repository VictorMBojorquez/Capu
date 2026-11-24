# CAPU · Bitácora Individual de Participación (Etapa IV y V — Entrega Final)

**Proyecto:** CAPU — Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
**Docente:** Mtra. María Guadalupe Rodríguez López
**Fecha de entrega final:** 26 de noviembre de 2026
**Repositorio:** https://github.com/VictorMBojorquez/Capu

---

## 1. Datos de los integrantes

| Integrante | Matrícula | Rol | Responsabilidad principal |
|---|---|---|---|
| Aldo Juventino Ballesteros Cruz | 23211920 | Líder de proyecto / Promotor | Liderazgo, coordinación y cierre de entrega |
| Victor Manuel Bojorquez Valdez | 23211926 | Desarrollador de integraciones (backend/API) | OAuth, sincronización Classroom, backend final |
| Luis Adao Leonel Duran Ponce | 23211951 | Responsable de gamificación / producto | Tokens, racha, recompensas, canje |
| Maximiliano Alberto Grande Ortega | 23211974 | Diseñador UX/UI y accesibilidad | Interfaz, PWA, notificaciones |
| Jorge Luis Lopez Molgado | 23212002 | Responsable de seguridad y privacidad | JWT, OAuth, seguridad, admin |

---

## 2. Bitácora por integrante

### 2.1 Victor Manuel Bojorquez Valdez (23211926) — Desarrollador de integraciones (backend/API)

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-10-21 | Implementación OAuth 2.0 + PKCE para Google Classroom | `backend/src/services/oauth.js`, `backend/src/app.js` | — | ✔ Integración base (RF-01) |
| 2026-10-21 | Sincronización de cursos/tareas/entregas con Classroom | `backend/src/services/sync.js`, `backend/src/services/classroom/google.js` | — | ✔ Integración (RF-03) |
| 2026-10-24 – 2026-11-24 | Correcciones finales: aislamiento multiusuario, validación de dueño en entregas, JWT en login Google, admin OAuth | `backend/src/app.js`, `backend/src/services/*` | — | ✔ Cierre de etapa |

### 2.2 Maximiliano Alberto Grande Ortega (23211974) — Diseñador UX/UI y accesibilidad

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-11-07 | Mejoras de UI, PWA/offline y notificaciones | `frontend/`, `frontend/sw.js` | — | ✔ Interfaz actualizada |

### 2.3 Luis Adao Leonel Duran Ponce (23211951) — Responsable de gamificación / producto

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-11-24 | Revisión final de reglas de tokens, racha, recompensas y canje | `backend/src/services/tokens.js`, `backend/src/services/tareas.js` | — | ✔ Gamificación verificada |

### 2.4 Jorge Luis Lopez Molgado (23212002) — Responsable de seguridad y privacidad

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-11-24 | Endurecimiento de flujos OAuth/JWT y aislamiento por usuario | `backend/src/app.js`, `backend/src/services/jwt.js` | — | ✔ Seguridad reforzada |

### 2.5 Aldo Juventino Ballesteros Cruz (23211920) — Líder de proyecto / Promotor

| Fecha | Actividad realizada | Evidencia | Tiempo empleado | Resultado |
|---|---|---|---|---|
| 2026-11-24 | Coordinación del cierre de etapa, verificación de entregables | Repositorio, docs de entrega | — | ✔ Cierre |

---

## 3. Registro de actividades del equipo (complemento)

- Desarrollo backend completo: tareas, tokens, recordatorios, alertas, sincronización, OAuth, notificaciones, admin.
- Desarrollo frontend: agenda, tokens, notificaciones, manuales, PWA/offline.
- Pruebas automatizadas: 37 pruebas iniciales + 4 de aislamiento = **41/41 en verde**.
- Correcciones finales: aislamiento multiusuario, flujo OAuth, administración de OAuth.

---

## 4. Historial de commits (evidencia de trabajo)

| Commit | Descripción |
|---|---|
| `6767409` | Aislamiento multiusuario backend + pruebas |
| `6f01ef4` | JWT en login Google + corrección OAuth |
| `28b64f8` | Actualización de estado/docs de entrega |
| `8a5069d` | Paquete final de evidencias, manual, presentación y estructura |
| `975c3cf` | Presentación electrónica final del proyecto |

---

## 5. Conclusión de la bitácora individual

Cada integrante conoce el funcionamiento general del sistema y participó en las fases que le fueron
asignadas. Las actividades se complementan con el historial de commits, las capturas y las pruebas.

---

**Nota:** Este documento debe completarse con los datos reales de participación de cada integrante
(actividades, tiempos, evidencias) antes de la entrega.
