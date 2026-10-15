# CAPU

Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
Proyecto Integrador de *Gestión de Proyectos de Software* · Tecnológico Nacional de México, Instituto Tecnológico de Tijuana.

**Versión actual:** 0.2.0 (Etapa II — Planificación y arranque del desarrollo)

## Integrantes

| Integrante | Matrícula | Rol |
|---|---|---|
| Aldo Juventino Ballesteros Cruz | 23211920 | Líder de proyecto / Promotor |
| Victor Manuel Bojorquez Valdez | 23211926 | Desarrollador de integraciones (backend/API) |
| Luis Adao Leonel Duran Ponce | 23211951 | Responsable de gamificación / producto |
| Maximiliano Alberto Grande Ortega | 23211974 | Diseñador UX/UI y accesibilidad |
| Jorge Luis Lopez Molgado | 23212002 | Responsable de seguridad y privacidad |

## Tecnologías

- **Lenguaje:** JavaScript (Node.js 22.5 o superior)
- **Servidor:** Express 4 · **Base de datos:** SQLite (módulo `node:sqlite`) en desarrollo
- **Interfaz:** HTML, CSS y JavaScript sin dependencias (aplicación web adaptable)
- **Pruebas:** ejecutor nativo de Node (`node --test`)
- **Integración:** Google Classroom API (adaptador implementado; prueba con credenciales reales en la Etapa III)

## Instalación y ejecución

```bash
git clone <URL-del-repositorio> capu
cd capu
npm install
npm start            # http://localhost:3000
```

Al abrir la aplicación, pulsa **Sincronizar con Classroom** para cargar tareas.
Sin credenciales de Google la aplicación usa **datos de demostración** (adaptador `mock`).

### Credenciales de prueba
No se requieren. El modo demostración usa el usuario “Estudiante Demo”. El inicio de sesión con Google (RF-01) se integra en la Etapa III.

### Variables de entorno (opcionales)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `CAPU_DB` | Ruta del archivo SQLite (`:memory:` para pruebas) | `database/capu.db` |
| `CAPU_FIXED_NOW` | Fija la fecha del sistema (ISO 8601) para demostraciones y pruebas | reloj real |

### Pruebas
```bash
npm test             # 22 pruebas automatizadas
```

## Estructura

```
capu/
├── backend/src/
│   ├── app.js, server.js, db.js, seed.js, clock.js
│   └── services/        tokens, reminders, tareas, sync, classroom/{mock,google}
├── frontend/            index.html, styles.css, app.js
├── database/schema.sql  esquema relacional
├── tests/               pruebas unitarias y de API
├── docs/                calidad/, diagramas/, gestion/, capturas/, evidencias/
└── .github/             plantilla de solicitud de cambio
```

## API (resumen)

| Método y ruta | Descripción | Req. |
|---|---|---|
| `POST /api/sync` | Sincroniza cursos y tareas (mock o Google con cabecera `x-google-token`) | RF-03 |
| `GET /api/tareas?curso=&estado=` | Agenda con filtros | RF-04 |
| `PATCH /api/tareas/:id` | Registra el porcentaje de avance | RF-05 |
| `POST /api/tareas/:id/completar` | Marca como entregada y otorga tokens | RF-07 |
| `GET /api/recordatorios/pendientes` · `POST /api/recordatorios/procesar` | Recordatorios vencidos | RF-06 |
| `GET /api/tokens` · `GET /api/recompensas` · `POST /api/recompensas/:id/canjear` | Saldo, historial y canje | RF-08, RF-09 |
| `GET /api/metricas` | Indicadores de seguimiento | RF-12 |

## Estado de los requerimientos (Etapa II)

Implementados: RF-03, RF-04, RF-05, RF-07, RF-08, RF-09, RF-10, RF-12 y la lógica de RF-06.
Pendientes: RF-01 y RF-02 (OAuth con Google), envío real de notificaciones (RF-06), RF-11 (preferencias).

## Flujo de trabajo

Ramas `main` / `develop` / `feature/*`; cambios mediante solicitud de revisión con al menos una aprobación.
Los cambios de alcance se registran con la plantilla de *Solicitud de cambio* (`.github/ISSUE_TEMPLATE`).
Documentación de gestión en `docs/`.
