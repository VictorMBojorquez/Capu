# CAPU · Bitácora de Supervisión y Pruebas (Etapa IV y V — Entrega Final)

**Proyecto:** CAPU — Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
**Docente:** Mtra. María Guadalupe Rodríguez López
**Fecha de entrega final:** 26 de noviembre de 2026
**Repositorio:** https://github.com/VictorMBojorquez/Capu

---

## 1. Objetivo de la etapa

Supervisión, revisión, pruebas y correcciones finales del sistema, verificando que el software
desarrollado cumpla con los objetivos, requerimientos y criterios de calidad establecidos desde las
primeras etapas. Integrar las evidencias del proceso de gestión y presentar el producto final.

## 2. Metodología de pruebas

- Pruebas automatizadas con el ejecutor nativo de Node (`node --test --test-reporter=spec "tests/*.test.js"`).
- Servidor de API bajo prueba con base de datos SQLite en memoria (`createApp(openDb(':memory:'))`).
- Fechas simuladas con `CAPU_FIXED_NOW` para reproducibilidad de los escenarios.

## 3. Tabla de pruebas realizadas

| Campo | Descripción |
|---|---|
| Funcionalidad probada | — |
| Módulo o función evaluada | — |
| Fecha | — |
| Responsable | — |
| Resultado esperado | — |
| Resultado obtenido | — |
| Error detectado | — |
| Prioridad | — |
| Acción correctiva | — |
| Estado final | — |

### 3.1 Prueba 1 — Salud del servicio (Smoke)

| Campo | Valor |
|---|---|
| Funcionalidad probada | Servicio backend responde |
| Módulo / función | `GET /api/health` |
| Fecha | 2026-11-24 |
| Responsable | Equipo CAPU (backend) |
| Resultado esperado | HTTP 200 con `{ ok: true, version, ahora }` |
| Resultado obtenido | HTTP 200 correcto |
| Error detectado | Ninguno |
| Prioridad | Alta |
| Acción correctiva | — |
| Estado final | **Corregido** |

### 3.2 Prueba 2 — Sincronización con Classroom (mock)

| Campo | Valor |
|---|---|
| Funcionalidad probada | Sincroniza cursos y tareas desde adaptador Classroom |
| Módulo / función | `POST /api/sync` → `services/sync.js` |
| Fecha | 2026-11-24 |
| Responsable | Equipo CAPU (backend/API) |
| Resultado esperado | Importa 3 cursos / 7 tareas; segunda corrida sin duplicar |
| Resultado obtenido | ✔ `cursos: 3`, `nuevas: 7`; segunda corrida `nuevas: 0` |
| Error detectado | Ninguno |
| Prioridad | Alta |
| Acción correctiva | — |
| Estado final | **Corregido** |

### 3.3 Prueba 3 — Entrega y gamificación de tokens

| Campo | Valor |
|---|---|
| Funcionalidad probada | Entrega de tarea otorga tokens; doble entrega rechazada |
| Módulo / función | `POST /api/tareas/:id/completar`, `services/tokens.js` |
| Fecha | 2026-11-24 |
| Responsable | Equipo CAPU (gamificación) |
| Resultado esperado | Tokens otorgados por entrega a tiempo; segunda entrega → 409 |
| Resultado obtenido | ✔ Tokens calculados; segundo intento 409 |
| Error detectado | Ninguno |
| Prioridad | Alta |
| Acción correctiva | — |
| Estado final | **Corregido** |

### 3.4 Prueba 4 — Alertas y recordatorios

| Campo | Valor |
|---|---|
| Funcionalidad probada | Alertas de tareas vencidas / próximas (≤ 24 h) y recordatorios |
| Módulo / función | `services/alertas.js`, `services/reminders.js` |
| Fecha | 2026-11-24 |
| Responsable | Equipo CAPU (notificaciones) |
| Resultado esperado | Alertas generadas sólo para tareas activas |
| Resultado obtenido | ✔ Sin duplicaciones, alertas correctas |
| Error detectado | Ninguno |
| Prioridad | Media |
| Acción correctiva | — |
| Estado final | **Corregido** |

### 3.5 Prueba 5 — Aislamiento multiusuario

| Campo | Valor |
|---|---|
| Funcionalidad probada | Un usuario no ve ni modifica datos de otro |
| Módulo / función | Rutas protegidas con JWT (`backend/src/app.js`), servicios por usuario |
| Fecha | 2026-11-24 |
| Responsable | Equipo CAPU (backend/API) |
| Resultado esperado | 404 / datos aislados por usuario autenticado |
| Resultado obtenido | ✔ `tests/aislamiento.test.js` (4 pruebas, 41/41 en verde) |
| Error detectado | Ninguno |
| Prioridad | Alta |
| Acción correctiva | Aislamiento implementado durante la revisión final |
| Estado final | **Corregido** |

### 3.6 Resumen de resultados

| Indicador | Resultado |
|---|---|
| Pruebas ejecutadas | 41 / 41 ✔ (0 fallas) |
| Cobertura de funcionalidades revisadas | Salud, sync, entregas/tokens, alertas, recordatorios, aislamiento |
| Errores detectados | Ninguno crítico en suite; correcciones aplicadas durante la revisión |

---

## 4. Errores detectados y acciones correctivas

| Error | Prioridad | Acción correctiva | Estado final |
|---|---|---|---|
| Endpoints de tareas/cursos/alertas no filtraban por usuario | Alta | Aislamiento multiusuario implementado + pruebas nuevas | Corregido |
| Entrega de tarea sin validar dueño | Alta | Validación de propietario en `registrarEntrega` | Corregido |
| Sincronización automática siempre con usuario 1 | Media | Ciclo por usuario | Corregido |
| OAuth: insert de columna inexistente (`verificado`) | Alta | Corregido a `email_verificado` | Corregido |
| OAuth: no se emitía JWT al iniciar sesión con Google | Alta | JWT emitido + consumo en frontend | Corregido |
| Prueba de conexión OAuth con import inválido (`node:fetch`) | Media | Uso de `fetch` global + validación de Client ID | Corregido |

---

## 5. Conclusiones de la bitácora

El sistema cumplió con las funcionalidades probadas durante la revisión final. Se detectaron y
corrigieron defectos de aislamiento multiusuario y de flujo OAuth, sin romper las pruebas existentes.
El total de la suite automatizada permanece en **41/41 pruebas en verde**.
