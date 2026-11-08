# CAPU Project - Complete Implementation Summary

## Project Overview
**CAPU** - Agenda Inteligente con gamificación integrada a Google Classroom
- **Repo**: https://github.com/l23211974-maker/Capu1
- **Local Server**: http://localhost:3002
- **Tests**: 37/37 passing
- **Status**: ✅ Complete - All phases implemented

---

## Phases Implemented

### Phase 1: Login as Primary Page ✅
- Login page is the default route (`#login`)
- Unauthenticated users see only Login/Register in header/sidebar
- After login → Agenda (students) or Admin-Usuarios (admins)
- JWT validation on app init and visibility change

### Phase 3: Calendar View ✅
- Monthly calendar grid (`#calendario`)
- Click day → show tasks modal
- Navigation: prev/next month, today button
- Backend: `GET /api/tareas/calendario?mes=YYYY-MM`

### Phase 4: Notification Center ✅
- Page: `#notificaciones`
- Tabs: All, Unread, Entregas, Recordatorios
- Mark as read / Mark all as read
- Bell icon in header with badge count
- Backend: `GET /api/notificaciones`, `PATCH /leer`, `POST /leer-todas`

### Phase 5: Admin Task Management ✅
- Page: `#admin-tareas`
- Table with filters (user, course, state, date range)
- Pagination, Create/Edit/Delete modals
- Backend: CRUD `/api/admin/tareas`

### Phase 6: Admin Audit/Logs ✅
- Page: `#admin-auditoria`
- Expandable rows with JSON detail modal
- Filters: user, action, entity, date range
- CSV Export button
- Backend: `GET /api/admin/auditoria`, actions, entities

### Phase 7: Data Export ✅
- Admin endpoint: `GET /api/admin/exportar?tipo=X&formato=Y`
- Types: usuarios, cursos, tareas, recompensas, tokens, auditoria
- Formats: CSV, JSON
- Streaming for large exports

### Phase 8: Onboarding Tour ✅
- 7-step guided tour for new users
- Steps: Welcome → Agenda → Tokens → Profile → Calendar → Notifications → Google Sync
- Skip option, persists to DB (`onboarding_completado` column)
- Shepherd-style tooltips

### Phase 9: PWA/Offline Support ✅
- `manifest.json` - CAPU branding, icons, shortcuts (Agenda, Calendario)
- `sw.js` - Service Worker:
  - Cache-first: static assets (HTML, CSS, JS, manifest)
  - Stale-while-revalidate: API endpoints
  - Background sync for offline actions
  - Push notification handling
- Offline indicator (bottom center)
- Online/offline toast notifications

### Phase 12: Email Notifications Service ✅
- **Email Service** (`backend/src/services/email.js`):
  - Nodemailer with SMTP config
  - Templates: Welcome, Verification, Reset Password, Reminders (24h/1h), Weekly Digest
  - Graceful fallback (logs only when SMTP not configured)
- **Auth Integration**:
  - Registration → sends verification + welcome email
  - Password reset request → sends reset email
- **Background Jobs**:
  - Task reminders: every 15 min (checks 24h/1h before deadline)
  - Weekly digest: Monday 9 AM
  - Disabled during tests (`CAPU_FIXED_NOW`)
- **Admin Test Endpoint**: `POST /api/admin/email/test`
- **Config** (env.js): SMTP_HOST, PORT, SECURE, USER, PASS, FROM, APP_URL

---

## Key Fixes Applied

### Backend Authentication (Critical)
- All protected routes use `authMiddleware(db)` + `req.user.id_usuario`
- Fixed hardcoded `userId = 1` in all routes
- Admin middleware rewritten to use JWT
- Google OAuth callback creates new users properly

### Frontend Navigation
- Removed duplicate `initApp` calls breaking hash routing
- Added `.offline-indicator[hidden]` CSS rule
- Login/Register/Forgot/Reset password navigation works correctly

### Tests
- Tests register/login test user at startup
- JWT token stored and included in Authorization header
- Background jobs disabled during tests
- All 37 tests pass consistently

---

## Architecture

### Backend (Express + SQLite)
```
backend/
├── src/
│   ├── app.js              # Express app, all routes
│   ├── server.js           # Entry point, auto-sync
│   ├── config/env.js       # Centralized config
│   ├── services/
│   │   ├── auth.js         # Email/password auth
│   │   ├── email.js        # Email service (Phase 12)
│   │   ├── admin.js        # Admin panel logic
│   │   ├── notificaciones.js
│   │   ├── tareas.js       # Tasks + calendar
│   │   ├── tokens.js       # Tokens + rewards
│   │   ├── reminders.js    # Reminders + alerts
│   │   ├── sync.js         # Google Classroom sync
│   │   ├── oauth.js        # Google OAuth PKCE
│   │   ├── jwt.js          # JWT middleware
│   │   └── usuario.js      # Profile + preferences
│   ├── db.js               # SQLite connection
│   └── seed.js             # Demo data
```

