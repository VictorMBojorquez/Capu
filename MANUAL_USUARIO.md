# Manual de Usuario - CAPU

## Agenda Inteligente con Gamificación y Google Classroom

---

**Versión:** 1.0  
**Fecha:** Noviembre 2026  
**Proyecto:** CAPU - Agenda Inteligente  

---

## Índice General

### Parte I: Introducción y Primeros Pasos
1. [¿Qué es CAPU?](#1-qué-es-capu) - pág. 3
2. [Requisitos del Sistema](#2-requisitos-del-sistema) - pág. 4
3. [Acceso y Registro](#3-acceso-y-registro) - pág. 5
4. [Verificación de Cuenta](#4-verificación-de-cuenta) - pág. 7
5. [Primer Inicio de Sesión](#5-primer-inicio-de-sesión) - pág. 8

### Parte II: Navegación y Interfaz
6. [Visión General de la Interfaz](#6-visión-general-de-la-interfaz) - pág. 9
7. [Barra de Navegación Inferior](#7-barra-de-navegación-inferior) - pág. 10
8. [Menú de Usuario](#8-menú-de-usuario) - pág. 11
9. [Temas: Claro y Oscuro](#9-temas-claro-y-oscuro) - pág. 12
10. [Accesibilidad](#10-accesibilidad) - pág. 13

### Parte III: Funcionalidades Principales
11. [Agenda - Vista Principal](#11-agenda---vista-principal) - pág. 14
12. [Gestión de Tareas](#12-gestión-de-tareas) - pág. 16
13. [Calendario](#13-calendario) - pág. 20
14. [Centro de Notificaciones](#14-centro-de-notificaciones) - pág. 23
15. [Sistema de Tokens y Gamificación](#15-sistema-de-tokens-y-gamificación) - pág. 25
16. [Recompensas y Canje](#16-recompensas-y-canje) - pág. 28
17. [Resumen y Analíticas](#17-resumen-y-analíticas) - pág. 30
18. [Perfil y Configuración](#18-perfil-y-configuración) - pág. 32

### Parte IV: Integración con Google Classroom
19. [Conexión con Google Classroom](#19-conexión-con-google-classroom) - pág. 35
20. [Sincronización de Cursos y Tareas](#20-sincronización-de-cursos-y-tareas) - pág. 37
21. [Entregas desde Classroom](#21-entregas-desde-classroom) - pág. 39

### Parte V: Funcionalidades Avanzadas
22. [Modo Offline (PWA)](#22-modo-offline-pwa) - pág. 41
23. [Recordatorios y Alertas](#23-recordatorios-y-alertas) - pág. 42
24. [Tareas Personalizadas](#24-tareas-personalizadas) - pág. 44

### Parte VI: Solución de Problemas
25. [Preguntas Frecuentes (FAQ)](#25-preguntas-frecuentes-faq) - pág. 46
26. [Problemas Comunes y Soluciones](#26-problemas-comunes-y-soluciones) - pág. 48
27. [Contacto y Soporte](#27-contacto-y-soporte) - pág. 50

### Anexos
- [Anexo A: Glosario de Términos](#anexo-a-glosario-de-términos) - pág. 51
- [Anexo B: Atajos de Teclado](#anexo-b-atajos-de-teclado) - pág. 53
- [Anexo C: Política de Privacidad](#anexo-c-política-de-privacidad) - pág. 54

---

# PARTE I: INTRODUCCIÓN Y PRIMEROS PASOS

## 1. ¿Qué es CAPU?

![Logo CAPU](images/logo-capu.png)
*Figura 1.1: Logotipo oficial de CAPU*

**CAPU** (Calendario y Agenda para la Productividad Universitaria) es una aplicación web progresiva (PWA) diseñada específicamente para estudiantes que necesitan gestionar sus tareas académicas de manera eficiente, divertida y motivadora.

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| 📅 **Agenda Inteligente** | Vista unificada de todas tus tareas con filtros avanzados |
| 🗓️ **Calendario Interactivo** | Vista mensual/semanal con navegación intuitiva |
| 🔔 **Centro de Notificaciones** | Alertas de entregas, recordatorios y tareas vencidas |
| 🎮 **Gamificación** | Sistema de tokens, rachas diarias y recompensas |
| 🏫 **Google Classroom** | Sincronización automática bidireccional |
| 📊 **Analíticas Personales** | Métricas de productividad y progreso |
| 🌙 **Tema Oscuro/Claro** | Adaptación automática o manual |
| 📱 **PWA/Offline** | Funciona sin conexión, instalable como app |

### ¿Para quién está diseñado?

- **Estudiantes universitarios** que usan Google Classroom
- **Estudiantes de bachillerato** con carga académica alta
- **Cualquier persona** que necesite gestión de tareas con motivación extra

### Filosofía de Diseño

CAPU nace de la necesidad de transformar la gestión de tareas académicas de una obligación tediosa a una experiencia motivadora. La gamificación (tokens, rachas, recompensas) está basada en principios de **psicología conductual** y **diseño de juegos** para fomentar hábitos de estudio consistentes.

![Filosofía CAPU](images/filosofia-capu.png)
*Figura 1.2: Ciclo de motivación CAPU - Tarea → Entrega → Token → Recompensa → Motivación*

---

## 2. Requisitos del Sistema

### Navegadores Soportados

| Navegador | Versión Mínima | Soporte Completo |
|-----------|----------------|------------------|
| ![Chrome](images/chrome-icon.png) Chrome | 90+ | ✅ Completo |
| ![Firefox](images/firefox-icon.png) Firefox | 88+ | ✅ Completo |
| ![Edge](images/edge-icon.png) Edge | 90+ | ✅ Completo |
| ![Safari](images/safari-icon.png) Safari | 15+ | ✅ Completo |
| ![Opera](images/opera-icon.png) Opera | 76+ | ✅ Completo |

### Requisitos Mínimos

- **Conexión a Internet** (para sincronización inicial y Google Classroom)
- **JavaScript habilitado** (obligatorio)
- **Cookies y LocalStorage** habilitados
- **Resolución mínima**: 320px ancho (móvil) / 1024px ancho (escritorio)

### Para Funcionalidades Avanzadas

| Funcionalidad | Requisito Adicional |
|---------------|---------------------|
| Notificaciones Push | Permisos de notificación en navegador |
| Modo Offline | Navegador con Service Worker support |
| Google Classroom | Cuenta Google con acceso a Classroom |
| Instalación PWA | Chrome/Edge/Firefox en Android/Windows |

### Dispositivos Probados

![Dispositivos](images/dispositivos-soportados.png)
*Figura 2.1: CAPU funcionando en móvil, tablet y escritorio*

- ✅ **Móvil**: Android 10+, iOS 15+ (Chrome, Safari, Firefox)
- ✅ **Tablet**: iPadOS 15+, Android 10+
- ✅ **Escritorio**: Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+)

---

## 3. Acceso y Registro

### 3.1 Página de Inicio

Al acceder a CAPU (https://capu.app o tu instancia local), verás la página de bienvenida:

![Página Inicio](images/pagina-inicio.png)
*Figura 3.1: Página de inicio de CAPU - Opciones de acceso*

### 3.2 Registro con Email y Contraseña

**Paso a paso:**

1. Haz clic en **"Registrarse"** en la esquina superior derecha o en el botón principal
2. Completa el formulario:

![Formulario Registro](images/formulario-registro.png)
*Figura 3.2: Formulario de registro con validaciones en tiempo real*

| Campo | Requisitos | Validación |
|-------|------------|------------|
| **Nombre** | 2-50 caracteres | Solo letras, espacios, acentos |
| **Email** | Formato válido | Verificación de dominio |
| **Contraseña** | Mínimo 8 caracteres | Mayúscula, minúscula, número, símbolo |
| **Confirmar** | Debe coincidir | Comparación en tiempo real |
| **Términos** | Obligatorio | Checkbox requerido |

3. Haz clic en **"Crear cuenta"**
4. **¡Importante!** Revisa tu email para verificar la cuenta

### 3.3 Registro con Google (OAuth 2.0)

**Ventajas:**
- Un clic para registrarse
- No necesitas recordar contraseña
- Sincronización Classroom automática

**Proceso:**

1. Haz clic en **"Continuar con Google"**
2. Selecciona tu cuenta Google
3. Autoriza los permisos solicitados:
   - ✅ Ver tu dirección de email
   - ✅ Ver tu perfil básico
   - ✅ **Google Classroom** (cursos, tareas, entregas)
   - ✅ Acceso offline (refresh token)

![OAuth Google](images/oauth-google.png)
*Figura 3.3: Pantalla de consentimiento OAuth de Google*

### 3.4 Validaciones y Mensajes de Error

El sistema valida en tiempo real:

![Validaciones](images/validaciones-registro.png)
*Figura 3.4: Ejemplos de validaciones en el formulario*

| Error | Causa | Solución |
|-------|-------|----------|
| "Email ya registrado" | Cuenta existe | Usa "Iniciar sesión" o "Olvidé contraseña" |
| "Contraseña débil" | No cumple requisitos | Añade mayúscula, número, símbolo |
| "Emails no coinciden" | Confirmación distinta | Copia y pega la contraseña |
| "Debes aceptar términos" | Checkbox sin marcar | Lee y acepta los términos |

---

## 4. Verificación de Cuenta

### 4.1 Proceso de Verificación

Tras el registro con email, recibirás un correo:

![Email Verificación](images/email-verificacion.png)
*Figura 4.1: Email de verificación de cuenta*

**Contenido del email:**
- Enlace único de verificación (válido 24 horas)
- Tu nombre de usuario
- Instrucciones si no solicitaste la cuenta

### 4.2 Verificar tu Cuenta

1. Abre el email en tu bandeja de entrada (revisa Spam)
2. Haz clic en **"Verificar mi cuenta"**
3. Serás redirigido a CAPU con confirmación:

![Verificación Exitosa](images/verificacion-exitosa.png)
*Figura 4.2: Pantalla de confirmación de verificación*

### 4.3 Reenvío de Verificación

Si no recibiste el email:

1. Inicia sesión (aunque no esté verificada)
2. Verás un banner: *"Tu cuenta no está verificada"*
3. Haz clic en **"Reenviar email"**

![Reenvío Verificación](images/banner-verificacion.png)
*Figura 4.3: Banner para reenviar email de verificación*

### 4.4 ¿Por qué verificar?

| Beneficio | Descripción |
|-----------|-------------|
| **Seguridad** | Confirma que eres el propietario del email |
| **Recuperación** | Permite reset de contraseña seguro |
| **Notificaciones** | Recibirás alertas por email si lo configuras |
| **Confianza** | Cuenta verificada = datos más seguros |

---

## 5. Primer Inicio de Sesión

### 5.1 Pantalla de Login

![Pantalla Login](images/pantalla-login.png)
*Figura 5.1: Formulario de inicio de sesión*

### 5.2 Opciones de Acceso

| Método | Cuándo Usar |
|--------|-------------|
| **Email + Contraseña** | Registro tradicional |
| **Google** | Si te registraste con Google |
| **Olvidé Contraseña** | No recuerdas tu contraseña |

### 5.3 "Olvidé mi Contraseña"

1. Haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu email registrado
2. Recibirás un email con enlace de restablecimiento (válido 1 hora)
3. Crea nueva contraseña (mínimo 8 caracteres)

![Reset Password](images/reset-password.png)
*Figura 5.2: Flujo de restablecimiento de contraseña*

### 5.4 Primer Acceso - Onboarding

Al entrar por primera vez, CAPU te guiará:

![Onboarding Paso 1](images/onboarding-1.png)
*Figura 5.3: Paso 1 - Bienvenida y resumen*

![Onboarding Paso 2](images/onboarding-2.png)
*Figura 5.4: Paso 2 - Conectar Google Classroom*

![Onboarding Paso 3](images/onboarding-3.png)
*Figura 5.5: Paso 3 - Configurar notificaciones*

![Onboarding Paso 4](images/onboarding-4.png)
*Figura 5.6: Paso 4 - ¡Listo para empezar!*

**Puedes saltar el onboarding** y configurar después desde Perfil.

---

# PARTE II: NAVEGACIÓN E INTERFAZ

## 6. Visión General de la Interfaz

### 6.1 Layout Principal (Escritorio)

![Layout Escritorio](images/layout-escritorio.png)
*Figura 6.1: Estructura de la interfaz en escritorio*

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Barra Superior)                                    │
│  ┌─────────┐                    ┌────────────────────────┐  │
│  │ Logo    │                    │ Usuario │ Tema │ Notif │  │
│  │ CAPU    │                    │ Menu    │    │  Bell   │  │
│  └─────────┘                    └────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    CONTENIDO PRINCIPAL                      │
│              (Página activa: Agenda/Calendario/             │
│               Notificaciones/Tokens/Resumen/Perfil)         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  BOTTOM NAV (Navegación Inferior - Móvil/Tablet)           │
│  [Agenda] [Calendario] [Notif.] [Tokens] [Resumen] [Perfil]│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Layout Móvil

![Layout Móvil](images/layout-movil.png)
*Figura 6.2: Interfaz adaptada a móvil - Navegación inferior siempre visible*

### 6.3 Elementos Comunes

| Elemento | Ubicación | Función |
|----------|-----------|---------|
| **Logo CAPU** | Header izquierda | Ir a Agenda (inicio) |
| **Avatar Usuario** | Header derecha | Abrir menú de usuario |
| **Campana Notificaciones** | Header derecha | Ver contador, ir a Notificaciones |
| **Toggle Tema** | Header centro-derecha | Alternar Claro/Oscuro |
| **Bottom Nav** | Inferior (móvil) | Navegación principal 6 secciones |

---

## 7. Barra de Navegación Inferior

La **Bottom Nav** es la navegación principal en móvil y está siempre accesible:

![Bottom Nav](images/bottom-nav.png)
*Figura 7.1: Barra de navegación inferior - 6 secciones*

### 7.1 Secciones Disponibles

| Ícono | Sección | Descripción | Atajo |
|-------|---------|-------------|-------|
| 📋 | **Agenda** | Vista principal de tareas | `Alt + 1` |
| 🗓️ | **Calendario** | Vista mensual/semanal | `Alt + 2` |
| 🔔 | **Notificaciones** | Centro de alertas | `Alt + 3` |
| 🪙 | **Tokens** | Gamificación y recompensas | `Alt + 4` |
| 📊 | **Resumen** | Analíticas y métricas | `Alt + 5` |
| 👤 | **Perfil** | Configuración y cuenta | `Alt + 6` |

### 7.2 Estados Visuales

![Estados Bottom Nav](images/bottom-nav-estados.png)
*Figura 7.2: Estados - Activo (naranja), Inactivo (gris), Badge notificaciones*

- **Activo**: Color naranja (#C4571A), ícono relleno
- **Inactivo**: Gris medio, ícono contorno
- **Badge rojo**: Número de notificaciones no leídas

### 7.3 Navegación por Teclado

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre elementos |
| `Enter` / `Espacio` | Activar enlace |
| `Alt + 1-6` | Acceso directo a sección |
| `Escape` | Cerrar modales/menús |

---

## 8. Menú de Usuario

El menú de usuario (avatar en header) centraliza todas las acciones de cuenta:

![Menu Usuario](images/menu-usuario.png)
*Figura 8.1: Menú desplegable de usuario*

### 8.1 Opciones del Menú

| Opción | Acción | Disponible |
|--------|--------|------------|
| **Perfil** | Ir a página de perfil | Siempre |
| **Conectar Google** | Iniciar OAuth Classroom | Si no conectado |
| **Sincronizar ahora** | Forzar sync manual | Si Google conectado |
| **Desconectar Google** | Revocar acceso Classroom | Si conectado |
| **Cerrar sesión** | Logout seguro | Siempre |

### 8.2 Header del Menú

El header del menú muestra info rápida:

![Menu Header](images/menu-header.png)
*Figura 8.3: Header del menú con avatar, nombre, email, saldo tokens y racha*

```
┌─────────────────────────────────────┐
│  👤  Juan Pérez                     │
│     juan@universidad.edu            │
│  ┌─────────┐  ┌─────────┐          │
│  │ 247 🪙  │  │ 🔥 12   │          │
│  │ Tokens  │  │ Racha   │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
```

---

## 9. Temas: Claro y Oscuro

CAPU soporta temas completos con persistencia:

![Tema Claro](images/tema-claro.png)
*Figura 9.1: Tema claro (predeterminado sistema)*

![Tema Oscuro](images/tema-oscuro.png)
*Figura 9.2: Tema oscuro*

### 9.1 Cambiar Tema

1. Haz clic en el **ícono sol/luna** en el header
2. El cambio es **instantáneo**
3. Se guarda en `localStorage` (persiste entre sesiones)

### 9.2 Detección Automática

Al primer acceso, CAPU detecta tu preferencia del sistema:

```javascript
// Lógica interna
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### 9.3 Paleta de Colores

| Elemento | Tema Claro | Tema Oscuro |
|----------|------------|-------------|
| **Fondo Principal** | `#FAFAFA` | `#1A1A1A` |
| **Superficie/Tarjetas** | `#FFFFFF` | `#242424` |
| **Texto Principal** | `#1A1A1A` | `#FAFAFA` |
| **Texto Secundario** | `#666666` | `#AAAAAA` |
| **Primario (CAPU)** | `#C4571A` | `#E87A2A` |
| **Primario Hover** | `#A04615` | `#D0681E` |
| **Bordes** | `#E0E0E0` | `#333333` |
| **Éxito** | `#2E7D32` | `#4CAF50` |
| **Advertencia** | `#F57F17` | `#FFB300` |
| **Error** | `#C62828` | `#EF5350` |

### 9.4 Accesibilidad de Contraste

Todos los colores cumplen **WCAG 2.1 AA**:

![Contraste](images/contraste-wcag.png)
*Figura 9.4: Verificación de contraste WCAG 2.1 AA*

| Combinación | Ratio | Nivel |
|-------------|-------|-------|
| Texto/Fondo Claro | 12.6:1 | AAA ✅ |
| Texto/Fondo Oscuro | 11.8:1 | AAA ✅ |
| Primario/Fondo | 4.8:1 | AA ✅ |
| Enlaces | 4.5:1 | AA ✅ |

---

## 10. Accesibilidad

CAPU está diseñado siguiendo **WCAG 2.1 nivel AA**:

### 10.1 Navegación por Teclado

- **Tab order** lógico y visible
- **Focus indicators** claros (outline naranja 3px)
- **Skip links** para saltar a contenido principal
- **Trampas de foco** en modales

![Focus Visible](images/focus-visible.png)
*Figura 10.1: Indicador de foco visible en elementos interactivos*

### 10.2 Lectores de Pantalla

- **ARIA labels** en todos los elementos interactivos
- **Live regions** para notificaciones dinámicas
- **Headings jerárquicos** (h1 → h2 → h3)
- **Landmarks** (main, nav, header, footer)

### 10.3 Contraste y Visual

- Ratio mínimo 4.5:1 (AA) en todo texto
- No dependencia exclusiva del color
- Escalado hasta 200% sin pérdida de funcionalidad
- Modo de alto contraste soportado

### 10.4 Reducir Movimiento

Respeta `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

# PARTE III: FUNCIONALIDADES PRINCIPALES

## 11. Agenda - Vista Principal

La **Agenda** es el corazón de CAPU - tu vista unificada de todas las tareas:

![Agenda Principal](images/agenda-principal.png)
*Figura 11.1: Vista Agenda con tareas de ejemplo*

### 11.1 Estructura de la Agenda

```
┌────────────────────────────────────────────────────────────┐
│  HEADER: "Agenda"                    [Filtros ▼] [+ Nueva] │
├────────────────────────────────────────────────────────────┤
│  ESTADÍSTICAS RÁPIDAS                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Pendientes│ │ Vencidas │ │ Próx.24h │ │Entregadas│       │
│  │   12    │ │    3     │ │    5     │ │  Semana  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├────────────────────────────────────────────────────────────┤
│  FILTROS: [Curso ▼] [Estado ▼] [Origen ▼] [Limpiar]        │
├────────────────────────────────────────────────────────────┤
│  LISTA DE TAREAS                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📐 Matemáticas • Cálculo I                            │  │
│  │ "Integrales definidas - Ejercicios 1-10"             │  │
│  │ 📅 15 dic 2024, 23:59  │  🟡 En progreso  45%       │  │
│  │ [Ver] [Editar] [Completar]                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Tarjeta de Tarea - Anatomía

![Tarjeta Tarea](images/tarjeta-tarea-anatomia.png)
*Figura 11.2: Anatomía de una tarjeta de tarea*

| Elemento | Significado |
|----------|-------------|
| **Ícono Curso** | Color único por curso (generado automáticamente) |
| **Nombre Curso** | Origen de la tarea (Classroom o personalizado) |
| **Título** | Nombre de la tarea |
| **Descripción** | Primeros 120 caracteres (expandible) |
| **Fecha Límite** | Con indicador visual de urgencia |
| **Badge Estado** | Color según estado (ver tabla) |
| **Barra Progreso** | Solo en "En progreso" |
| **Acciones** | Ver, Editar, Completar |

### 11.3 Códigos de Color - Estados

| Estado | Color | Ícono | Significado |
|--------|-------|-------|-------------|
| **Pendiente** | 🔵 Azul | ⏳ | Por empezar |
| **En Progreso** | 🟡 Amarillo | 🔄 | Avance > 0% |
| **Vencida** | 🔴 Rojo | ⚠️ | Pasó fecha sin entregar |
| **Entregada** | 🟢 Verde | ✅ | Completada a tiempo |

### 11.4 Indicadores de Urgencia

La fecha límite muestra urgencia visual:

| Tiempo Restante | Indicador | Color |
|-----------------|-----------|-------|
| > 7 días | "en X días" | Gris |
| 3-7 días | "en X días" | Azul |
| 24-72 hrs | "en X hrs" | Naranja |
| < 24 hrs | **"URGENTE"** | 🔴 Rojo pulsante |
| Vencida | **"VENCIDA"** | 🔴 Rojo fijo |

![Urgencia](images/indicadores-urgencia.png)
*Figura 11.3: Indicadores de urgencia en tarjetas*

### 11.5 Filtros Avanzados

![Filtros Agenda](images/filtros-agenda.png)
*Figura 11.4: Panel de filtros expandido*

| Filtro | Opciones | Por Defecto |
|--------|----------|-------------|
| **Curso** | Todos / Curso específico | Todos |
| **Estado** | Todos / Pendiente / En Progreso / Vencida / Entregada | Todos |
| **Origen** | Todos / Classroom / Personalizada | Todos |

**Botón "Limpiar filtros"** - Resetea a valores por defecto.

### 11.6 Vacío - Sin Tareas

![Agenda Vacía](images/agenda-vacia.png)
*Figura 11.5: Estado vacío con botón de sincronización*

Si no hay tareas, verás:
- Ilustración amigable
- Mensaje contextual
- Botón **"Sincronizar con Classroom"**
- Botón **"Crear tarea personalizada"**

---

## 12. Gestión de Tareas

### 12.1 Ver Detalle de Tarea

Haz clic en **"Ver"** o en la tarjeta completa:

![Detalle Tarea](images/detalle-tarea.png)
*Figura 12.1: Modal de detalle de tarea*

**Información mostrada:**
- Título y descripción completa
- Curso (con enlace a Classroom si aplica)
- Fecha límite con cuenta regresiva
- Estado actual y progreso
- Enlace directo a Classroom
- Historial de cambios de estado

### 12.2 Completar Tarea

**Desde la lista (rápido):**
1. Haz clic en **✅ Completar** en la tarjeta
2. Confirmación: *"¿Marcar como entregada?"*
3. ¡Tokens ganados! (ver sección Tokens)

**Desde el detalle:**
1. Abre detalle de tarea
2. Arrastra **slider de progreso** a 100%
3. O haz clic en **"Marcar como entregada"**

![Completar Tarea](images/completar-tarea.png)
*Figura 12.2: Slider de progreso y botón completar*

### 12.3 Editar Tarea (Solo Personalizadas)

Las tareas de **Classroom** son **solo lectura** (se editan en Classroom).
Las **personalizadas** se pueden editar:

1. Haz clic en **✏️ Editar**
2. Modifica:
   - Título
   - Descripción
   - Fecha límite
   - Curso (opcional)
3. **Guardar cambios**

![Editar Tarea](images/editar-tarea.png)
*Figura 12.3: Formulario de edición de tarea personalizada*

### 12.4 Eliminar Tarea (Solo Personalizadas)

1. En edición, haz clic en **🗑️ Eliminar**
2. Confirmación doble:
   - *"¿Eliminar esta tarea personalizada?"*
   - Escribe **"ELIMINAR"** para confirmar
3. **Acción irreversible**

![Eliminar Tarea](images/eliminar-tarea.png)
*Figura 12.4: Confirmación doble para eliminación*

### 12.5 Crear Tarea Personalizada

Desde Agenda → **"+ Nueva tarea"**:

![Crear Tarea](images/crear-tarea.png)
*Figura 12.5: Formulario de creación de tarea*

**Campos:**
| Campo | Obligatorio | Detalles |
|-------|-------------|----------|
| **Título** | ✅ | Máx. 200 caracteres |
| **Descripción** | ❌ | Texto libre, máx. 2000 chars |
| **Fecha límite** | ✅ | Date-time picker, mínimo ahora |
| **Curso** | ❌ | Selector de tus cursos sync |
| **Prioridad** | ❌ | Baja / Media (default) / Alta |

### 12.6 Prioridades Visuales

![Prioridades](images/prioridades-tareas.png)
*Figura 12.6: Indicadores visuales de prioridad*

| Prioridad | Color | Uso Recomendado |
|-----------|-------|-----------------|
| **Alta** | 🔴 Rojo | Exámenes, entregas críticas |
| **Media** | 🟡 Naranja | Tareas normales |
| **Baja** | 🟢 Verde | Lecturas, opcionales |

---

## 13. Calendario

Vista temporal de tus tareas con navegación mensual/semanal:

![Calendario Mes](images/calendario-mes.png)
*Figura 13.1: Vista mensual del calendario*

### 13.1 Navegación

| Control | Acción |
|---------|--------|
| **◀ ▶ Mes** | Mes anterior/siguiente |
| **Hoy** | Saltar al mes actual |
| **Vista: Mes/Semana** | Alternar granularidad |
| **Click en día** | Ver tareas del día |

### 13.2 Vista Mensual

![Calendario Dia](images/calendario-dia.png)
*Figura 13.2: Modal de tareas al hacer click en un día*

**Codificación visual en días:**
- **Punto azul**: Tareas pendientes
- **Punto amarillo**: En progreso
- **Punto rojo**: Vencidas
- **Punto verde**: Entregadas
- **Número**: Cantidad de tareas

### 13.3 Vista Semanal

![Calendario Semana](images/calendario-semana.png)
*Figura 13.3: Vista semanal con distribución horaria*

**Características:**
- Días en columnas (Lun-Dom)
- Tareas como bloques de tiempo
- Arrastrable para reprogramar (solo personalizadas)
- Scroll horizontal en móvil

### 13.4 Leyenda del Calendario

![Leyenda Calendario](images/calendario-leyenda.png)
*Figura 13.4: Leyenda de colores y símbolos*

---

## 14. Centro de Notificaciones

Todas tus alertas centralizadas:

![Notificaciones](images/notificaciones-centro.png)
*Figura 14.1: Centro de notificaciones con pestañas*

### 14.1 Pestañas de Filtro

| Pestaña | Contenido | Badge |
|---------|-----------|-------|
| **Todas** | Todo tipo de notificaciones | Total |
| **No Leídas** | Solo no leídas | Contador |
| **Entregas** | Confirmaciones de entrega | - |
| **Recordatorios** | Alertas 24h/1h antes | - |

### 14.2 Tipos de Notificación

| Tipo | Ícono | Trigger | Acción |
|------|-------|---------|--------|
| **Entrega** | ✅ | Tarea marcada entregada | Ver tarea |
| **Recordatorio 24h** | ⏰ | 24h antes de fecha límite | Ver tarea |
| **Recordatorio 1h** | ⏱️ | 1h antes de fecha límite | Ver tarea |
| **Vencida** | ⚠️ | Tarea pasó fecha sin entregar | Ver tarea |
| **Recompensa** | 🎁 | Tokens ganados / canje | Ver Tokens |
| **Sistema** | ℹ️ | Sync completado, errores | Ver detalle |

### 14.3 Acciones en Notificaciones

![Acciones Notif](images/acciones-notificaciones.png)
*Figura 14.3: Acciones disponibles por notificación*

| Acción | Descripción |
|--------|-------------|
| **Click** | Marcar como leída + ir a tarea |
| **✓ Leer** | Marcar como leída (sin navegar) |
| **🗑️ Eliminar** | Quitar de lista (solo sistema) |
| **Marcar todas** | Leer todas de golpe |

### 14.4 Badge en Header

![Badge Header](images/badge-header.png)
*Figura 14.4: Contador de no leídas en campana del header*

- **Número rojo**: No leídas totales
- **Se actualiza en tiempo real** (WebSocket/polling)
- **Click** = Ir a Notificaciones

---

## 15. Sistema de Tokens y Gamificación

El motor de motivación de CAPU:

![Tokens Principal](images/tokens-principal.png)
*Figura 15.1: Página Tokens - Saldo, racha, historial*

### 15.1 Saldo y Racha

```
┌─────────────────────────────────────┐
│  SALDO DISPONIBLE:  247 🪙          │
│  ┌─────────────────────────────┐   │
│  │ 🔥  RACHA ACTUAL: 12 DÍAS   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Racha Diaria:**
- Se incrementa al entregar **≥1 tarea a tiempo** por día
- Se **rompe** si pasas un día sin entregas a tiempo
- **Máximo bono**: 5 tokens extra por racha

### 15.2 Tabla de Recompensas (Tokens)

| Acción | Tokens Base | Condiciones |
|--------|-------------|-------------|
| **Entrega a tiempo** | +10 | Sin antelación especial |
| **Entrega anticipada** | +15 | ≥ 24h antes de fecha límite |
| **Bono Racha** | +1 a +5 | Día consecutivo con entrega (máx 5) |
| **Entrega vencida** | 0 | Pasó fecha límite |
| **Completar personalizada** | +10 | Igual que Classroom |

### 15.3 Cálculo de Ejemplo

```
Escenario: Entregas 3 tareas el lunes (todas a tiempo, 1 con 48h antelación)
Racha actual: 5 días

Cálculo:
- Tarea 1 (normal):     10 tokens
- Tarea 2 (anticipada): 15 tokens  (+5 bono antelación)
- Tarea 3 (normal):     10 tokens
- Bono racha (día 6):   +2 tokens  (límite 5/día)

TOTAL: 37 tokens ganados
Nuevo saldo: anterior + 37
Nueva racha: 6 días
```

### 15.4 Historial de Transacciones

![Historial Tokens](images/historial-tokens.png)
*Figura 15.2: Historial paginado de transacciones*

| Columna | Información |
|---------|-------------|
| **Motivo** | "Entrega a tiempo: Cálculo I - Integrales" |
| **Fecha** | Fecha y hora exacta |
| **Cantidad** | +10, +15, -50 (canje), etc. |
| **Color** | Verde (ganancia) / Rojo (gasto) |

---

## 16. Recompensas y Canje

Canjea tus tokens por recompensas configuradas por tu institución:

![Recompensas](images/recompensas-grid.png)
*Figura 16.1: Grid de recompensas disponibles*

### 16.1 Tarjeta de Recompensa

![Tarjeta Recompensa](images/tarjeta-recompensa.png)
*Figura 16.2: Anatomía de tarjeta de recompensa*

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Ej: "Café gratis en cafetería" |
| **Costo** | 50 🪙 |
| **Estado** | Disponible / No disponible (gris) |
| **Botón** | "Canjear" (deshabilitado si saldo insuficiente) |

### 16.2 Proceso de Canje

1. Verifica que tienes **saldo suficiente**
2. Haz clic en **"Canjear"** en la recompensa deseada
3. Confirmación: *"¿Canjear 'Café gratis' por 50 tokens?"*
4. **¡Éxito!** Recibes código/cupón + notificación

![Canje Exitoso](images/canje-exitoso.png)
*Figura 16.3: Modal de confirmación de canje exitoso*

### 16.3 Historial de Canjes

En la página Tokens → **Historial** verás:
- Canjes realizados con fecha
- Tokens gastados
- Código de canje (si aplica)

### 16.4 Tipos de Recompensas Comunes

| Categoría | Ejemplos | Rango Tokens |
|-----------|----------|--------------|
| **Alimentación** | Café, snack, almuerzo | 30-80 |
| **Academico** | Pase examen, extensión | 100-300 |
| **Entretenimiento** | Entrada cine, streaming | 50-150 |
| **Merchandising** | Stickers, camiseta, taza | 80-200 |
| **Experiencias** | Taller, charla, mentoría | 200-500 |

---

## 17. Resumen y Analíticas

Tu dashboard personal de productividad:

![Resumen](images/resumen-dashboard.png)
*Figura 17.1: Dashboard de Resumen con métricas y gráficos*

### 17.2 Tarjetas de Métricas (KPIs)

![KPIs](images/kpis-resumen.png)
*Figura 17.2: 4 tarjetas de métricas principales*

| Métrica | Cálculo | Objetivo |
|---------|---------|----------|
| **Tasa Entrega** | Entregadas a tiempo / Total vencidas | > 80% |
| **Tareas/Semana** | Promedio últimos 30 días | Personal |
| **Tokens Totales** | Acumulado histórico | Creciente |
| **Racha Actual** | Días consecutivos con entrega | Máximo posible |

### 17.3 Gráficos Disponibles

#### A. Tasa de Entrega Semanal
![Grafico Entrega](images/grafico-entrega-semanal.png)
*Figura 17.3: Gráfico de barras - Tasa de entrega por día de semana*

- **Eje X**: Días (Lun-Dom)
- **Eje Y**: % entregadas a tiempo
- **Línea objetivo**: 80%

#### B. Tokens Ganados (8 Semanas)
![Grafico Tokens](images/grafico-tokens-semanal.png)
*Figura 17.4: Gráfico de barras - Tokens ganados por semana*

- **Eje X**: Semanas (últimas 8)
- **Eje Y**: Tokens ganados
- **Línea tendencia**: Promedio móvil

### 17.4 Interpretación de Datos

| Patrón | Qué Indica | Acción Recomendada |
|--------|------------|-------------------|
| **Bajas los lunes** | Acumulación fin de semana | Planificar domingo |
| **Picos viernes** | Entregas de última hora | Empezar antes |
| **Racha rota** | Día sin entregas | Micro-hábitos diarios |
| **Tokens estancados** | Pocas entregas | Revisar carga académica |

---

## 18. Perfil y Configuración

Gestión completa de tu cuenta:

![Perfil](images/perfil-configuracion.png)
*Figura 18.1: Página de Perfil con 3 secciones*

### 18.1 Datos Personales

![Datos Personales](images/datos-personales.png)
*Figura 18.2: Formulario de datos personales*

| Campo | Editable | Notas |
|-------|----------|-------|
| **Avatar** | ❌ | Generado automáticamente (iniciales + color) |
| **Nombre** | ✅ | Se usa en toda la app |
| **Email** | ❌ | Clave única, cambiar = nueva cuenta |
| **Rol** | ❌ | Estudiante / Admin (solo lectura) |

### 18.2 Conexión Google

![Conexion Google](images/conexion-google-perfil.png)
*Figura 18.3: Estado de conexión Google Classroom*

**Estados:**
- **No conectado** → Botón "Conectar con Google"
- **Conectado** → Email Google + botón "Desconectar"

### 18.3 Preferencias de Notificaciones

![Preferencias Notif](images/preferencias-notificaciones.png)
*Figura 18.4: Grid de preferencias de notificación*

| Preferencia | Default | Descripción |
|-------------|---------|-------------|
| **Push (Navegador)** | ✅ On | Notificaciones web push |
| **Email** | ❌ Off | Copia por correo electrónico |
| **Recordatorio 24h** | ✅ On | Aviso 24h antes de entrega |
| **Recordatorio 1h** | ✅ On | Aviso 1h antes de entrega |

**Cambios se guardan automáticamente** al hacer click.

### 18.4 Cambiar Contraseña (Solo Email)

![Cambiar Password](images/cambiar-password.png)
*Figura 18.5: Formulario de cambio de contraseña*

**Requisitos:**
- Contraseña actual
- Nueva (mín. 8 chars, compleja)
- Confirmación

### 18.5 Zona de Peligro

![Zona Peligro](images/zona-peligro.png)
*Figura 18.6: Acciones destructivas con confirmaciones*

| Acción | Confirmaciones | Irreversible |
|--------|----------------|--------------|
| **Desconectar Google** | 1 modal | Sí (pierde sync) |
| **Cerrar Sesión** | 1 modal | No (puedes entrar) |
| **Eliminar Cuenta** | 2 modales + escribir "ELIMINAR" | **SÍ - TOTAL** |

---

# PARTE IV: INTEGRACIÓN CON GOOGLE CLASSROOM

## 19. Conexión con Google Classroom

### 19.1 ¿Por qué Conectar?

| Beneficio | Descripción |
|-----------|-------------|
| **Sync Automático** | Cursos y tareas cada 15 min |
| **Entregas Reales** | Detecta entregas hechas en Classroom |
| **Tokens Reales** | Ganas tokens por entregas reales |
| **Enlace Directo** | Un click a la tarea en Classroom |

### 19.2 Proceso de Conexión

**Desde Onboarding o Perfil:**

1. Click **"Conectar con Google"**
2. Selecciona cuenta **Google Workspace / Education**
3. Autoriza **3 ámbitos (scopes)**:
   - `classroom.courses.readonly`
   - `classroom.coursework.students.readonly`
   - `classroom.student-submissions.students.readonly`
4. ¡Listo! Verás **"Conectado ✓"**

![Scopes OAuth](images/scopes-oauth.png)
*Figura 19.1: Permisos solicitados en OAuth*

### 19.3 Permisos Mínimos (Privacidad)

CAPU **solo solicita lectura**:
- ❌ No puede crear/modificar/borrar en Classroom
- ❌ No ve calificaciones ni comentarios privados
- ✅ Solo ve: cursos, tareas, tus entregas
- ✅ Tokens guardados **encriptados** (AES-256)

---

## 20. Sincronización de Cursos y Tareas

### 20.1 Sincronización Automática

- **Cada 15 minutos** (configurable por admin)
- **En background** (no interfiere)
- **Solo si hay cambios** (ETag/lastModified)

### 20.2 Sincronización Manual

![Sync Manual](images/sync-manual.png)
*Figura 20.1: Botón "Sincronizar ahora" en header y estado vacío*

**Cuándo usarla:**
- Acabas de entregar en Classroom
- Cambiaste de curso
- Quieres forzar actualización

**Proceso:**
1. Click **"Sincronizar ahora"**
2. Spinner: *"Sincronizando..."*
3. Toast: *"Sincronización completada: X nuevas, Y actualizadas"*

### 20.3 Qué se Sincroniza

| Entidad | Desde Classroom | Hacia CAPU |
|---------|-----------------|------------|
| **Cursos** | Activos donde eres estudiante | Lista en selector + filtro |
| **Tareas** | CourseWork publicadas | Tarjetas en Agenda/Calendario |
| **Entregas** | StudentSubmissions tuyas | Estado "Entregada" + tokens |
| **Fechas** | dueDate/dueTime | Fecha límite con zona horaria |

### 20.4 Manejo de Conflictos

| Situación | Resolución |
|-----------|------------|
| Tarea borrada en Classroom | Marca como "eliminada" (oculta) |
| Fecha cambiada | Actualiza en CAPU |
| Entrega detectada | Marca entregada + otorga tokens |
| Curso archivado | Oculta de selectores |

---

## 21. Entregas desde Classroom

### 21.1 Flujo Completo

```
1. Trabajas en tu tarea en Classroom/Drive
2. Haces "Entregar" en Classroom
3. CAPU detecta en próximo sync (≤15 min)
4. Marca tarea como "Entregada" 🟢
5. Calcula tokens según hora de entrega
6. Notificación push: "¡Ganaste 15 tokens!"
6. Actualiza racha diaria si aplica
```

### 21.2 Tokens por Entrega Classroom

| Tipo Entrega | Tokens | Lógica |
|--------------|--------|--------|
| **A tiempo** (≤ fecha) | 10 | Base |
| **Anticipada** (≥24h) | 15 | +5 bono |
| **Muy anticipada** (≥7d) | 15 | Máx. bono anticipación |
| **Vencida** (> fecha) | 0 | Sin tokens |
| **Con racha** | +1 a +5 | Según día consecutivo |

### 21.3 Verificación de Entrega

En la tarjeta de tarea verás:

![Entrega Detectada](images/entrega-detectada.png)
*Figura 21.1: Tarjeta mostrando entrega detectada desde Classroom*

- **Badge verde** "Entregada"
- **Enlace** "Ver en Classroom" → abre tarea original
- **Timestamp** de entrega real
- **Tokens ganados** mostrados en toast

---

# PARTE V: FUNCIONALIDADES AVANZADAS

## 22. Modo Offline (PWA)

CAPU es una **Progressive Web App** instalable:

### 22.1 Instalación

**En Chrome/Edge (Escritorio):**
1. Icono **➕ Instalar** en barra de direcciones
2. Click **"Instalar"**
3. Acceso directo en Escritorio/Inicio

**En Chrome (Android):**
1. Menú ⋮ → **"Instalar aplicación"**
2. Icono en launcher

**En Safari (iOS):**
1. Compartir □→ → **"Añadir a pantalla de inicio"**

![PWA Install](images/pwa-install.png)
*Figura 22.1: Prompt de instalación PWA en diferentes navegadores*

### 22.2 Funcionamiento Offline

| Funcionalidad | Online | Offline |
|---------------|--------|---------|
| Ver tareas cacheadas | ✅ | ✅ |
| Ver calendario | ✅ | ✅ |
| Ver tokens/historial | ✅ | ✅ |
| Crear tareas personalizadas | ✅ | ✅ (sync luego) |
| Completar tareas | ✅ | ✅ (sync luego) |
| Sync Classroom | ✅ | ❌ |
| Notificaciones Push | ✅ | ❌ |

### 22.3 Sincronización Diferida

Acciones offline se guardan en **IndexedDB** y se sincronizan al volver online:

![Sync Diferida](images/sync-diferida.png)
*Figura 22.2: Indicador de acciones pendientes de sincronización*

---

## 23. Recordatorios y Alertas

### 23.1 Configuración (Ver 18.3)

### 23.2 Tipos de Recordatorio

| Tipo | Cuándo | Canal |
|------|--------|-------|
| **24 horas** | 24h antes de fecha límite | Push + Email (si on) |
| **1 hora** | 1h antes de fecha límite | Push + Email (si on) |
| **Vencida** | Al detectar tarea sin entregar | Push + Centro notif. |

### 23.3 Permisos de Notificación

**Primera vez:**
1. CAPU solicita permiso
2. Click **"Permitir"**
3. Se registra **Service Worker** + **Push Subscription**

![Permiso Notif](images/permiso-notificaciones.png)
*Figura 23.1: Solicitud de permiso de notificaciones*

**Si bloqueaste:**
- Configuración del navegador → Sitios → CAPU → Notificaciones → Permitir

### 23.4 Testing de Notificaciones

En Perfil → **"Probar notificación"** (solo admin) o espera recordatorio real.

---

## 24. Tareas Personalizadas

Además de Classroom, crea tus propias tareas:

### 24.1 Cuándo Usar

- Tareas **no en Classroom** (lecturas, estudio, proyectos personales)
- **Recordatorios** personales (citas, exámenes no digitales)
- **Sub-tareas** de un trabajo grande

### 24.2 Diferencias con Classroom

| Característica | Classroom | Personalizada |
|----------------|-----------|---------------|
| **Origen** | Sync automático | Creación manual |
| **Edición** | Solo lectura | Completa |
| **Eliminación** | No | Sí |
| **Enlace Classroom** | Sí | No |
| **Tokens** | Igual | Igual |

### 24.3 Gestión Avanzada

**Duplicar tarea:** En edición → "Duplicar" → cambia fecha
**Plantillas:** Guarda descripciones frecuentes (próximamente)

---

# PARTE VI: SOLUCIÓN DE PROBLEMAS

## 25. Preguntas Frecuentes (FAQ)

### 25.1 Cuenta y Acceso

**P: No recibo el email de verificación**
R: Revisa Spam/Promociones. Si no está, usa "Reenviar email" en el banner superior tras iniciar sesión.

**P: Olvidé mi contraseña y no tengo acceso al email**
R: Contacta a soporte (ver sección 27) para verificación manual de identidad.

**P: ¿Puedo cambiar mi email?**
R: No directamente. Crea cuenta nueva con el email correcto y migra datos manualmente.

**P: Mi cuenta fue eliminada por error**
R: La eliminación es irreversible tras confirmación. Contacta soporte INMEDIATAMENTE.

### 25.2 Google Classroom

**P: Conecté Google pero no veo mis cursos**
R: 1) Haz "Sincronizar ahora" 2) Verifica que eres **estudiante** en esos cursos (no profesor) 3) Cursos archivados no aparecen.

**P: Entregué en Classroom pero no me dieron tokens**
R: Espera al siguiente sync automático (15 min) o fuerza "Sincronizar ahora". Tokies se otorgan al detectar entrega.

**P: Quiero desconectar Google temporalmente**
R: Usa "Desconectar Google" en menú/perfil. Puedes reconectar después sin perder datos.

**P: ¿CAPU ve mis calificaciones?**
R: **NO**. Solo ve: cursos, tareas, tus entregas (fecha/estado). Nunca calificaciones ni comentarios.

### 25.3 Tokens y Gamificación

**P: Perdí mi racha por un día**
R: La racha se rompe si no entregas ≥1 tarea a tiempo en un día. Vuelve a empezar desde 1.

**P: ¿Los tokens expiran?**
R: **No**. Los tokens no expiran. Solo se gastan al canjear recompensas.

**P: ¿Puedo transferir tokens a otro usuario?**
R: No. Los tokens son personales e intransferibles.

**P: Una recompensa dice "No disponible"**
R: El admin la desactivó o se agotó stock. Contacta a tu admin.

### 25.4 Técnico

**P: La app va lenta**
R: 1) Cierra pestañas innecesarias 2) Limpia caché del navegador 3) Verifica conexión 4) Reinicia app.

**P: No funcionan las notificaciones**
R: Verifica: 1) Permiso en navegador 2) No modo "No molestar" en OS 3) Preferencias en Perfil activas.

**P: Modo oscuro no se guarda**
R: Verifica que `localStorage` no esté deshabilitado (modo incógnito/privado lo bloquea).

---

## 26. Problemas Comunes y Soluciones

### 26.1 Error: "Token inválido o expirado"

**Causa:** JWT expirado (24h) o manipulado
**Solución:** Cierra sesión y vuelve a entrar. Si persiste, limpia `localStorage` (F12 → Application → Clear).

### 26.2 Error: "Error interno del servidor" (500)

**Causa:** Problema temporal del backend
**Solución:** Espera 1-2 min y reintenta. Si persiste >5 min, contacta soporte.

### 26.3 Tareas no aparecen tras Sync

**Checklist:**
- [ ] ¿Eres estudiante en el curso? (no profesor/TA)
- [ ] ¿El curso está activo? (no archivado)
- [ ] ¿La tarea está publicada? (no borrador)
- [ ] ¿Tiene fecha límite? (sin fecha = no sync)
- [ ] ¿Forzaste "Sincronizar ahora"?

### 26.4 Tokens no se otorgan

**Verifica:**
- [ ] Entrega fue **antes** de fecha límite
- [ ] Sync detectó la entrega (revisa historial tokens)
- [ ] No es entrega duplicada (solo 1 vez por tarea)

### 26.5 PWA no instala

**Requisitos:**
- [ ] HTTPS (o localhost)
- [ ] Service Worker registrado (F12 → Application → Service Workers)
- [ ] Manifest válido (F12 → Application → Manifest)
- [ ] Iconos 192x192 y 512x512 presentes

---

## 27. Contacto y Soporte

### 27.1 Canales de Soporte

| Canal | Tiempo Respuesta | Para |
|-------|------------------|------|
| **Email** | 24-48h | Dudas, bugs, sugerencias |
| **GitHub Issues** | Variable | Bugs técnicos, features |
| **Documentación** | Inmediato | Preguntas frecuentes |

### 27.2 Información para Reportar Bugs

Incluye siempre:
1. **Navegador y versión** (Chrome 120, Firefox 115, etc.)
2. **Sistema operativo** (Windows 11, macOS 14, Android 14)
3. **Pasos para reproducir** (númerados)
4. **Resultado esperado vs actual**
5. **Capturas de pantalla** (si aplica)
6. **Consola del navegador** (F12 → Console → errores rojos)

### 27.3 Email de Soporte

```
soporte@capu.app
Asunto: [BUG/DUDA/SUGERENCIA] Breve descripción
```

---

# ANEXOS

## Anexo A: Glosario de Términos

| Término | Definición |
|---------|------------|
| **CAPU** | Calendario y Agenda para la Productividad Universitaria |
| **PWA** | Progressive Web App - App web instalable |
| **Classroom** | Google Classroom - Plataforma educativa de Google |
| **Sync / Sincronización** | Proceso de traer datos de Classroom a CAPU |
| **Token** | Moneda virtual de CAPU (🪙) |
| **Racha** | Días consecutivos con ≥1 entrega a tiempo |
| **Canje** | Intercambio de tokens por recompensa |
| **CourseWork** | Tarea/asignación en terminología Classroom |
| **StudentSubmission** | Entrega de un estudiante en Classroom |
| **JWT** | JSON Web Token - Autenticación stateless |
| **OAuth 2.0** | Protocolo de autorización (Google) |
| **PKCE** | Proof Key for Code Exchange - OAuth seguro |
| **Service Worker** | Script para offline/push en segundo plano |
| **IndexedDB** | Base de datos en el navegador (offline) |
| **localStorage** | Almacenamiento clave-valor persistente |
| **WCAG** | Web Content Accessibility Guidelines |
| **ETag** | Entity Tag - Validación de caché HTTP |

## Anexo B: Atajos de Teclado

| Atajo | Acción | Contexto |
|-------|--------|----------|
| `Alt + 1` | Ir a Agenda | Global |
| `Alt + 2` | Ir a Calendario | Global |
| `Alt + 3` | Ir a Notificaciones | Global |
| `Alt + 4` | Ir a Tokens | Global |
| `Alt + 5` | Ir a Resumen | Global |
| `Alt + 6` | Ir a Perfil | Global |
| `Escape` | Cerrar modal/menú | Global |
| `Tab` | Siguiente elemento | Formularios |
| `Shift + Tab` | Elemento anterior | Formularios |
| `Enter` | Enviar formulario | En foco botón submit |
| `Espacio` | Toggle checkbox | En foco checkbox |

## Anexo C: Política de Privacidad (Resumen)

**Datos que recopilamos:**
- Nombre, email (registro)
- Token OAuth Google (encriptado)
- Tareas, entregas, preferencias (para funcionar)
- Métricas de uso anónimas (mejora producto)

**Datos que NO recopilamos:**
- Calificaciones de Classroom
- Comentarios privados
- Archivos de Drive
- Historial de navegación fuera de CAPU

**Tus derechos:**
- Acceso, rectificación, supresión (GDPR/LOPD)
- Portabilidad de datos
- Retirar consentimiento (desconectar Google)
- Olvido (eliminar cuenta)

**Seguridad:**
- HTTPS obligatorio (TLS 1.3)
- Tokens OAuth encriptados AES-256
- JWT con expiración 24h + refresh rotation
- Headers de seguridad (CSP, HSTS, X-Frame-Options)

---

**Fin del Manual de Usuario**

*Documento generado automáticamente - Versión 1.0 - Noviembre 2026*
*CAPU - Agenda Inteligente con Gamificación*
*https://github.com/VictorMBojorquez/Capu*