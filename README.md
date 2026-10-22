# CAPU

Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.
Proyecto Integrador de *Gestión de Proyectos de Software* · Tecnológico Nacional de México, Instituto Tecnológico de Tijuana.

**Versión actual:** 0.3.0 (Etapa III — Integración con Google Classroom vía OAuth y alertas)

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
git clone https://github.com/VictorMBojorquez/Capu.git
cd capu
npm install
npm start            # http://localhost:3000
```

Al abrir la aplicación, pulsa **Sincronizar con Classroom** para cargar tareas.
Sin conexión con Google la aplicación usa **datos de demostración** (adaptador `mock`).

### Conexión real con Google Classroom (OAuth, RF-01)

Pasos completos en **[docs/guia-conexion-classroom.md](docs/guia-conexion-classroom.md)**. Resumen:

1. Crea un ID de cliente OAuth (aplicación web) en Google Cloud con la API de Google Classroom,
   y como URI de redirección `http://localhost:3000/api/auth/google/callback`.
2. Copia `.env.example` a `.env` y pega tu `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
   (el servidor carga `.env` automáticamente; también aceptan variables exportadas).
3. `npm start` → botón **Conectar con Google** → autorizar → **Sincronizar con Classroom**.

Opcionales en el entorno:

### Credenciales de prueba
No se requieren para el modo demostración (usuario “Estudiante Demo”, adaptador `mock`).

### Variables de entorno (opcionales)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `CAPU_DB` | Ruta del archivo SQLite (`:memory:` para pruebas) | `database/capu.db` |
| `CAPU_FIXED_NOW` | Fija la fecha del sistema (ISO 8601) para demostraciones y pruebas | reloj real |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth (Google Cloud) | sin OAuth → modo demostración |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente OAuth | — |
| `GOOGLE_REDIRECT_URI` | URI de retorno del flujo OAuth | `http://localhost:3000/api/auth/google/callback` |
| `CAPU_SYNC_MINUTOS` | Intervalo de sincronización automática en minutos (`0` desactiva) | `0` |

### Pruebas
```bash
npm test             # 37 pruebas automatizadas
```

## Estructura

```
capu/
├── backend/src/
│   ├── app.js, server.js, db.js, seed.js, clock.js
│   └── services/        tokens, reminders, alertas, sync, oauth, env, classroom/{mock,google}
├── frontend/            index.html, styles.css, app.js
├── database/schema.sql  esquema relacional
├── tests/               pruebas unitarias y de API
├── docs/                calidad/, diagramas/, gestion/, capturas/, evidencias/
└── .github/             plantilla de solicitud de cambio
```

## API (resumen)

| Método y ruta | Descripción | Req. |
|---|---|---|
| `GET /api/auth/google/iniciar` · `GET /api/auth/google/callback` | Flujo OAuth 2.0 con Google | RF-01 |
| `GET /api/auth/google/estado` · `DELETE /api/auth/google` | Estado y desconexión de la cuenta | RF-01 |
| `POST /api/sync` | Sincroniza cursos y tareas (OAuth guardado, cabecera `x-google-token` o mock) | RF-03 |
| `GET /api/tareas?curso=&estado=` | Agenda con filtros | RF-04 |
| `PATCH /api/tareas/:id` | Registra el porcentaje de avance | RF-05 |
| `POST /api/tareas/:id/completar` | Marca como entregada y otorga tokens | RF-07 |
| `GET /api/alertas` | Alertas en la app: tareas vencidas y próximas a vencer (24 h) | RF-06 |
| `GET /api/recordatorios/pendientes` · `POST /api/recordatorios/procesar` | Recordatorios vencidos | RF-06 |
| `GET /api/tokens` · `GET /api/recompensas` · `POST /api/recompensas/:id/canjear` | Saldo, historial y canje | RF-08, RF-09 |
| `GET /api/metricas` | Indicadores de seguimiento | RF-12 |

## Estado de los requerimientos (Etapa II)

Implementados: RF-01 (flujo OAuth completo; pendiente prueba con credenciales reales), RF-03, RF-04, RF-05, RF-06 (alertas en la app), RF-07, RF-08, RF-09, RF-10, RF-12.
Pendientes: envío real de notificaciones push/correo (RF-06) y RF-11 (preferencias).

## Flujo de trabajo

Ramas `main` / `develop` / `feature/*`; cambios mediante solicitud de revisión con al menos una aprobación.
Los cambios de alcance se registran con la plantilla de *Solicitud de cambio* (`.github/ISSUE_TEMPLATE`).
Documentación de gestión en `docs/`.
