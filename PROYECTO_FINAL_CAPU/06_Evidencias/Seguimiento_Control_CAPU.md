# CAPU · Seguimiento y Control del Proyecto (Etapa IV y V — Entrega Final)

**Proyecto:** CAPU — Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
**Docente:** Mtra. María Guadalupe Rodríguez López
**Fecha de entrega final:** 26 de noviembre de 2026
**Repositorio:** https://github.com/VictorMBojorquez/Capu

---

## 1. Cronograma (resumen)

| Fase | Periodo | Estado |
|---|---|---|
| Etapa I — Gestión de calidad | 23 sep – 6 oct 2026 | Concluida |
| Etapa II — Planificación | 7 oct – 27 oct 2026 | Concluida |
| Etapa III — Desarrollo / Integración | 28 oct – 14 nov 2026 | Concluida |
| Etapa IV y V — Supervisión, revisión y entrega final | 15 nov – 26 nov 2026 | **En curso** |

**Fecha de entrega final:** **26 de noviembre de 2026**.

## 2. Porcentaje de actividades terminadas

| Actividad | % |
|---|---|
| Plan, calidad, requerimientos y diseño | 100 % |
| Desarrollo backend (tareas, tokens, recordatorios, alertas, sync, OAuth) | 100 % |
| Frontend (agenda, tokens, notificaciones, manuales) | 100 % |
| Pruebas automatizadas | 100 % (41/41) |
| Correcciones finales (aislamiento, OAuth, admin) | 100 % |
| Evidencias de entrega final | En preparación |

## 3. Actividades pendientes

- [ ] Consolidar carpeta de entrega digital (`PROYECTO_FINAL_CAPU/`).
- [ ] Preparar presentación electrónica (7 puntos).
- [ ] Bitácora individual de participación por integrante.
- [ ] Verificación final de manual de usuario contra versión final.

## 4. Incidencias y problemas encontrados

| Incidente | Impacto | Solución aplicada | Estado |
|---|---|---|---|
| Endpoints no aislados por usuario | Alto | Filtros por `id_usuario` en rutas y servicios | Resuelto |
| Entrega sin validación de dueño | Alto | Validación en `registrarEntrega` | Resuelto |
| Sincronización automática con usuario fijo | Medio | Ciclo por usuario | Resuelto |
| Columna `verificado` inexistente en OAuth | Alto | Uso de `email_verificado` | Resuelto |
| JWT no emitido en callback de Google | Alto | Emitido con `generateToken` + consumo en frontend | Resuelto |
| `import('node:fetch')` inválido en admin | Medio | `fetch` global de Node | Resuelto |

## 5. Cambios realizados durante el desarrollo

- Aislamiento multiusuario completo de tareas, tokens, alertas, recordatorios y métricas.
- Flujo OAuth de Google Classroom con PKCE: credencial, renovación y desconexión.
- Servicio de notificaciones (alertas, recordatorios, preferencias).
- Correcciones de UI y de tokens en frontend.
- Suite de pruebas ampliada (aislamiento multiusuario).

## 6. Acciones correctivas implementadas

- Validación de propietario en entregas y canjes.
- Filtrado por usuario en todas las consultas de agenda.
- Manejo de errores y estados en flujos críticos.

## 7. Historial de versiones del software

| Versión | Estado | Fecha aproximada | Cambios |
|---|---|---|---|
| 0.1.0 | — | Etapa I | Plan de calidad, requerimientos |
| 0.2.0 | — | Etapa II | Plan del proyecto, OAuth, alertas |
| 0.3.0 | — | Etapa III | Backend services, notificaciones, OAuth, tests |

## 8. Evidencias de seguimiento

- Repositorio: https://github.com/VictorMBojorquez/Capu
- Rama: `main`
- Commits de integración: `71ccb1a` → `28b64f8` (push final del cierre de etapa).
- Pruebas: 41/41 en verde.

---

## 9. Conclusiones del seguimiento

El proyecto evolucionó de planificación (Etapa II) a integración funcional (Etapa III) y ahora a
cierre de etapa con revisiones finales. Los indicadores de calidad se mantienen dentro de los umbrales
definidos en el Plan de Calidad.
