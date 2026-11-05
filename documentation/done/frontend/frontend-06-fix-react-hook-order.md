# Entregable Frontend 06: Corrección de Orden de Hooks en React (Error #310)

## 📋 Resumen del Entregable
- **Módulo / HU:** Corrección crítica de ciclo de vida de React y reglas de Hooks en el componente raíz (`App.tsx`).
- **Rama de Trabajo:** `feat/frontend-fix-react-hook-order`
- **Fecha:** 04-11-2026
- **Autor:** Dylan Gamero

---

## 🎯 Causa Raíz y Solución del Error

### Causa Raíz (React Error #310: "Rendered more hooks than during the previous render")
En `App.tsx`, las llamadas a `useRecurringStore()` (Zustand con `useCallback`) y su respectivo `useEffect()` se encontraban ubicadas **después** de los retornos tempranos condicionales:
```tsx
// ❌ CÓDIGO ANTERIOR: Retorno temprano antes de declarar hooks
if (isLoading) {
  return <LoadingSpinner />;
}
if (!isAuthenticated || !user) {
  return <AuthPage />;
}
// Los siguientes hooks se saltaban en el primer render (isLoading = true),
// pero se invocaban en el segundo render (isLoading = false), alterando el conteo:
const { rules, fetchRules } = useRecurringStore();
useEffect(() => { ... }, [profile?.id, fetchRules]);
```
Durante la carga inicial (`isLoading = true` mientras se verificaba la sesión), React registraba 14 hooks. En el render subsiguiente (`isLoading = false`), el componente no retornaba temprano y ejecutaba los 2 hooks adicionales, violando la regla inmutable de React de invocar el mismo número de hooks en el mismo orden.

### Solución Implementada
Se reorganizó la cabecera de `App.tsx` para invocar **todos los hooks de manera incondicional en la parte superior**, antes de cualquier evaluación de retorno condicional:
```tsx
// ✅ CÓDIGO CORREGIDO: Todos los hooks se ejecutan incondicionalmente arriba
const {
  user,
  profiles,
  activeProfile,
  isAuthenticated,
  isLoading,
  checkSession,
  setActiveProfile,
  logout,
} = useAuthStore();

const { rules, fetchRules } = useRecurringStore();

useEffect(() => {
  checkSession();
}, [checkSession]);

const profile = activeProfile || (profiles && profiles.length > 0 ? profiles[0] : null);

useEffect(() => {
  if (isAuthenticated && profile?.id) {
    fetchRules(profile.id);
  }
}, [isAuthenticated, profile?.id, fetchRules]);

// Retornos tempranos condicionales estrictamente DESPUÉS de todos los hooks:
if (isLoading) {
  return <LoadingSpinner />;
}
if (!isAuthenticated || !user) {
  return <AuthPage />;
}
```

---

## 🛠️ Archivos Modificados
- `apps/web/src/App.tsx`: Reubicación incondicional de `useRecurringStore` y `useEffect` antes de `if (isLoading)` y `if (!isAuthenticated)`.

---

## 🧪 Verificación y Pruebas
1. **Verificación de Tipos TypeScript:**
   - `pnpm check-types`: 4/4 paquetes exitosos (0 errores).
2. **Compilación de Producción:**
   - `pnpm --filter=@koin/web build`: Vite compiló en 3.61s (`index-Dtz4FBcZ.js`).
3. **Despliegue en Docker:**
   - `docker compose up -d --build koin-web`: Contenedor recreado e iniciado.
   - `curl -sI http://localhost:5173`: HTTP 200 OK.
