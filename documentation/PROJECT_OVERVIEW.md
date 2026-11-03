# 01. Visión y Alcance del Proyecto: Koin

## 1. Declaración de Visión

**Koin** es una aplicación de finanzas personales diseñada bajo tres pilares fundamentales: **Velocidad Extrema**, **Aislamiento Multi-Perfil** y **Personalización Total**. 

La mayoría de aplicaciones financieras del mercado sufren de fricción excesiva (múltiples pantallas para registrar un simple café), requieren cuentas en la nube obligatorias con suscripciones recurrentes, o no permiten que varios miembros de una familia/pareja compartan el mismo dispositivo manteniendo sus finanzas estrictamente separadas y privadas. Koin resuelve estos problemas con una experiencia offline-first inmediata, cambio instantáneo de perfil y temas visuales personalizables.

---

## 2. Objetivos Principales

1. **Registro en < 3 Segundos ("Zero-Friction Logging")**:
   - Abrir la app e ingresar un gasto debe tomar menos de 3 toques o 3 segundos.
   - Teclado numérico integrado optimizado con categorías frecuentes inmediatas.

2. **Soporte Multi-Perfil con Aislamiento Estricto**:
   - Múltiples personas en el mismo dispositivo (ej. Persona A, Persona B, o un único usuario con perfil "Personal" y perfil "Freelance/Negocio").
   - Cero filtración de datos entre perfiles: cuentas bancarias, transacciones, presupuestos, categorías e historial completamente independientes.
   - Seguridad opcional por perfil: bloqueo por PIN (4 o 6 dígitos) o autenticación biométrica (huella dactilar / Face ID en Android).

3. **Colores y Temas Dinámicos Configurables**:
   - Cada perfil tiene su propia identidad visual: color primario, acento, modo oscuro / claro / negro AMOLED, y densidad de interfaz.
   - Permite diferenciar visualmente y al instante en qué perfil se encuentra el usuario (ej. Perfil A en Esmeralda, Perfil B en Púrpura).

4. **Multiplataforma Unificada (Web + Android)**:
   - Código base compartido al 100% garantizando paridad total de funciones entre navegadores de escritorio/móviles y la app nativa instalable en Android.

5. **Privacidad y Filosofía Local-First**:
   - Los datos financieros pertenecen al usuario. Se almacenan localmente en el dispositivo de forma predeterminada, sin requerir internet para ninguna operación básica.
   - Mecanismo robusto de respaldo y exportación en formatos abiertos (JSON encriptado / CSV).

---

## 3. Personas y Casos de Uso

### Caso 1: Pareja o Familia Compartiendo Dispositivo Móvil o Tablet
- **Escenario**: Dylan y María comparten una tablet en casa o desean llevar sus registros en el mismo teléfono.
- **Solución Koin**: Crean los perfiles "Dylan" y "María". Dylan elige un tema Azul Índigo con PIN de acceso; María elige un tema Coral Rosa sin PIN. Al abrir la app, conmutan de perfil con un solo toque y ven únicamente sus cuentas, tarjetas y presupuestos.

### Caso 2: Emprendedor / Profesional Freelance
- **Escenario**: Un usuario maneja gastos de su vida personal y gastos de su actividad profesional independiente, pero no quiere mezclar facturas ni estadísticas fiscales.
- **Solución Koin**: Crea el perfil "Personal" (moneda local, tema Verde Bosque) y "Agencia Digital" (moneda USD, tema Amarillo Ámbar). Ambos flujos contables quedan segregados con reportes de flujo de caja independientes.

### Caso 3: Usuario Rápido en la Calle (Mobile Web o Android APK)
- **Escenario**: El usuario compra un billete de transporte o un almuerzo y necesita registrarlo antes de guardar el teléfono en el bolsillo.
- **Solución Koin**: El botón flotante de acción rápida abre el modal de ingreso instantáneo, escribe "15", pulsa el icono "Transporte", y listo.

---

## 4. Métricas de Éxito (KPIs Técnicos y de UX)

| Métrica | Objetivo Koin | Estándar de la Industria |
| :--- | :--- | :--- |
| **Tiempo de primer registro de gasto** | **< 3 segundos** | 8 - 15 segundos |
| **Tiempo de arranque en frío (Cold Start)** | **< 800 ms** en Android | > 2.5 s |
| **Cambio de perfil** | **Instantáneo (< 100 ms)** | Requiere relogin / recarga |
| **Disponibilidad offline** | **100% funcional sin conexión** | Parcial / Falla sin red |
| **Reutilización de código Web/Android** | **> 95%** | 60 - 70% |
| **Consumo de memoria RAM** | **< 75 MB** | > 180 MB |
