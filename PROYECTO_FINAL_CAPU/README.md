# CAPU — Entrega Final del Proyecto

**Proyecto:** CAPU — Agenda inteligente con recordatorios y recompensas (tokens), integrada a Google Classroom.

**Integrantes del equipo:**

| Integrante | Matrícula | Rol |
|---|---|---|
| Aldo Juventino Ballesteros Cruz | 23211920 | Líder de proyecto / Promotor |
| Victor Manuel Bojorquez Valdez | 23211926 | Desarrollador de integraciones (backend/API) |
| Luis Adao Leonel Duran Ponce | 23211951 | Responsable de gamificación / producto |
| Maximiliano Alberto Grande Ortega | 23211974 | Diseñador UX/UI y accesibilidad |
| Jorge Luis Lopez Molgado | 23212002 | Responsable de seguridad y privacidad |

**Tecnologías:**

- Lenguajes: JavaScript (Node.js 22.5+), HTML, CSS, SQL (SQLite).
- Servidor: Express 4 · Base de datos: SQLite (módulo `node:sqlite`) en desarrollo.
- Interfaz: HTML, CSS y JavaScript sin dependencias (aplicación web adaptable / PWA).
- Pruebas: ejecutor nativo de Node (`node --test`).
- Integración: Google Classroom API (OAuth 2.0 + PKCE, adaptador real y mock).

**Instrucciones de instalación:**

```bash
git clone https://github.com/VictorMBojorquez/Capu.git
cd capu
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start
```

**Instrucciones para ejecutar el sistema:**

1. Sin credenciales de Google: la aplicación usa el **adaptador mock** (datos de demostración).
2. Con credenciales Google: configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`
   (ver `docs/guia-conexion-classroom.md`).
3. `npm start` → http://localhost:3000 → botón **Sincronizar con Classroom**.

**Credenciales de prueba, cuando sean necesarias:**

- Usuario demo: `demo@capu.local` (adaptador mock).
- No se requieren credenciales reales para el modo demostración.

**Liga al repositorio actualizado:**

- Repositorio: https://github.com/VictorMBojorquez/Capu
- Rama: `main`

---

## Estructura de la entrega digital

```
PROYECTO_FINAL_CAPU/
├── 01_Codigo_Fuente/      # Código fuente completo y actualizado
├── 02_Sistema_Ejecutable/ # Sistema en ejecución (backend + frontend + BD)
├── 03_Base_de_Datos/      # Esquema de base de datos
├── 04_Documentacion/      # Documentación (README del proyecto)
├── 05_Manual_de_Usuario/  # Manual de usuario
├── 06_Evidencias/          # Evidencias de la entrega
├── 07_Pruebas/             # Pruebas automatizadas
├── 08_Capturas_de_Pantalla/ # Capturas del sistema
└── README.md               # Este documento
```

## Resumen de la entrega

| Evidencia | Documento |
|---|---|
| Bitácora de supervisión y pruebas | `06_Evidencias/Bitacora_Supervision_Pruebas_CAPU.md` |
| Seguimiento y control del proyecto | `06_Evidencias/Seguimiento_Control_CAPU.md` |
| Bitácora individual de participación | `06_Evidencias/Bitacora_Participacion_CAPU.md` |
| Pruebas | `07_Pruebas/tests/` (resultado: **41/41 en verde**) |
| Manual de usuario | `05_Manual_de_Usuario/MANUAL_USUARIO.md` |
| Capturas | `08_Capturas_de_Pantalla/capturas/` |

## Fecha de entrega final

**26 de noviembre de 2026**
