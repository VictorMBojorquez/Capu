# Guía: conectar CAPU con Google Classroom de verdad (OAuth 2.0)

Esta guía hace que `npm start` use la **API real** de Google Classroom con la cuenta
del estudiante. Solo se necesita crear las credenciales una vez (≈ 10 minutos).

## 1. Crear el proyecto y las credenciales en Google Cloud

1. Entra a <https://console.cloud.google.com> con tu cuenta @tectijuana.edu.mx (o Gmail).
2. Crea un proyecto nuevo (ej. `CAPU Agenda`).
3. Menú **APIs y servicios → Biblioteca** → busca **Google Classroom API** → **Habilitar**.
4. Menú **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo** (o interno si la cuenta es institucional y lo permite).
   - Rellena nombre de la app, correo de soporte y alcance de contacto.
   - En **Alcances (Scopes)**, agrega los del archivo `backend/src/services/oauth.js`
     (lectura de Classroom + `openid email profile`).
   - En **Usuarios de prueba**, agrega tu propio correo.
5. Menú **Credenciales → Crear credenciales → ID de cliente OAuth**:
   - Tipo: **Aplicación web**.
   - **URI de redirección autorizada:** `http://localhost:3000/api/auth/google/callback`
   - Copia el **ID de cliente** y el **Secreto**.

## 2. Configurar y arrancar CAPU

```bash
cp .env.example .env            # Windows: copy .env.example .env
# edita .env y pega tu GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
npm install
npm start                       # http://localhost:3000
```

`backend/src/server.js` carga el archivo `.env` automáticamente (también acepta las
variables exportadas en el entorno). Sin `.env`, el modo demostración sigue funcionando.

## 3. Conectar la cuenta

1. Abre <http://localhost:3000>: verás el botón **Conectar con Google**.
2. Autoriza y volverás automáticamente; tu nombre y correo reales quedarán registrados.
3. Pulsa **Sincronizar con Classroom** (o espera al `CAPU_SYNC_MINUTOS`): traerá tus
   cursos y tareas reales.
4. **Verifica en cartelera:** ahora verás las alertas ⏰ (vencen ≤ 24 h) y ⛔ (vencidas)
   generadas de tus asignaturas reales.

## 4. Datos que sincroniza (solo lectura)

| Fuente | Qué usa |
|---|---|
| `courses` | cursos activos en los que estás inscrito |
| `courseWork` | tareas con fecha de vencimiento (`dueDate` + `dueTime`) |
| `studentSubmissions` | estado de entrega (`TURNED_IN`/`RETURNED` = entregada) |

Toda colección se pagina (`pageToken`), así se sincronizan cursos y tareas antiguas completos.

## 5. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `redirect_uri_mismatch` | La URI de redirección en Google Cloud no es exactamente `http://localhost:3000/api/auth/google/callback` |
| `403 access denied` a Classroom | Permítele a tu dominio institucional ese API, o agrega tu cuenta como usuario de prueba y usa la cuenta de prueba |
| `invalid_client` | ID o secreto mal copiados en `.env` |
| `Google Classroom respondió 403` en sync | El scope no fue autorizado (vuelve a conectar) o la API no está habilitada |
| Botón no aparece | Falta `.env` con credenciales (el modo demo no lo muestra) |

## 6. Notas técnicas

- Flujo: *Authorization Code* **con PKCE (S256)** + `access_type=offline`.
- Tokens guardados en la tabla `credencial_google` (SQLite), con renovación automática.
- al desconectar (`DELETE /api/auth/google`) se **revoca** el token ante Google.
- La conexión solo lee datos; escribir en Classroom está fuera del alcance del proyecto.
