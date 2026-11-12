# Manual de Administrador - CAPU

## Gestión y Configuración de la Plataforma

---

**Versión:** 1.0  
**Fecha:** Noviembre 2026  
**Proyecto:** CAPU - Agenda Inteligente  

---

## Índice General

### Parte I: Introducción y Acceso Admin
1. [Rol de Administrador](#1-rol-de-administrador) - pág. 3
2. [Acceso al Panel de Administración](#2-acceso-al-panel-de-administración) - pág. 4
3. [Dashboard Administrativo](#3-dashboard-administrativo) - pág. 5

### Parte II: Gestión de Usuarios
4. [Listado y Búsqueda de Usuarios](#4-listado-y-búsqueda-de-usuarios) - pág. 7
5. [Detalle y Edición de Usuario](#5-detalle-y-edición-de-usuario) - pág. 9
6. [Roles y Permisos](#6-roles-y-permisos) - pág. 11
7. [Bloqueo y Eliminación](#7-bloqueo-y-eliminación) - pág. 12
8. [Exportación de Datos](#8-exportación-de-datos) - pág. 13

### Parte III: Gestión de Cursos
9. [Sincronización con Classroom](#9-sincronización-con-classroom) - pág. 14
10. [Cursos Activos y Archivado](#10-cursos-activos-y-archivado) - pág. 16
11. [Mapeo de Cursos](#11-mapeo-de-cursos) - pág. 17

### Parte IV: Gestión de Tareas (Admin)
12. [Vista Global de Tareas](#12-vista-global-de-tareas) - pág. 18
13. [Filtros Avanzados Admin](#13-filtros-avanzados-admin) - pág. 20
14. [Acciones Masivas](#14-acciones-masivas) - pág. 21

### Parte V: Sistema de Recompensas
15. [Crear Recompensas](#15-crear-recompensas) - pág. 22
16. [Editar y Gestionar Stock](#16-editar-y-gestionar-stock) - pág. 24
17. [Categorías y Costos](#17-categorías-y-costos) - pág. 25
18. [Historial de Canjes Globales](#18-historial-de-canjes-globales) - pág. 26

### Parte VI: Métricas y Analíticas
19. [Dashboard de Métricas](#19-dashboard-de-métricas) - pág. 27
20. [Métricas de Usuarios](#20-métricas-de-usuarios) - pág. 29
21. [Métricas de Gamificación](#21-métricas-de-gamificación) - pág. 31
22. [Métricas de Sincronización](#22-métricas-de-sincronización) - pág. 32
23. [Exportación de Reportes](#23-exportación-de-reportes) - pág. 33

### Parte VII: Auditoría y Logs
24. [Logs de Auditoría](#24-logs-de-auditoría) - pág. 34
25. [Filtros de Auditoría](#25-filtros-de-auditoría) - pág. 36
26. [Alertas de Seguridad](#26-alertas-de-seguridad) - pág. 37

### Parte VIII: Configuración del Sistema
27. [Configuración General](#27-configuración-general) - pág. 38
28. [Parámetros de Gamificación](#28-parámetros-de-gamificación) - pág. 40
29. [Configuración de Notificaciones](#29-configuración-de-notificaciones) - pág. 41
30. [Mantenimiento y Limpieza](#30-mantenimiento-y-limpieza) - pág. 42

### Parte IX: Seguridad y Backup
31. [Gestión de Sesiones](#31-gestión-de-sesiones) - pág. 43
32. [Backup y Restauración](#32-backup-y-restauración) - pág. 44
33. [Rotación de Secretos](#33-rotación-de-secretos) - pág. 45

### Parte X: Solución de Problemas Admin
34. [Problemas Comunes Admin](#34-problemas-comunes-admin) - pág. 46
35. [Debugging y Logs](#35-debugging-y-logs) - pág. 48

### Anexos
- [Anexo A: Estructura de Base de Datos](#anexo-a-estructura-de-base-de-datos) - pág. 50
- [Anexo B: API Endpoints Admin](#anexo-b-api-endpoints-admin) - pág. 52
- [Anexo C: Variables de Entorno](#anexo-c-variables-de-entorno) - pág. 54
- [Anexo D: Checklist Despliegue](#anexo-d-checklist-despliegue) - pág. 56

---

# PARTE I: INTRODUCCIÓN Y ACCESO ADMIN

## 1. Rol de Administrador

![Rol Admin](images/admin-rol.png)
*Figura 1.1: Diferencias entre usuario estudiante y administrador*

### 1.1 Responsabilidades Principales

| Área | Responsabilidades |
|------|-------------------|
| **Usuarios** | Crear, editar, bloquear, eliminar, exportar |
| **Cursos** | Supervisar sync, mapear cursos externos |
| **Tareas** | Vista global, acciones masivas, auditoría |
| **Recompensas** | Crear catálogo, gestionar stock, costos |
| **Métricas** | Monitorear adopción, engagement, salud sistema |
| **Seguridad** | Auditar accesos, rotar secretos, gestionar sesiones |
| **Configuración** | Parámetros globales, gamificación, notificaciones |

### 1.2 Permisos Exclusivos Admin

| Permiso | Endpoint | Descripción |
|---------|----------|-------------|
| `admin:users:read` | GET /api/admin/users | Listar todos los usuarios |
| `admin:users:write` | PUT/DELETE /api/admin/users/:id | Editar/eliminar usuarios |
| `admin:courses:read` | GET /api/admin/courses | Ver todos los cursos |
| `admin:tasks:read` | GET /api/admin/tasks | Vista global tareas |
| `admin:rewards:write` | POST/PUT/DELETE /api/admin/rewards | Gestión recompensas |
| `admin:metrics:read` | GET /api/admin/metrics/* | Acceso a dashboards |
| `admin:audit:read` | GET /api/admin/audit | Logs de auditoría |
| `admin:config:write` | PUT /api/admin/config | Configuración sistema |

---

## 2. Acceso al Panel de Administración

### 2.1 Requisitos Previos

- Cuenta con **rol `admin`** en base de datos
- Autenticación JWT válida
- 2FA recomendado (configurable)

### 2.2 Inicio de Sesión Admin

1. Accede a CAPU normal (login estándar)
2. Si tu usuario tiene `rol: 'admin'`, verás:
   - **Nueva opción** en menú usuario: **"Panel Admin"**
   - **Badge** "ADMIN" junto a tu nombre

![Login Admin](images/admin-login-badge.png)
*Figura 2.1: Indicador visual de rol admin en header*

### 2.3 Acceso Directo

URL directa: `https://tudominio.com/admin` o `http://localhost:3000/admin`

- Redirige a login si no autenticado
- Verifica rol `admin` en middleware
- 403 Forbidden si no eres admin

### 2.4 Layout Panel Admin

![Layout Admin](images/admin-layout.png)
*Figura 2.2: Estructura del panel de administración*

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN HEADER: CAPU Admin  │  Usuario Admin  │  [Volver a App]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  SIDEBAR     │          CONTENIDO PRINCIPAL                     │
│  NAVEGACIÓN  │  (Dashboard / Usuarios / Cursos / Tareas /       │
│              │   Recompensas / Métricas / Auditoría / Config)   │
│  ┌────────┐  │                                                  │
│  │📊 Dash │  │                                                  │
│  │👥 Users│  │                                                  │
│  │📚Cursos│  │                                                  │
│  │📋Tareas│  │                                                  │
│  │🎁Rewards│ │                                                  │
│  │📈Metri │  │                                                  │
│  │📋Audit │  │                                                  │
│  │⚙️ Config│ │                                                  │
│  └────────┘  │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 3. Dashboard Administrativo

Vista general de salud de la plataforma:

![Admin Dashboard](images/admin-dashboard.png)
*Figura 3.1: Dashboard principal de administración*

### 3.1 Tarjetas KPI Principales

| KPI | Descripción | Alerta si |
|-----|-------------|-----------|
| **Usuarios Totales** | Cuentas registradas | - |
| **Activos 24h** | Login en últimas 24h | < 10% del total |
| **Activos 7d** | Login en última semana | < 30% del total |
| **Tareas Creadas (24h)** | Nuevas tareas (Classroom + manual) | Caída brusca |
| **Entregas (24h)** | Tareas marcadas entregadas | < 50% tareas vencidas |
| **Tokens Ganados (24h)** | Total tokens otorgados | Caída > 50% |
| **Sync Exitosos (1h)** | % sincronizaciones OK | < 95% |
| **Errores 5xx (1h)** | Errores servidor | > 10/min |

### 3.2 Gráficos de Tendencia (7 días)

![Admin Graficos](images/admin-graficos.png)
*Figura 3.2: Gráficos de tendencia en dashboard*

1. **Usuarios activos diarios** (línea)
2. **Tareas creadas vs entregadas** (barras apiladas)
3. **Tokens ganados vs gastados** (área)
4. **Tasa de éxito Sync** (línea %)

### 3.3 Alertas Recientes

Panel lateral con alertas automáticas:

| Tipo Alerta | Trigger | Severidad |
|-------------|---------|-----------|
| **Sync fallando** | >3 fallos seguidos | 🔴 Crítica |
| **Usuarios caídos** | -30% activos vs ayer | 🟠 Alta |
| **Errores 5xx** | >50/hora | 🔴 Crítica |
| **DB lenta** | Queries > 5s | 🟡 Media |
| **Espacio disco** | >85% usado | 🟠 Alta |
| **Certificado SSL** | <30 días expiración | 🟡 Media |

---

# PARTE II: GESTIÓN DE USUARIOS

## 4. Listado y Búsqueda de Usuarios

![Admin Users List](images/admin-users-list.png)
*Figura 4.1: Listado paginado de usuarios con filtros*

### 4.1 Tabla de Usuarios

| Columna | Ordenable | Filtrable | Descripción |
|---------|-----------|-----------|-------------|
| **Avatar** | ❌ | ❌ | Iniciales + color determinista |
| **Nombre** | ✅ | ✅ | Nombre completo |
| **Email** | ✅ | ✅ | Email único (clave) |
| **Rol** | ✅ | ✅ | `student` / `admin` |
| **Google** | ✅ | ✅ | ✅ Conectado / ❌ No |
| **Verificado** | ✅ | ✅ | ✅ Sí / ❌ No / ⏳ Pendiente |
| **Onboarding** | ✅ | ✅ | ✅ Completado / ❌ Pendiente |
| **Último Login** | ✅ | ✅ | Fecha/hora o "Nunca" |
| **Creado** | ✅ | ✅ | Fecha registro |
| **Acciones** | ❌ | ❌ | Ver / Editar / Bloquear / Eliminar |

### 4.2 Filtros Disponibles

![Users Filtros](images/admin-users-filtros.png)
*Figura 4.2: Panel de filtros expandido*

| Filtro | Tipo | Opciones |
|--------|------|----------|
| **Buscar** | Texto | Nombre, email (búsqueda parcial) |
| **Rol** | Select | Todos / student / admin |
| **Google Connect** | Select | Todos / Conectado / No conectado |
| **Verificado** | Select | Todos / Sí / No / Pendiente |
| **Onboarding** | Select | Todos / Completado / Pendiente |
| **Actividad** | Select | Todos / Activos 24h / 7d / 30d / Inactivos |
| **Fecha Registro** | Date Range | Desde / Hasta |

### 4.3 Paginación y Exportación

- **Por página**: 10 / 25 / 50 / 100
- **Navegación**: Primera / Anterior / 1,2,3... / Siguiente / Última
- **Exportar CSV**: Botón "⬇️ Exportar" (respeta filtros actuales)

---

## 5. Detalle y Edición de Usuario

Click en **"Ver"** o nombre de usuario abre modal detalle:

![User Detail](images/admin-user-detail.png)
*Figura 5.1: Modal de detalle de usuario*

### 5.1 Pestañas del Detalle

| Pestaña | Contenido |
|---------|-----------|
| **Perfil** | Datos básicos, avatar, roles, fechas |
| **Actividad** | Logins, tareas, tokens, rachas (30d) |
| **Classroom** | Cursos sincronizados, último sync, tokens Classroom |
| **Notificaciones** | Preferencias, historial envíos (7d) |
| **Auditoría** | Acciones admin sobre este usuario |

### 5.2 Editar Usuario

Botón **"Editar"** en modal → formulario:

![User Edit](images/admin-user-edit.png)
*Figura 5.3: Formulario de edición de usuario*

| Campo | Editable | Validación |
|-------|----------|------------|
| **Nombre** | ✅ | 2-50 chars, letras |
| **Email** | ❌ | Solo lectura (clave única) |
| **Rol** | ✅ | student / admin |
| **Activo** | ✅ | Checkbox (bloqueo suave) |
| **Verificado** | ✅ | Forzar verificado (cuidado) |
| **Onboarding** | ✅ | Resetear onboarding |

### 5.3 Acciones Avanzadas

| Acción | Confirmación | Efecto |
|--------|--------------|--------|
| **Resetear Contraseña** | Modal + email | Envía link reset al email |
| **Forzar Logout** | Modal | Invalida todos los JWT/refresh tokens |
| **Reenviar Verificación** | Toast | Email verificación nuevo |
| **Desconectar Google** | Modal + confirmar | Revoca tokens OAuth, borra cursos sync |
| **Eliminar Usuario** | 2 modales + "ELIMINAR" | **IRREVERSIBLE** - Borra todo |

---

## 6. Roles y Permisos

### 6.1 Sistema de Roles

CAPU usa **RBAC simple** (2 roles):

| Rol | Descripción | Permisos Base |
|-----|-------------|---------------|
| **student** | Usuario estándar | `user:*` (propias tareas, tokens, perfil) |
| **admin** | Administrador | `user:*` + `admin:*` (todo) |

### 6.2 Matriz de Permisos

| Recurso | student | admin |
|---------|---------|-------|
| **Own Tasks** | CRUD | CRUD + All |
| **Own Tokens** | Read | Read + All |
| **Own Profile** | CRUD | CRUD + All |
| **Classroom Sync** | Own | All + Force |
| **Rewards** | View/Canje | CRUD + Stock |
| **Users** | - | CRUD |
| **Courses** | View Own | CRUD + Map |
| **Metrics** | Own | All |
| **Audit Logs** | - | Read |
| **Config** | - | Read/Write |

### 6.3 Crear Admin

**Solo desde BD o CLI** (no hay UI para auto-promocionar):

```sql
-- Opción 1: SQL directo
UPDATE usuario SET rol = 'admin' WHERE email = 'nuevo@admin.com';

-- Opción 2: Script Node
node scripts/create-admin.js nuevo@admin.com
```

### 6.4 Buenas Prácticas

- **Mínimo 2 admins** por institución
- **No usar admin** para uso diario (crear usuario student separado)
- **Rotar admins** periódicamente
- **Auditar** cambios de rol en logs

---

## 7. Bloqueo y Eliminación

### 7.1 Bloqueo (Soft Delete - Recomendado)

**Acción:** `Activo = false` en usuario

**Efectos:**
- ❌ No puede iniciar sesión
- ❌ JWT existentes invalidados en siguiente request
- ✅ Datos preservados (tareas, tokens, historial)
- ✅ Reversible (reactivar = check Activo)

**Cuándo usar:**
- Usuario temporalmente inactivo
- Investigación de abuso
- Baja temporal (intercambio, enfermedad)

### 7.2 Eliminación (Hard Delete - Irreversible)

**Proceso de confirmación triple:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ ELIMINAR USUARIO                                        │
│                                                             │
│  Usuario: Juan Pérez (juan@uni.edu)                         │
│  ID: 42                                                     │
│                                                             │
│  SE ELIMINARÁ PERMANENTEMENTE:                              │
│  ✅ Cuenta y credenciales                                   │
│  ✅ Todas las tareas (propias y Classroom)                  │
│  ✅ Historial de tokens y transacciones                     │
│  ✅ Canjes de recompensas                                   │
│  ✅ Notificaciones y preferencias                           │
│  ✅ Logs de auditoría relacionados                          │
│  ✅ Tokens OAuth Google (revocados)                         │
│                                                             │
│  Escribe "ELIMINAR" para confirmar: [____________]         │
│                                                             │
│  [Cancelar]  [Eliminar - IRREVERSIBLE]                     │
└─────────────────────────────────────────────────────────────┘
```

**Checklist pre-eliminación:**
- [ ] Usuario inactivo > 90 días (o solicitud expresa)
- [ ] No hay investigaciones en curso
- [ ] Backup reciente de BD verificado
- [ ] Notificado a usuario (si posible)
- [ ] Aprobación segundo admin (recomendado)

---

## 8. Exportación de Datos

### 8.1 Exportar Usuarios (CSV)

**Campos incluidos:**
```csv
id,nombre,email,rol,google_conectado,verificado,onboarding_completado,
ultimo_login,creado_en,total_tareas,total_entregas,tokens_saldo,
racha_actual,racha_maxima
```

### 8.2 Exportar Actividad (CSV)

Por usuario o global (últimos 30d por defecto):

```csv
fecha,usuario_id,usuario_email,accion,detalle,ip,user_agent
```

### 8.3 Exportar Tokens (CSV)

```csv
fecha,usuario_id,usuario_email,tipo,cantidad,motivo,tarea_id,curso_id
```

### 8.4 Programación de Exportaciones

En Configuración → **Exportaciones Automáticas**:
- **Diaria**: Usuarios nuevos, actividad día anterior
- **Semanal**: Reporte completo usuarios + métricas
- **Mensual**: Auditoría completa + métricas gamificación
- **Destino**: Email admin / SFTP / S3 (configurable)

---

# PARTE III: GESTIÓN DE CURSOS

## 9. Sincronización con Classroom

### 9.1 Vista de Cursos Sincronizados

![Admin Courses](images/admin-courses.png)
*Figura 9.1: Listado de cursos detectados via Classroom*

| Columna | Descripción |
|---------|-------------|
| **ID Classroom** | ID único de Google |
| **Nombre** | Nombre del curso |
| **Sección** | Sección/grupo |
| **Profesor** | Email del owner (solo lectura) |
| **Estudiantes** | Count de estudiantes en curso |
| **Tareas Sync** | Tareas sincronizadas a CAPU |
| **Último Sync** | Timestamp último sync exitoso |
| **Estado** | Activo / Archivado / Error Sync |
| **Acciones** | Ver detalle / Forzar Sync / Mapear |

### 9.2 Detalle de Curso

Click en curso → modal con:

- **Info básica** (nombre, sección, descripción, room)
- **Estudiantes vinculados** (lista usuarios CAPU en este curso)
- **Tareas del curso** (tabla con estado sync)
- **Historial sync** (últimos 20 con estado/detalle)
- **Métricas** (entregas, tokens generados, tasa entrega)

### 9.3 Forzar Sincronización

**Botón "Sincronizar Ahora"** en cada fila o detalle:

```
Proceso:
1. Llama POST /api/admin/courses/:id/sync
2. Job en background (no bloquea UI)
3. Toast: "Sincronización iniciada..."
4. Polling cada 3s hasta completar
5. Resultado: "OK: 5 nuevas, 2 actualizadas, 0 errores"
   o "ERROR: [detalle]"
```

### 9.4 Monitoreo de Sync

**Dashboard Sync** (en Métricas):
- Tasa éxito global (target > 95%)
- Tiempo promedio sync
- Errores por tipo (auth, rate limit, network, parsing)
- Cursos con sync fallando > 3 veces

---

## 10. Cursos Activos y Archivado

### 10.1 Estados de Curso

| Estado | Significado | Acción Auto |
|--------|-------------|-------------|
| **active** | Curso normal en Classroom | Sync normal |
| **archived** | Archivado en Classroom | Oculto de selectores, no sync |
| **error_sync** | 3+ fallos consecutivos | Alert admin, pausa auto-sync |
| **orphaned** | Existe en CAPU no en Classroom | Revisar manualmente |

### 10.2 Archivado Automático

CAPU detecta `courseState: 'ARCHIVED'` en Classroom y:
1. Marca `archivado = true` en BD
2. Oculta de selectores usuario
3. Pausa sync automático
4. **No elimina** tareas históricas (tokens ya ganados)

### 10.3 Restaurar Archivado

Si profesor restaura en Classroom:
- Próximo sync detecta `ACTIVE`
- Marca `archivado = false`
- Reanuda sync automático
- Tareas nuevas aparecen normal

---

## 11. Mapeo de Cursos

### 11.1 ¿Por qué Mapear?

- Usuarios pueden tener **mismo curso en múltiples cuentas** Classroom
- **Nombres distintos** para mismo contenido (ej: "Mate 1" vs "Matemáticas I")
- **Agrupar** para métricas y recompensas por área

### 11.2 Interfaz de Mapeo

![Course Mapping](images/admin-course-mapping.png)
*Figura 11.1: Interfaz de mapeo de cursos*

**Proceso:**
1. Seleccionar cursos origen (checkboxes)
2. Click **"Mapear seleccionados"**
3. Elegir/crear **Curso Canónico** (nombre unificado)
4. Asignar **Categoría** (Ciencias, Letras, Ingeniería, etc.)
5. **Color** para UI (auto o manual)
6. Guardar

### 11.3 Efectos del Mapeo

| Área | Cambio |
|------|--------|
| **Agenda Usuario** | Filtro por "Curso Canónico" agrupa todos |
| **Métricas** | Agregación por categoría/canonical |
| **Recompensas** | Pueden ser por categoría |
| **Admin Tareas** | Vista unificada por canonical |

### 11.4 Deshacer Mapeo

- Botón **"Desmapear"** en fila
- Vuelve a estado individual
- Histórico preservado

---

# PARTE IV: GESTIÓN DE TAREAS (ADMIN)

## 12. Vista Global de Tareas

Acceso: Admin → **Tareas** → Vista global de **TODAS** las tareas del sistema:

![Admin Tasks Global](images/admin-tasks-global.png)
*Figura 12.1: Vista global de tareas con paginación server-side*

### 12.1 Diferencias vs Vista Usuario

| Aspecto | Usuario | Admin |
|---------|---------|-------|
| **Alcance** | Solo propias | Todas (todas usuarios) |
| **Filtros** | Básicos | Avanzados + usuario |
| **Acciones** | Ver/Editar/Completar | Ver + Acciones masivas |
| **Origen** | Classroom + Propias | Todos + Metadatos sync |

### 12.2 Columnas Tabla Admin

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Nombre + email (link a detalle user) |
| **Curso** | Nombre curso (canonical si mapeado) |
| **Título** | Truncado 50 chars, tooltip completo |
| **Origen** | 🏫 Classroom / ✏️ Personalizada |
| **Estado** | Badge color (Pendiente/Progreso/Vencida/Entregada) |
| **Fecha Límite** | Con indicador urgencia |
| **Creada** | Timestamp creación en CAPU |
| **Última Sync** | Si Classroom: último sync detectado |
| **Tokens** | Ganados por esta tarea (0 si pendiente) |
| **Acciones** | Ver detalle / Forzar estado |

---

## 13. Filtros Avanzados Admin

![Admin Tasks Filters](images/admin-tasks-filters.png)
*Figura 13.1: Panel de filtros avanzados para tareas*

### 13.1 Filtros Disponibles

| Filtro | Tipo | Descripción |
|--------|------|-------------|
| **Usuario** | Autocomplete | Buscar por nombre/email (mín 2 chars) |
| **Curso** | Select | Todos / Canónicos / Classroom individuales |
| **Estado** | Multi-select | Pendiente/Progreso/Vencida/Entregada |
| **Origen** | Select | Todos / Classroom / Personalizada |
| **Fecha Límite** | Date Range | Desde / Hasta |
| **Fecha Creación** | Date Range | Desde / Hasta |
| **Con Tokens** | Checkbox | Solo tareas que otorgaron tokens |
| **Sin Entregar** | Checkbox | Solo vencidas sin entregar |
| **Sync Status** | Select | Todos / Synced / Pending / Error |

### 13.2 Búsqueda Texto Libre

Busca en: **título + descripción + nombre curso + email usuario**

### 13.3 Guardar Filtros

- Botón **"Guardar vista"** → Nombre → Acceso rápido en sidebar
- Hasta 10 vistas guardadas por admin

---

## 14. Acciones Masivas

Selección múltiple (checkboxes) + barra de acciones:

![Admin Bulk Actions](images/admin-bulk-actions.png)
*Figura 14.1: Barra de acciones masivas*

### 14.1 Acciones Disponibles

| Acción | Aplica a | Confirmación | Efecto |
|--------|----------|--------------|--------|
| **Marcar Entregada** | Pendiente/Progreso/Vencida | Modal + "CONFIRMAR" | Estado=entregada, tokens si a tiempo |
| **Marcar Vencida** | Pendiente/Progreso | Modal | Estado=vencida, 0 tokens |
| **Re-sincronizar** | Classroom | Toast | Fuerza sync individual |
| **Eliminar (Personalizadas)** | Solo personalizadas | 2 modales + "ELIMINAR" | Hard delete |
| **Exportar Selección** | Cualquiera | Toast | CSV descarga |
| **Notificar Usuarios** | Cualquiera | Modal plantilla | Push/email a usuarios dueños |

### 14.2 "Marcar Entregada" - Lógica Tokens

```
Para cada tarea seleccionada:
1. Si ya entregada → skip (log: "ya entregada")
2. Si vencida (fecha < ahora) → estado=entregada, tokens=0
3. Si a tiempo (fecha >= ahora):
   - estado=entregada
   - tokens = 10 (base) + 5 (si >=24h antelación) + racha_bono
   - Actualiza racha usuario
   - Crea transacción token
   - Notifica usuario (push)
4. Log auditoría: admin_id, tarea_ids[], accion="bulk_complete"
```

### 14.3 Límites de Seguridad

- **Máx 100 tareas** por acción masiva
- **Rate limit**: 5 acciones masivas/minuto por admin
- **Solo admins** con permiso `admin:tasks:write`

---

# PARTE V: SISTEMA DE RECOMPENSAS

## 15. Crear Recompensas

Acceso: Admin → **Recompensas** → **"Nueva Recompensa"**

![Admin Create Reward](images/admin-create-reward.png)
*Figura 15.1: Formulario de creación de recompensa*

### 15.1 Formulario Completo

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| **Nombre** | Texto | ✅ | 3-100 chars, único |
| **Descripción** | Texto largo | ✅ | 10-500 chars |
| **Costo (tokens)** | Número | ✅ | 1-10000, entero |
| **Categoría** | Select | ✅ | Ver tabla categorías |
| **Imagen URL** | URL | ❌ | HTTPS, max 2MB, 400x400px rec |
| **Stock** | Número | ❌ | -1 = ilimitado, 0-9999 |
| **Activa** | Checkbox | ✅ | Default: true |
| **Destacada** | Checkbox | ❌ | Default: false (show en top) |
| **Fecha Inicio** | DateTime | ❌ | Default: ahora |
| **Fecha Fin** | DateTime | ❌ | Default: sin límite |
| **Requisitos** | JSON | ❌ | Ver sección 15.2 |

### 15.2 Requisitos Avanzados (JSON)

```json
{
  "racha_minima": 7,
  "tokens_totales_minimos": 500,
  "cursos_completados": ["matematicas", "fisica"],
  "nivel_minimo": 3,
  "solo_nuevos_usuarios": false,
  "max_canjes_por_usuario": 1
}
```

| Requisito | Descripción |
|-----------|-------------|
| `racha_minima` | Días consecutivos mínimos |
| `tokens_totales_minimos` | Tokens ganados histórico |
| `cursos_completados` | Array de canonical course IDs |
| `nivel_minimo` | Nivel usuario (basado en tokens totales) |
| `solo_nuevos_usuarios` | Registrados < 30 días |
| `max_canjes_por_usuario` | Límite por persona |

### 15.3 Categorías Predefinidas

| Categoría | Ícono | Color | Uso Típico |
|-----------|-------|-------|------------|
| **Alimentación** | ☕ | Marrón | Café, snacks, comidas |
| **Académico** | 📚 | Azul | Extensiones, pases, tutorías |
| **Entretenimiento** | 🎮 | Púrpura | Cine, streaming, juegos |
| **Merchandising** | 👕 | Verde | Ropa, stickers, accesorios |
| **Experiencias** | 🎪 | Naranja | Talleres, eventos, mentoría |
| **Bienestar** | 🧘 | Turquesa | Gimnasio, spa, mindfulness |
| **Tecnología** | 💻 | Gris | Accesorios, software, gadgets |

### 15.4 Vista Previa

Botón **"Vista Previa"** → Modal simula tarjeta usuario:

![Reward Preview](images/admin-reward-preview.png)
*Figura 15.2: Vista previa de recompensa como la ve el estudiante*

---

## 16. Editar y Gestionar Stock

### 16.1 Listado de Recompensas

![Admin Rewards List](images/admin-rewards-list.png)
*Figura 16.1: Grid/Tablas de recompensas con stock visible*

### 16.2 Estados de Stock

| Stock | Visual | Comportamiento |
|-------|--------|----------------|
| **> 10** | 🟢 Verde | Normal |
| **1-10** | 🟡 Amarillo | "Pocas unidades" |
| **0** | 🔴 Rojo | "Agotada" - no canjeable |
| **-1 (ilimitado)** | ♾️ Infinito | Siempre disponible |

### 16.3 Edición Rápida (Inline)

Click en **stock** o **activa** → edit inline:

![Inline Edit](images/admin-inline-edit.png)
*Figura 16.2: Edición inline de stock y estado*

### 16.4 Ajuste Masivo de Stock

Selección múltiple → **"Ajustar Stock"**:
- **Sumar** +N
- **Restar** -N (min 0)
- **Establecer** = N
- **Ilimitado** = -1

### 16.5 Duplicar Recompensa

Botón **"Duplicar"** → Copia todo menos:
- Nombre: "Copia de [original]"
- Stock: 0
- Activa: false
- Fechas: ahora / sin fin

---

## 17. Categorías y Costos

### 17.1 Gestión de Categorías

Admin → **Recompensas** → **"Gestionar Categorías"**

![Categories Management](images/admin-categories.png)
*Figura 17.1: CRUD de categorías de recompensas*

| Acción | Descripción |
|--------|-------------|
| **Crear** | Nombre, ícono (emoji), color hex, orden |
| **Editar** | Cambiar cualquier campo |
| **Reordenar** | Drag & drop para orden en UI |
| **Eliminar** | Solo si 0 recompensas asociadas |

### 17.2 Políticas de Costos (Guías)

| Categoría | Rango Sugerido | Lógica |
|-----------|----------------|--------|
| **Alimentación** | 30-80 | Uso frecuente, bajo valor |
| **Académico** | 100-300 | Alto valor, uso ocasional |
| **Entretenimiento** | 50-150 | Medio |
| **Merchandising** | 80-200 | Físico, costo real |
| **Experiencias** | 200-500 | Único, alto impacto |
| **Bienestar** | 50-150 | Recurrente |
| **Tecnología** | 300-1000 | Alto costo real |

### 17.3 Análisis de Economía

**Dashboard Recompensas** (en Métricas):
- **Tokens totales en circulación** vs **Valor canjes**
- **Tasa conversión** (canjes / usuarios activos)
- **Recompensas más/menos canjeadas**
- **Stock aging** (días sin movimiento)
- **ROI estimado** (costo real vs tokens)

---

## 18. Historial de Canjes Globales

Acceso: Admin → **Recompensas** → **"Historial Canjes"**

![Global Redemptions](images/admin-redemptions-history.png)
*Figura 18.1: Historial paginado de todos los canjes*

### 18.1 Tabla de Canjes

| Columna | Descripción |
|---------|-------------|
| **Fecha** | Timestamp canje |
| **Usuario** | Nombre + email (link) |
| **Recompensa** | Nombre + categoría |
| **Costo** | Tokens gastados |
| **Código** | Código único generado (si aplica) |
| **Estado** | ✅ Entregado / ⏳ Pendiente / ❌ Cancelado |
| **Admin** | Quién marcó entregado (si manual) |
| **Acciones** | Ver detalle / Marcar entregado / Cancelar |

### 18.2 Flujo de Entrega Física

Para recompensas físicas (merch, comida):

1. Usuario canjea → Estado: **Pendiente**
2. Admin ve en historial → Prepara recompensa
3. Admin click **"Marcar Entregado"** → Modal:
   - Código seguimiento (opcional)
   - Nota interna
4. Usuario recibe notificación: *"Tu recompensa 'Camiseta CAPU' ha sido entregada"*

### 18.3 Cancelación de Canje

**Solo admin** puede cancelar:
- Click **"Cancelar"** → Modal confirmación
- **Devuelve tokens** al usuario automáticamente
- Log: `tipo: 'canje_cancelado', admin_id, tokens_devueltos`
- Notifica usuario: *"Tu canje fue cancelado, tokens devueltos"*

### 18.4 Exportación Canjes

CSV con todos los campos + `usuario_id, recompensa_id, transaccion_token_id`

---

# PARTE VI: MÉTRICAS Y ANALÍTICAS

## 19. Dashboard de Métricas

Acceso: Admin → **Métricas** → Vista principal

![Admin Metrics](images/admin-metrics-dashboard.png)
*Figura 19.1: Dashboard completo de métricas*

### 19.1 Secciones del Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  SELECTOR PERÍODO: [7d ▼] [30d] [90d] [Personalizado]          │
├─────────────────────────────────────────────────────────────────┤
│  FILA 1: KPIs Principales (4 tarjetas)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Usuarios  │ │Tareas    │ │Entregas  │ │Tokens    │           │
│  │Activos   │ │Creadas   │ │Tasa      │ │Circul.   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  FILA 2: Gráficos Principales (2x2)                             │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ Usuarios Activos    │ │ Tareas Creadas vs   │               │
│  │ Diarios (línea)     │ │ Entregadas (barras) │               │
│  └─────────────────────┘ └─────────────────────┘               │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ Tokens Ganados/Gast.│ │ Tasa Entrega por    │               │
│  │ (área apilada)      │ │ Día Semana (radar)  │               │
│  └─────────────────────┘ └─────────────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  FILA 3: Tablas de Detalle                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ Top 10 Usuarios     │ │ Top 10 Cursos       │               │
│  │ por Tokens          │ │ por Entregas        │               │
│  └─────────────────────┘ └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 KPIs Definidos

| KPI | Fórmula | Target Saludable |
|-----|---------|------------------|
| **Usuarios Activos Diarios (DAU)** | Count distinct users con login/acción | > 20% registrados |
| **Usuarios Activos Semanales (WAU)** | Count distinct users 7d | > 50% registrados |
| **Retención D1** | % usuarios que vuelven día 1 | > 40% |
| **Retención D7** | % usuarios que vuelven día 7 | > 20% |
| **Tareas Creadas/Día** | Total tareas (Classroom+manual) / días | Creciente |
| **Tasa Entrega Global** | Entregadas a tiempo / Total vencidas | > 75% |
| **Tokens en Circulación** | Sum(saldo) todos usuarios | Creciente |
| **Velocidad Tokens** | Tokens ganados/día / Usuarios activos | > 5/día/usuario |
| **Tasa Canje** | Canjes / Usuarios activos 30d | > 10% |
| **Sync Success Rate** | Syncs OK / Total syncs | > 98% |

---

## 20. Métricas de Usuarios

Pestaña **"Usuarios"** en Métricas:

![Metrics Users](images/admin-metrics-users.png)
*Figura 20.1: Métricas detalladas de usuarios*

### 20.1 Cohort Analysis

**Tabla de Retención por Cohorte (Semanal):**

| Cohorte (Semana Registro) | Tamaño | Semana 1 | Semana 2 | Semana 3 | Semana 4 |
|---------------------------|--------|----------|----------|----------|----------|
| 2024-W45 | 127 | 100% | 45% | 32% | 28% |
| 2024-W46 | 98 | 100% | 52% | 38% | - |
| 2024-W47 | 156 | 100% | 41% | - | - |

### 20.2 Segmentación Usuarios

| Segmento | Criterio | Acciones Recomendadas |
|----------|----------|----------------------|
| **Power Users** | Tokens > P90, racha > 14 | Beta features, embajadores |
| **Activos** | Login 7d, tareas > 3/sem | Mantener engagement |
| **En Riesgo** | Login 14d, sin tareas 7d | Push reactivación, email |
| **Inactivos** | Sin login 30d | Campaña re-engagement |
| **Solo Classroom** | 0 tareas manuales | Promover tareas pers. |
| **Solo Manual** | 0 sync Classroom | Ayudar conectar Google |

### 20.3 Embudo de Conversión

```
Registro → Verificación → Primer Login → Conectar Google
   100%       85%           78%             52%
                    ↓                    ↓
             Primer Tarea → Primera Entrega → Primer Canje
                65%           58%              23%
```

---

## 21. Métricas de Gamificación

Pestaña **"Gamificación"**:

![Metrics Gamification](images/admin-metrics-gamif.png)
*Figura 21.1: Métricas específicas del sistema de tokens*

### 21.1 Economía de Tokens

| Métrica | Descripción | Alerta si |
|---------|-------------|-----------|
| **Inflación Tokens** | (Ganados - Gastados) / Ganados | > 50% (acumulación) |
| **Velocidad Circulación** | Gastados / (Ganados + Stock inicial) | < 0.1 (estancamiento) |
| **Gini Tokens** | Desigualdad distribución saldos | > 0.7 (muy desigual) |
| **Racha Promedio** | Mean(racha_actual) usuarios activos | < 3 (bajo engagement) |
| **Racha Máxima Global** | Max(racha_maxima) | Seguimiento récord |

### 21.2 Distribución de Saldo

![Token Distribution](images/admin-token-distribution.png)
*Figura 21.2: Histograma de distribución de saldos de tokens*

### 21.3 Análisis de Recompensas

| Métrica | Fórmula | Interpretación |
|---------|---------|----------------|
| **Popularidad** | Canjes / Usuarios activos | Demanda |
| **Accesibilidad** | % usuarios con saldo >= costo | Barrera entrada |
| **Rotación Stock** | Canjes / (Stock inicial + Reposiciones) | Gestión inventario |
| **Valor Percibido** | Encuesta NPS post-canje (1-10) | Satisfacción |

---

## 22. Métricas de Sincronización

Pestaña **"Sincronización"**:

![Metrics Sync](images/admin-metrics-sync.png)
*Figura 22.1: Health check de sincronización Classroom*

### 22.1 Métricas Clave Sync

| Métrica | Target | Crítico si |
|---------|--------|------------|
| **Tasa Éxito Global** | > 98% | < 95% |
| **Tiempo Promedio** | < 5s | > 15s |
| **Cursos con Error** | 0 | > 5 |
| **Rate Limit Hits** | 0/día | > 10/día |
| **Tokens Otorgados/Sync** | Consistente | Caída > 50% |

### 22.2 Errores por Tipo

| Tipo Error | Causa Común | Acción |
|------------|-------------|--------|
| **401 Unauthorized** | Token expirado/revogado | Re-conectar usuario |
| **403 Forbidden** | Sin permisos curso | Verificar rol usuario |
| **429 Rate Limit** | Muchos requests | Backoff exponencial |
| **500 Server Error** | Google API down | Reintentar, alertar |
| **Timeout** | Red lenta | Aumentar timeout |
| **Parse Error** | Cambio API | Actualizar parser |

### 22.3 Debug Sync Individual

En detalle de curso → **"Debug Sync"**:
- Request/Response completo (sanitizado)
- Timing por paso
- Diff con estado anterior
- Logs asociados

---

## 23. Exportación de Reportes

### 23.1 Tipos de Reporte

| Reporte | Frecuencia | Formato | Destinatarios |
|---------|------------|---------|---------------|
| **Ejecutivo** | Semanal | PDF | Directivos |
| **Operativo** | Diario | CSV/Excel | Admins |
| **Gamificación** | Mensual | PDF + CSV | Producto |
| **Técnico** | Diario | JSON | DevOps |
| **Auditoría** | Mensual | CSV | Compliance |

### 23.2 Programación

Admin → **Config** → **Reportes Programados**:

![Scheduled Reports](images/admin-scheduled-reports.png)
*Figura 23.1: Configuración de reportes automáticos*

### 23.3 Plantilla Reporte Ejecutivo (PDF)

```
┌─────────────────────────────────────────────────────────────┐
│                    REPORTE SEMANAL CAPU                     │
│                    Semana 47, 2024                          │
├─────────────────────────────────────────────────────────────┤
│  RESUMEN EJECUTIVO                                          │
│  • Usuarios activos: 1,247 (+12% vs semana anterior)        │
│  • Tareas entregadas: 3,456 (tasa 82%)                      │
│  • Tokens en circulación: 2.4M (+15%)                       │
│  • Canjes realizados: 89 (nuevo récord)                     │
├─────────────────────────────────────────────────────────────┤
│  GRÁFICOS: [DAU] [Entregas] [Tokens] [Retención]            │
├─────────────────────────────────────────────────────────────┤
│  TOP 5 CURSOS POR ENTREGAS                                  │
│  1. Cálculo I - 456 entregas                                │
│  2. Física II - 389 entregas                                │
│  ...                                                         │
├─────────────────────────────────────────────────────────────┤
│  ALERTAS:                                                   │
│  ⚠️ 3 cursos con sync fallando > 24h                        │
│  ✅ 0 errores críticos servidor                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PARTE VII: AUDITORÍA Y LOGS

## 24. Logs de Auditoría

Acceso: Admin → **Auditoría**

![Admin Audit](images/admin-audit.png)
*Figura 24.1: Visor de logs de auditoría con filtros*

### 24.1 Estructura de Log

```json
{
  "id": 12345,
  "timestamp": "2024-11-15T14:30:22.123Z",
  "admin_id": 3,
  "admin_email": "admin@uni.edu",
  "action": "user.delete",
  "resource_type": "usuario",
  "resource_id": "42",
  "details": {
    "target_email": "estudiante@uni.edu",
    "target_name": "Juan Pérez",
    "reason": "Solicitud RGPD",
    "confirmation": "ELIMINAR"
  },
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "result": "success",
  "duration_ms": 245
}
```

### 24.2 Acciones Auditadas

| Categoría | Acciones |
|-----------|----------|
| **Usuarios** | create, update, delete, block, unblock, role_change, force_logout, password_reset, google_disconnect |
| **Cursos** | sync_force, map, unmap, archive, restore |
| **Tareas** | bulk_complete, bulk_delete, bulk_notify, force_sync |
| **Recompensas** | create, update, delete, stock_adjust, redemption_approve, redemption_cancel |
| **Config** | update_gamification, update_notifications, update_system |
| **Seguridad** | secret_rotation, session_revoke_all, 2fa_enforce |

### 24.3 Retención de Logs

| Nivel | Retención | Almacenamiento |
|-------|-----------|----------------|
| **Crítico (seguridad)** | 7 años | BD + Backup inmutable |
| **Admin (escritura)** | 3 años | BD |
| **Admin (lectura)** | 1 año | BD |
| **Sistema (errores)** | 90 días | BD + Log files |
| **Debug** | 7 días | Log files only |

---

## 25. Filtros de Auditoría

![Audit Filters](images/admin-audit-filters.png)
*Figura 25.1: Filtros avanzados de auditoría*

| Filtro | Tipo | Descripción |
|--------|------|-------------|
| **Fecha** | Date Range | Desde / Hasta (presets: 24h, 7d, 30d) |
| **Admin** | Autocomplete | Buscar admin por email/nombre |
| **Acción** | Multi-select | Checkbox por acción (agrupadas por categoría) |
| **Recurso** | Select | usuario / curso / tarea / recompensa / config |
| **ID Recurso** | Texto | ID exacto |
| **Resultado** | Select | success / error / partial |
| **IP** | Texto | IPv4/IPv6 exacta o CIDR |
| **Solo Errores** | Checkbox | Filtro rápido result=error |

### 25.2 Búsqueda Texto Libre

Busca en: `admin_email`, `details` (JSON stringificado), `user_agent`

### 25.3 Exportación Auditoría

- **CSV**: Filtros aplicados, máx 10,000 filas
- **JSONL**: Completo, streaming para grandes volúmenes
- **Firma digital**: Hash SHA-256 en cada fila para integridad

---

## 26. Alertas de Seguridad

### 26.1 Reglas de Alerta Automáticas

| Regla | Trigger | Severidad | Acción |
|-------|---------|-----------|--------|
| **Login Anómalo** | Admin login desde IP/país nuevo | 🟡 Media | Email + Push admin |
| **Múltiples Fallos** | >5 login fallidos admin/15min | 🔴 Crítica | Bloqueo IP temporal + Alert |
| **Eliminación Masiva** | >10 users eliminados/hora | 🔴 Crítica | Requiere 2FA + Alert all admins |
| **Cambio Config Crítica** | Gamificación, secretos, roles | 🟠 Alta | Log + Email admins |
| **Acceso Auditoría** | Lectura logs > 1000 filas/hora | 🟡 Media | Log + Revisar |
| **Token Rotation** | Rotación secretos JWT | 🟢 Info | Log + Confirmación |

### 26.2 Panel de Alertas

![Security Alerts](images/admin-security-alerts.png)
*Figura 26.1: Centro de alertas de seguridad*

- **Tiempo real** (WebSocket)
- **Acknowledge** por admin (marca como vista)
- **Escalamiento** si no ack en 1h → Email + SMS
- **Historial** con estado (Nueva/En revisión/Resuelta/Falso positivo)

---

# PARTE VIII: CONFIGURACIÓN DEL SISTEMA

## 27. Configuración General

Acceso: Admin → **Configuración** → **General**

![Config General](images/admin-config-general.png)
*Figura 27.1: Configuración general del sistema*

### 27.1 Parámetros Generales

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| **Nombre Institución** | Texto | "CAPU" | Branding en emails/UI |
| **Dominio Permitido** | Texto | "" | Restringir registro @dominio.edu |
| **Modo Mantenimiento** | Bool | false | Bloquea logins no-admin |
| **Mensaje Mantenimiento** | Texto | "" | Mostrado en login si modo on |
| **Registro Abierto** | Bool | true | Permitir auto-registro |
| **Verificación Obligatoria** | Bool | true | Bloquea uso sin verificar email |
| **Max Tareas Usuario** | Número | 500 | Límite tareas personalizadas |
| **Session Timeout** | Minutos | 1440 (24h) | JWT access token expiry |
| **Refresh Token Days** | Días | 30 | Refresh token expiry |

### 27.2 Branding y Apariencia

| Config | Tipo | Uso |
|--------|------|-----|
| **Logo URL** | URL | Header, emails, PWA manifest |
| **Color Primario** | Hex | `#C4571A` - Botones, links, badges |
| **Color Secundario** | Hex | `#2E7D32` - Éxito, secundario |
| **Favicon** | URL | Browser tab, PWA icon |
| **Footer HTML** | Texto | Links legales, contacto |

---

## 28. Parámetros de Gamificación

Admin → **Configuración** → **Gamificación**

![Config Gamificacion](images/admin-config-gamif.png)
*Figura 28.1: Parámetros del motor de gamificación*

### 28.1 Tabla de Recompensas Tokens

| Evento | Tokens | Configurable | Descripción |
|--------|--------|--------------|-------------|
| **Entrega a tiempo** | 10 | ✅ | Base |
| **Entrega anticipada (24h+)** | +5 | ✅ | Bono extra |
| **Entrega muy anticipada (7d+)** | +5 | ✅ | Máx bono anticipación |
| **Racha día 1-5** | +1/día | ✅ | Progresivo |
| **Racha día 6-14** | +2/día | ✅ | |
| **Racha día 15-30** | +3/día | ✅ | |
| **Racha día 31-60** | +4/día | ✅ | |
| **Racha día 61+** | +5/día | ✅ | Tope máximo |
| **Primera tarea día** | +2 | ✅ | Incentivo inicio |
| **Completar 5 tareas/sem** | +10 | ✅ | Bono semanal |
| **Completar 20 tareas/mes** | +50 | ✅ | Bono mensual |

### 28.2 Configuración de Rachas

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| **Zona Horaria Rachas** | UTC | Corte día para racha |
| **Días Gracia** | 0 | Días permitidos sin romper |
| **Racha Mínima Bono** | 1 | Día desde que aplica bono |
| **Bono Máximo Diario** | 5 | Cap tokens racha/día |

### 28.3 Niveles de Usuario

Basado en **tokens totales ganados (históricos)**:

| Nivel | Tokens Mín | Nombre | Beneficios |
|-------|------------|--------|------------|
| 1 | 0 | Novato | - |
| 2 | 100 | Estudiante | Badge perfil |
| 3 | 500 | Dedicado | +10% tokens entregas |
| 4 | 1,500 | Experto | Acceso recompensas exclusivas |
| 5 | 3,500 | Maestro | Badge animado, prioridad soporte |
| 6 | 7,500 | Leyenda | Cosméticos únicos, wall of fame |

---

## 29. Configuración de Notificaciones

Admin → **Configuración** → **Notificaciones**

![Config Notif](images/admin-config-notif.png)
*Figura 29.1: Configuración global de notificaciones*

### 29.1 Canales

| Canal | Habilitado | Proveedor | Config |
|-------|------------|-----------|--------|
| **Push Web** | ✅ | Web Push API | VAPID keys |
| **Email** | ✅ | SMTP / SendGrid / AWS SES | API keys |
| **In-App** | ✅ | Interno | Siempre on |
| **SMS** | ❌ | Twilio / Vonage | Opcional |
| **Slack** | ❌ | Webhook | Solo alertas admin |
| **Discord** | ❌ | Webhook | Solo alertas admin |

### 29.2 Plantillas de Email

Editor visual para:
- **Verificación cuenta**
- **Reset contraseña**
- **Recordatorio 24h / 1h**
- **Tarea vencida**
- **Recompensa canjeada**
- **Digest semanal**
- **Alerta seguridad admin**

Variables disponibles: `{{nombre}}`, `{{email}}`, `{{tarea_titulo}}`, `{{fecha_limite}}`, `{{tokens_ganados}}`, `{{recompensa_nombre}}`, `{{codigo_canje}}`

### 29.3 Rate Limiting Notificaciones

| Tipo | Límite | Ventana |
|------|--------|---------|
| **Push usuario** | 10 | 1 hora |
| **Email usuario** | 5 | 1 hora |
| **Digest semanal** | 1 | 7 días |
| **Alertas admin** | 50 | 1 hora |

---

## 30. Mantenimiento y Limpieza

Admin → **Configuración** → **Mantenimiento**

![Config Maintenance](images/admin-config-maintenance.png)
*Figura 30.1: Tareas de mantenimiento programadas*

### 30.1 Jobs Automáticos

| Job | Frecuencia | Descripción |
|-----|------------|-------------|
| **Sync Classroom** | Cada 15 min | Sync incremental todos usuarios |
| **Recordatorios** | Cada 15 min | Check tareas → notificaciones 24h/1h |
| **Digest Semanal** | Lunes 9:00 | Email resumen semana |
| **Limpieza Tokens** | Diario 3:00 | Expired: refresh tokens, sesiones |
| **Limpieza Notif** | Diario 4:00 | Notificaciones > 90d leídas |
| **Limpieza Auditoría** | Semanal | Archiva logs > retención a cold storage |
| **Backup BD** | Diario 2:00 | Dump SQLite + upload S3 |
| **Rotación Secretos** | Cada 90 días | JWT secret, encryption keys |
| **Health Check** | Cada 5 min | Uptime, DB, Redis, Google API |

### 30.2 Ejecución Manual

Botones **"Ejecutar Ahora"** para cada job con:
- Confirmación modal
- Progress bar en tiempo real
- Resultado final con log

### 30.3 Limpieza Manual Específica

| Acción | Descripción | Cuidado |
|--------|-------------|---------|
| **Usuarios inactivos > 1 año** | Bloquea (no elimina) | Revisar lista antes |
| **Tareas vencidas > 2 años** | Archiva (oculta) | Preserva tokens |
| **Notificaciones > 1 año** | Elimina | Irreversible |
| **Sesiones expiradas** | Limpia BD | Seguro |
| **Tokens huérfanos** | Recalcula saldos | Verificar antes |

---

# PARTE IX: SEGURIDAD Y BACKUP

## 31. Gestión de Sesiones

Admin → **Seguridad** → **Sesiones**

![Session Management](images/admin-sessions.png)
*Figura 31.1: Gestión de sesiones activas*

### 31.1 Sesiones Activas (Global)

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Nombre + email |
| **Rol** | student / admin |
| **IP** | Origen |
| **País** | GeoIP |
| **Dispositivo** | User Agent parsed |
| **Inicio** | Timestamp login |
| **Última Actividad** | Timestamp last request |
| **Expira** | Timestamp expiry JWT |
| **Acciones** | Revocar / Revocar todas usuario |

### 31.2 Revocación Masiva

- **Por usuario**: Invalida todos sus refresh tokens
- **Por IP**: Revoca sesiones desde IP sospechosa
- **Global (Emergencia)**: Invalida TODOS los refresh tokens → **Requiere 2FA + 2do admin**

### 31.3 Políticas de Sesión

| Política | Valor | Configurable |
|----------|-------|--------------|
| **Max sesiones por usuario** | 5 | ✅ |
| **Timeout inactividad** | 30 min | ✅ |
| **Timeout absoluto** | 24h (JWT) / 30d (Refresh) | ✅ |
| **Concurrencia estricta** | false | ✅ |
| **Rotación refresh token** | true | ✅ (security) |

---

## 32. Backup y Restauración

### 32.1 Estrategia de Backup

| Tipo | Frecuencia | Retención | Ubicación |
|------|------------|-----------|-----------|
| **Full SQLite Dump** | Diario 02:00 | 30 días | S3 / GCS / Local |
| **Incremental (WAL)** | Cada 1 hora | 7 días | Local SSD |
| **Config + Secrets** | Diario | 90 días | Vault / S3 encriptado |
| **Uploads/Images** | Tiempo real | Infinito | S3 versionado |

### 32.2 Panel de Backup

![Backup Panel](images/admin-backup.png)
*Figura 32.1: Estado y gestión de backups*

### 32.3 Restauración

**Proceso guiado:**

```
┌─────────────────────────────────────────────────────────────┐
│  RESTAURAR BACKUP                                           │
│                                                             │
│  1. Seleccionar backup: [Lista con fecha, tamaño, tipo]    │
│                                                             │
│  2. Tipo de restauración:                                   │
│     ○ Completa (reemplaza BD actual)                        │
│     ○ Parcial: Solo tablas [usuario, tarea, token, ...]    │
│                                                             │
│  3. Verificación pre-restauración:                          │
│     ✅ Backup íntegro (checksum SHA-256)                    │
│     ✅ Versión schema compatible                            │
│     ⚠️ Datos actuales se PERDERÁN (completa)                │
│                                                             │
│  4. Confirmación TRIPLE:                                    │
│     [ ] Entiendo que es irreversible                        │
│     [ ] He verificado backup correcto                       │
│     [ ] Tengo segundo admin confirmando                     │
│     Escribe: "RESTAURAR_BACKUP_20241115_020000"            │
│                                                             │
│  [Cancelar]  [Iniciar Restauración]                         │
└─────────────────────────────────────────────────────────────┘
```

### 32.4 Point-in-Time Recovery (PITR)

Para SQLite: **WAL mode + backups horarios** permite recuperación a cualquier hora:
1. Restaurar full backup anterior al incidente
2. Replay WAL files hasta timestamp objetivo
3. Verificar integridad

---

## 33. Rotación de Secretos

Admin → **Seguridad** → **Rotación de Secretos**

![Secret Rotation](images/admin-secret-rotation.png)
*Figura 33.1: Panel de rotación de secretos criptográficos*

### 33.1 Secretos Gestionados

| Secreto | Uso | Rotación | Algoritmo |
|---------|-----|----------|-----------|
| **JWT_ACCESS_SECRET** | Firmar access tokens | 90 días | HS256 / RS256 |
| **JWT_REFRESH_SECRET** | Firmar refresh tokens | 90 días | HS256 / RS256 |
| **ENCRYPTION_KEY** | Encriptar OAuth tokens | 180 días | AES-256-GCM |
| **WEB_PUSH_VAPID** | Push notifications | 365 días | ECDSA P-256 |
| **SESSION_SECRET** | Express session | 90 días | HS256 |
| **CSRF_SECRET** | CSRF tokens | 90 días | HS256 |

### 33.2 Proceso de Rotación

```
1. Admin click "Rotar [Secreto]"
2. Sistema genera nuevo secreto (crypto-secure)
3. Período de gracia: 24h (acepta ambos)
4. Invalida tokens firmados con viejo (access inmediato, refresh en próximo uso)
5. Notifica a todos admins
6. Log en auditoría: secret_rotation, old_key_id, new_key_id
7. Actualiza .env / Vault automáticamente
```

### 33.3 Rotación de Emergencia

**Botón "ROTAR TODOS AHORA"** (Compromiso sospechado):
- Requiere 2FA + 2do admin
- Invalida **TODAS** las sesiones instantáneamente
- Genera nuevos secretos para TODO
- Fuerza re-login a todos los usuarios
- Envía email masivo: *"Por seguridad, tu sesión fue cerrada. Inicia sesión de nuevo."*

---

# PARTE X: SOLUCIÓN DE PROBLEMAS ADMIN

## 34. Problemas Comunes Admin

### 34.1 Usuarios

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| **Usuario no ve sus tareas Classroom** | 1. Verificar sync curso 2. Verificar rol estudiante en Classroom 3. Verificar tarea publicada con fecha | Forzar sync curso. Si persiste, desconectar/conectar Google |
| **Tokens no se otorgan** | 1. Revisar historial transacciones 2. Verificar fecha entrega vs límite 3. Verificar config gamificación | Recalcular: `POST /api/admin/users/:id/recalculate-tokens` |
| **Racha incorrecta** | Zona horaria corte día | Ajustar `TIMEZONE_RACHA` en config. Recalcular rachas |
| **Usuario no recibe notificaciones** | 1. Permisos navegador 2. Preferencias usuario 3. Service Worker registrado | Debug: `POST /api/admin/users/:id/test-notification` |

### 34.2 Sincronización Classroom

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| **Sync falla masivamente** | 1. Rate limit Google (429) 2. Token OAuth expirado 3. Cambio API Google | Backoff exponencial. Re-auth usuarios afectados. Revisar logs Google Cloud |
| **Cursos no aparecen** | Usuario no es "student" en curso (es teacher/TA) | Verificar en Classroom. Solo students sync |
| **Tareas duplicadas** | Bug en dedup (courseWorkId + userId) | Script limpieza: `npm run dedup-tasks` |

### 34.3 Recompensas

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| **Usuario no puede canjear** | 1. Saldo insuficiente 2. Requisitos no cumplidos 3. Stock 0 4. Fechas fuera rango | Verificar cada condición en detalle recompensa |
| **Canje duplicado** | Race condition frontend | Idempotency key en API. Verificar BD unique constraint |
| **Código canje no genera** | Proveedor externo falla | Fallback: código interno UUID. Revisar integración |

### 34.4 Rendimiento

| Síntoma | Causa Probable | Acción |
|---------|----------------|--------|
| **Dashboard lento** | Consultas sin índices / mucho datos | `EXPLAIN QUERY PLAN`. Añadir índices. Paginar. |
| **Sync tarda > 30s** | Muchos usuarios/cursos | Paralelizar por usuario. Batch requests. |
| **Error 500 intermitente** | SQLite locked / WAL contention | `PRAGMA busy_timeout=30000`. Connection pooling. |
| **Memoria alta Node** | Memory leak en job largo | Heap snapshot. Revisar closures en intervals. |

---

## 35. Debugging y Logs

### 35.1 Niveles de Log

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| **ERROR** | Fallos que requieren acción | DB connection lost, OAuth invalid |
| **WARN** | Degradación, recuperable | Rate limit hit, slow query > 1s |
| **INFO** | Eventos importantes | User login, sync completed, reward redeemed |
| **DEBUG** | Detalles para troubleshooting | Query params, API request/response |
| **TRACE** | Verbosísimo (solo dev) | Function entry/exit, variable values |

### 35.2 Estructura Log Estructurado (JSON)

```json
{
  "timestamp": "2024-11-15T14:30:22.123Z",
  "level": "INFO",
  "service": "sync-classroom",
  "traceId": "abc-123-def",
  "spanId": "span-456",
  "message": "Sync completed for user",
  "context": {
    "userId": 42,
    "courseId": "course-123",
    "newTasks": 5,
    "updatedTasks": 2,
    "deliveriesDetected": 3,
    "tokensAwarded": 47,
    "durationMs": 1234
  }
}
```

### 35.3 Herramientas de Debug

| Herramienta | Comando | Uso |
|-------------|---------|-----|
| **Ver logs tiempo real** | `tail -f logs/app.log | jq` | Follow structured logs |
| **Filtrar por usuario** | `grep "userId\":42" logs/app.log` | Debug usuario específico |
| **Métricas DB** | `sqlite3 capu.db ".stats"` | Tamaño, páginas, cache |
| **Análisis queries lentas** | `grep "durationMs.*[5-9][0-9][0-9][0-9]" logs/app.log` | Queries > 5s |
| **Health check** | `curl -s localhost:3000/health \| jq` | Estado servicios |
| **Test notificación** | `curl -X POST /api/admin/test-push -d '{"userId":42}'` | Debug push |

### 35.4 Modo Debug Temporal

Admin → **Config** → **Debug** → **Activar Modo Debug (30 min)**:
- Log level → DEBUG
- SQL queries loggeadas
- Response times en headers (`X-Response-Time`)
- Stack traces en errores 500
- **Auto-expira en 30 min** (seguridad)

---

# ANEXOS

## Anexo A: Estructura de Base de Datos

### Esquema Principal (SQLite)

```sql
-- Usuarios
CREATE TABLE usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,              -- NULL si solo Google
    google_id TEXT UNIQUE,           -- sub de Google
    google_email TEXT,
    google_access_token TEXT,        -- Encriptado AES-256
    google_refresh_token TEXT,       -- Encriptado AES-256
    google_token_expiry INTEGER,     -- Unix timestamp
    google_conectado INTEGER DEFAULT 0,
    rol TEXT DEFAULT 'student',      -- 'student' | 'admin'
    verificado INTEGER DEFAULT 0,
    onboarding_completado INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    zona_horaria TEXT DEFAULT 'UTC',
    creado_en INTEGER NOT NULL,      -- Unix timestamp
    actualizado_en INTEGER NOT NULL,
    ultimo_login INTEGER
);

-- Cursos (canonical + Classroom mapping)
CREATE TABLE curso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    classroom_id TEXT UNIQUE,        -- ID de Google Classroom
    nombre TEXT NOT NULL,
    seccion TEXT,
    descripcion TEXT,
    profesor_email TEXT,
    estado TEXT DEFAULT 'active',    -- active, archived, error_sync
    canonical_id INTEGER,            -- Self-ref para mapeo
    categoria TEXT,                  -- Ciencias, Letras, etc.
    color TEXT,                      -- Hex color
    ultimo_sync INTEGER,
    creado_en INTEGER NOT NULL
);

-- Tareas
CREATE TABLE tarea (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id),
    curso_id INTEGER REFERENCES curso(id),
    classroom_id TEXT,               -- courseWork ID si Classroom
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_limite INTEGER NOT NULL,   -- Unix timestamp
    estado TEXT DEFAULT 'pendiente', -- pendiente, en_progreso, vencida, entregada
    progreso INTEGER DEFAULT 0,      -- 0-100
    origen TEXT DEFAULT 'personalizada', -- classroom, personalizada
    prioridad TEXT DEFAULT 'media',  -- baja, media, alta
    tokens_otorgados INTEGER DEFAULT 0,
    fecha_entrega INTEGER,           -- Unix timestamp entrega real
    classroom_url TEXT,              -- Link directo Classroom
    creado_en INTEGER NOT NULL,
    actualizado_en INTEGER NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Recordatorios
CREATE TABLE recordatorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id INTEGER NOT NULL REFERENCES tarea(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,              -- '24h', '1h', 'vencida'
    enviado INTEGER DEFAULT 0,
    enviado_en INTEGER,
    creado_en INTEGER NOT NULL
);

-- Transacciones de Tokens
CREATE TABLE transaccion_token (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id),
    tipo TEXT NOT NULL,              -- ganancia, gasto, ajuste, reembolso
    cantidad INTEGER NOT NULL,       -- Positivo o negativo
    saldo_resultado INTEGER NOT NULL,
    motivo TEXT NOT NULL,            -- Descripción legible
    referencia_tipo TEXT,            -- tarea, recompensa, racha, bono, admin
    referencia_id INTEGER,           -- ID de la referencia
    creado_en INTEGER NOT NULL
);

-- Recompensas
CREATE TABLE recompensa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    costo INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    imagen_url TEXT,
    stock INTEGER DEFAULT -1,        -- -1 = ilimitado
    activa INTEGER DEFAULT 1,
    destacada INTEGER DEFAULT 0,
    requisitos_json TEXT,            -- JSON con requisitos
    fecha_inicio INTEGER DEFAULT 0,
    fecha_fin INTEGER DEFAULT 0,
    creado_en INTEGER NOT NULL,
    actualizado_en INTEGER NOT NULL
);

-- Canjes
CREATE TABLE canje (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id),
    recompensa_id INTEGER NOT NULL REFERENCES recompensa(id),
    tokens_gastados INTEGER NOT NULL,
    codigo_canje TEXT UNIQUE,        -- Código para canje físico
    estado TEXT DEFAULT 'pendiente', -- pendiente, entregado, cancelado
    entregado_por INTEGER REFERENCES usuario(id), -- Admin que entregó
    entregado_en INTEGER,
    nota_admin TEXT,
    creado_en INTEGER NOT NULL
);

-- Notificaciones
CREATE TABLE notificacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,              -- entrega, recordatorio, vencida, recompensa, sistema
    titulo TEXT NOT NULL,
    mensaje TEXT,
    leida INTEGER DEFAULT 0,
    leida_en INTEGER,
    datos_json TEXT,                 -- Contexto extra (tarea_id, recompensa_id, etc.)
    creado_en INTEGER NOT NULL
);

-- Auditoría
CREATE TABLE auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES usuario(id),
    admin_email TEXT NOT NULL,
    accion TEXT NOT NULL,
    recurso_tipo TEXT NOT NULL,
    recurso_id TEXT,
    detalles_json TEXT,
    ip TEXT,
    user_agent TEXT,
    resultado TEXT DEFAULT 'success', -- success, error, partial
    duracion_ms INTEGER,
    creado_en INTEGER NOT NULL
);

-- Índices Críticos
CREATE INDEX idx_tarea_usuario_estado ON tarea(usuario_id, estado);
CREATE INDEX idx_tarea_fecha_limite ON tarea(fecha_limite);
CREATE INDEX idx_tarea_classroom ON tarea(classroom_id);
CREATE INDEX idx_transaccion_usuario_fecha ON transaccion_token(usuario_id, creado_en);
CREATE INDEX idx_notificacion_usuario_leida ON notificacion(usuario_id, leida);
CREATE INDEX idx_auditoria_fecha ON auditoria(creado_en);
CREATE INDEX idx_auditoria_admin ON auditoria(admin_id, creado_en);
```

---

## Anexo B: API Endpoints Admin

### Autenticación
```
POST   /api/auth/login              # Login email/password
POST   /api/auth/register           # Registro
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Logout (revoca refresh)
POST   /api/auth/forgot-password    # Solicitar reset
POST   /api/auth/reset-password     # Confirmar reset
GET    /api/auth/verify/:token      # Verificar email
GET    /api/auth/me                 # Perfil actual (JWT required)
```

### Google OAuth
```
GET    /api/auth/google             # Iniciar OAuth (PKCE)
GET    /api/auth/google/callback    # Callback OAuth
POST   /api/auth/google/disconnect  # Desconectar Google
```

### Admin - Usuarios
```
GET    /api/admin/users             # Listar (paginado, filtros)
GET    /api/admin/users/:id         # Detalle completo
PUT    /api/admin/users/:id         # Editar
DELETE /api/admin/users/:id         # Eliminar (hard)
POST   /api/admin/users/:id/block   # Bloquear (soft)
POST   /api/admin/users/:id/unblock # Desbloquear
POST   /api/admin/users/:id/force-logout
POST   /api/admin/users/:id/reset-password
POST   /api/admin/users/:id/disconnect-google
POST   /api/admin/users/:id/recalculate-tokens
GET    /api/admin/users/export      # CSV export
```

### Admin - Cursos
```
GET    /api/admin/courses           # Listar cursos sync
GET    /api/admin/courses/:id       # Detalle curso
POST   /api/admin/courses/:id/sync  # Forzar sync
POST   /api/admin/courses/map       # Mapear cursos
DELETE /api/admin/courses/map/:canonicalId
GET    /api/admin/courses/stats     # Métricas sync
```

### Admin - Tareas
```
GET    /api/admin/tasks             # Listar global (filtros, paginado)
GET    /api/admin/tasks/:id         # Detalle
POST   /api/admin/tasks/bulk        # Acciones masivas
GET    /api/admin/tasks/export      # CSV export
```

### Admin - Recompensas
```
GET    /api/admin/rewards           # Listar
POST   /api/admin/rewards           # Crear
PUT    /api/admin/rewards/:id       # Editar
DELETE /api/admin/rewards/:id       # Eliminar
POST   /api/admin/rewards/:id/stock # Ajustar stock
GET    /api/admin/rewards/categories
POST   /api/admin/rewards/categories
PUT    /api/admin/rewards/categories/:id
DELETE /api/admin/rewards/categories/:id
GET    /api/admin/redemptions       # Historial canjes
PUT    /api/admin/redemptions/:id/deliver
PUT    /api/admin/redemptions/:id/cancel
GET    /api/admin/redemptions/export
```

### Admin - Métricas
```
GET    /api/admin/metrics/dashboard # KPIs + gráficos data
GET    /api/admin/metrics/users     # Métricas usuarios
GET    /api/admin/metrics/gamification
GET    /api/admin/metrics/sync
GET    /api/admin/metrics/rewards
GET    /api/admin/reports/:type     # Reportes programados
```

### Admin - Auditoría
```
GET    /api/admin/audit             # Logs (filtros, paginado)
GET    /api/admin/audit/export      # CSV/JSONL
GET    /api/admin/audit/stats       # Contadores por tipo
```

### Admin - Configuración
```
GET    /api/admin/config            # Todo config
PUT    /api/admin/config            # Actualizar (parcial)
GET    /api/admin/config/gamification
PUT    /api/admin/config/gamification
GET    /api/admin/config/notifications
PUT    /api/admin/config/notifications
POST   /api/admin/maintenance/:job  # Ejecutar job manual
```

### Admin - Seguridad
```
GET    /api/admin/sessions          # Sesiones activas
DELETE /api/admin/sessions/:id      # Revocar sesión
DELETE /api/admin/sessions/user/:userId # Revocar todas usuario
POST   /api/admin/secrets/rotate    # Rotar secreto específico
POST   /api/admin/secrets/rotate-all # Emergencia
GET    /api/admin/backups           # Lista backups
POST   /api/admin/backups/restore   # Restaurar
```

---

## Anexo C: Variables de Entorno

```bash
# ===========================================
# CAPU - Variables de Entorno (.env)
# ===========================================

# --- Servidor ---
NODE_ENV=production                 # development | production | test
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=https://capu.app       # Para CORS, emails, OAuth redirect

# --- Base de Datos ---
DATABASE_PATH=./data/capu.sqlite    # Ruta archivo SQLite
DATABASE_WAL_MODE=true              # Enable WAL para concurrencia
DATABASE_BUSY_TIMEOUT=30000         # ms

# --- JWT ---
JWT_ACCESS_SECRET=                  # 64 chars hex (generar: openssl rand -hex 32)
JWT_REFRESH_SECRET=                 # 64 chars hex (distinto al access)
JWT_ACCESS_EXPIRY=15m               # 15 minutos
JWT_REFRESH_EXPIRY=30d              # 30 días
JWT_ISSUER=capu
JWT_AUDIENCE=capu-users

# --- Encriptación (AES-256-GCM) ---
ENCRYPTION_KEY=                     # 64 chars hex (32 bytes)
ENCRYPTION_IV_LENGTH=12             # 12 bytes para GCM
ENCRYPTION_TAG_LENGTH=16            # 16 bytes tag

# --- Google OAuth 2.0 ---
GOOGLE_CLIENT_ID=                   # De Google Cloud Console
GOOGLE_CLIENT_SECRET=               # De Google Cloud Console
GOOGLE_REDIRECT_URI=https://capu.app/api/auth/google/callback
GOOGLE_SCOPES=openid,email,profile,https://www.googleapis.com/auth/classroom.courses.readonly,https://www.googleapis.com/auth/classroom.coursework.students.readonly,https://www.googleapis.com/auth/classroom.student-submissions.students.readonly

# --- Email (SMTP) ---
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false                   # true para 465, false para 587
SMTP_USER=apikey
SMTP_PASS=                          # API Key SendGrid
EMAIL_FROM="CAPU <noreply@capu.app>"
EMAIL_REPLY_TO=soporte@capu.app

# --- Web Push (VAPID) ---
VAPID_PUBLIC_KEY=                   # Generar: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:soporte@capu.app

# --- Sync Classroom ---
SYNC_INTERVAL_MINUTES=15
SYNC_BATCH_SIZE=50                  # Usuarios por batch
SYNC_MAX_RETRIES=3
SYNC_BACKOFF_BASE_MS=1000
SYNC_RATE_LIMIT_PER_MIN=100         # Requests/min a Google API

# --- Gamificación ---
TOKENS_ENTREGA_BASE=10
TOKENS_ENTREGA_ANTICIPADA=5
TOKENS_RACHA_MAX_DIARIO=5
RACHA_TIMEZONE=UTC
TOKENS_PRIMERA_TAREA_DIA=2
TOKENS_BONO_SEMANAL_5=10
TOKENS_BONO_MENSUAL_20=50

# --- Rate Limiting ---
RATE_LIMIT_WINDOW_MS=900000         # 15 min
RATE_LIMIT_MAX_REQUESTS=100         # Por IP/ventana
RATE_LIMIT_AUTH_MAX=10              # Login/register por IP/15min

# --- Sesiones ---
SESSION_SECRET=                     # 64 chars hex
SESSION_MAX_PER_USER=5
SESSION_INACTIVITY_TIMEOUT=1800000  # 30 min

# --- Logs ---
LOG_LEVEL=info                      # error, warn, info, debug
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10485760               # 10MB
LOG_MAX_FILES=30

# --- Mantenimiento ---
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"         # Cron: 02:00 diario
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=                   # Opcional: bucket S3
BACKUP_S3_PREFIX=capu/backups/

# --- Seguridad ---
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://capu.app
HELMET_CSP_ENABLED=true
RATE_LIMIT_TRUST_PROXY=true

# --- Feature Flags ---
FEATURE_PWA=true
FEATURE_OFFLINE=true
FEATURE_DARK_MODE=true
FEATURE_ANALYTICS=false
```

### Generación de Secretos

```bash
# JWT Secrets (64 hex chars = 32 bytes)
openssl rand -hex 32

# Encryption Key (64 hex chars = 32 bytes)
openssl rand -hex 32

# Session Secret
openssl rand -hex 32

# VAPID Keys (Web Push)
npx web-push generate-vapid-keys
# Output:
# Public Key:  BEl62iU...
# Private Key: 7c5Q...
```

---

## Anexo D: Checklist Despliegue Producción

### Pre-Despliegue

- [ ] **Código**: Rama `main` limpia, tests pasando (37/37)
- [ ] **Variables**: `.env.production` completo y seguro
- [ ] **Secretos**: Generados nuevos (JWT, ENCRYPTION, VAPID, SESSION)
- [ ] **Google Cloud**: OAuth consent screen configurado, scopes aprobados
- [ ] **Dominio**: DNS apuntando, certificado SSL válido (Let's Encrypt / Cloudflare)
- [ ] **Email**: SMTP probado (test email enviado)
- [ ] **Push**: VAPID keys en frontend (`VAPID_PUBLIC_KEY` en `app.js`)
- [ ] **BD**: Migraciones aplicadas (`onboarding_completado` column)
- [ ] **Backup**: Script de backup probado, restauración testeada

### Despliegue

- [ ] **Build Frontend**: `npm run build` (minifica, hashea assets)
- [ ] **Docker/PM2**: Proceso manager configurado con restart auto
- [ ] **Reverse Proxy**: Nginx/Cloudflare con headers seguridad
- [ ] **Health Check**: `/health` responde 200 con JSON status
- [ ] **Logs**: Rotación configurada (logrotate / PM2 logs)
- [ ] **Monitoreo**: Uptime check (Pingdom, UptimeRobot, etc.)

### Post-Despliegue (Smoke Tests)

- [ ] **Registro**: Nuevo usuario email + Google
- [ ] **Verificación**: Email llega, link funciona
- [ ] **Login**: Ambos métodos, JWT + refresh cookies
- [ ] **Classroom**: Conectar, sync, tareas aparecen
- [ ] **Tareas**: Crear personalizada, completar, tokens
- [ ] **Tokens**: Saldo, racha, historial correctos
- [ ] **Recompensas**: Ver, canjear, código generado
- [ ] **Notificaciones**: Push permiso, test recibida
- [ ] **Admin**: Panel accesible, métricas cargan
- [ ] **PWA**: Instalable, offline funciona
- [ ] **Tema**: Claro/oscuro persiste

### Go-Live

- [ ] **DNS Cutover**: Tráfico a nueva instancia
- [ ] **Monitoreo 1h**: Logs, errores, métricas
- [ ] **Comunicación**: Usuarios notificados (email, banner)
- [ ] **Rollback Plan**: Documentado y probado (< 10 min)

---

**Fin del Manual de Administrador**

*Documento generado automáticamente - Versión 1.0 - Noviembre 2026*
*CAPU - Agenda Inteligente con Gamificación*
*https://github.com/VictorMBojorquez/Capu*