### Frontend (SPA - Hash Routing)
```
frontend/
├── index.html              # All pages as hidden sections
├── app.js                  # 4120+ lines, modular architecture
├── styles.css              # Design system (CSS variables, orange #C4571A)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
```

### Database Schema (SQLite)
```sql
usuario              -- users (auth_provider: google/email/both)
curso                -- Google Classroom courses
tarea                -- tasks (classroom + custom)
recordatorio         -- scheduled reminders
transaccion_token    -- token history
recompensa/canje     -- rewards system
notificacion         -- notification center (Phase 4)
auditoria            -- audit logs (Phase 6)
```

---

## API Endpoints

### Auth (Public - Rate Limited)
- `POST /api/auth/registro` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/verificar-email?token=` - Verify email
- `POST /api/auth/olvide-password` - Request reset
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/google/iniciar` - OAuth start
- `GET /api/auth/google/callback` - OAuth callback

### Auth (Protected)
- `PATCH /api/auth/cambiar-password` - Change password
- `GET /api/auth/google/estado` - Google connection status
- `DELETE /api/auth/google` - Disconnect Google

### User Profile (Protected)
- `GET/PATCH /api/usuario/perfil`
- `GET/PATCH /api/usuario/preferencias`
- `DELETE /api/usuario/google`
- `DELETE /api/usuario/cuenta`

### Sync (Protected)
- `POST /api/sync` - Sync with Google Classroom

### Tasks (Protected)
- `GET /api/tareas` - List with filters
- `GET /api/tareas/calendario?mes=YYYY-MM`
- `GET /api/tareas/:id`
- `PATCH /api/tareas/:id` - Update progress
- `POST /api/tareas/:id/completar` - Complete (earn tokens)
- Custom tasks: `/api/tareas/custom` (CRUD)

### Reminders/Alerts (Protected)
- `GET /api/recordatorios/pendientes`
- `POST /api/recordatorios/procesar`
- `GET /api/alertas`

### Notifications (Protected)
- `GET /api/notificaciones` - List with pagination
- `PATCH /api/notificaciones/:id/leer`
- `POST /api/notificaciones/leer-todas`

### Tokens/Rewards (Protected)
- `GET /api/tokens` - Balance + history
- `GET /api/recompensas` - Active rewards
- `POST /api/recompensas/:id/canjear` - Redeem

### Metrics (Protected)
- `GET /api/metricas` - User dashboard metrics

### Admin (Protected - Admin Role)
- Users: `GET /api/admin/usuarios`, `PATCH /:id/rol`
- Courses: `GET /api/admin/cursos`
- Rewards: CRUD `/api/admin/recompensas`
- Metrics: `GET /api/admin/metricas`
- OAuth Config: `GET/POST /api/admin/oauth`, `POST /test`
- Tasks: CRUD `/api/admin/tareas` with filters
- Audit: `GET /api/admin/auditoria`, actions, entities
- Export: `GET /api/admin/exportar?tipo=X&formato=Y`
- **Email Test**: `POST /api/admin/email/test`

---

## Design System
- **Primary**: #C4571A (orange)
- **Secondary**: #E87A2A
- **CSS Variables**: colors, spacing, typography, shadows, radius
- **Dark Mode**: `@media (prefers-color-scheme: dark)`
- **Components**: btn, card, form, modal, toast, table, badge, avatar

---

## Running the Project

```bash
# Install dependencies
npm install

# Start server (port 3002)
PORT=3002 npm start

# Run tests
npm test

# Seed database
npm run seed
```

### Environment Variables (.env)
```env
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3003
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Email (Phase 12)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CAPU <noreply@capu.local>"
APP_URL=http://localhost:3003

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3003/api/auth/google/callback

# Auto-sync (optional)
CAPU_SYNC_MINUTOS=15
```

---

## Git History (Latest Commits)

| Commit | Message | Files |
|--------|---------|-------|
| d89fb88 | chore: Add database migration scripts | 6 migration files |
| 76cb355 | chore: Update dependencies and tests | package.json, package-lock.json, tests/api.test.js |
| 05f5e0f | feat: Phase 9 - PWA/Offline Support | manifest.json, sw.js, index.html |
| d11ef07 | feat: Backend services - Admin, Notifications, Tasks, JWT | 5 service files + schema.sql |
| 6e84eb3 | fix: Frontend - Fix navigation and offline indicator | app.js, styles.css |
| 3d7bd93 | feat: Phase 12 - Email Notifications Service | email.js, env.js, auth.js, app.js |

---

## Test Results
```
✔ 37 tests passed
✔ 0 failed
✔ Duration: ~3s
```

---

## Notes for Future Development

1. **Email in Production**: Configure real SMTP credentials in `.env`
2. **Google OAuth**: Add credentials to enable Classroom sync
3. **Auto-sync**: Set `CAPU_SYNC_MINUTOS` to enable background sync
4. **HTTPS**: Required for PWA install and push notifications
5. **Database**: Consider PostgreSQL for production scale
6. **Monitoring**: Add logging/metrics for production

---

*Last updated: 2026-11-07*
*All phases complete - Application fully functional*