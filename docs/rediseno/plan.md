# Plan: rediseño PayShare (estilo Apple)

Fuente de verdad visual: `docs/rediseno/referencia.html` (demo aprobada). Todo valor de color, radio, sombra, espaciado, curva de animación y texto se toma de ahí. Si este plan y la referencia chocan en lo visual, gana la referencia; en alcance y reglas, gana este plan.

Rama: `rediseno-payshare`. Stack: Next.js 16 (leer `node_modules/next/dist/docs/` antes de tocar APIs de Next, ver `AGENTS.md`), React 19, Tailwind 4 (`@theme inline` en `app/globals.css`), vitest.

## Requisitos

- **RF-1 Tema.** Tres modos: Claro (por defecto), Auto (sigue día/noche del dispositivo), Oscuro. Se recuerda en `localStorage` (`ps-theme`). Sin parpadeo al cargar.
- **RF-2 Marca.** El encabezado dice "PayShare" con el logo (círculo partido). Comensal: subtítulo "Paga con CoDi" + chip "Mesa N". Caja: subtítulo "Caja · {restaurante}". El nombre del restaurante sigue en el ticket.
- **RF-3 Ticket.** La cuenta se ve como ticket: muescas laterales, perforación punteada, talón, borde inferior festoneado, degradado leve. Muestra restaurante, mesa, total, pagos, renglón "por pagar" del comensal y restante.
- **RF-4 Comensal.** Formulario con tres secciones de mismo patrón (etiqueta afuera, tarjeta abajo): nombre (campo claro con etiqueta "Tu nombre (opcional)"), monto, propina. Hojas de método y celular, vistas QR / celular / pagado, según la referencia.
- **RF-5 Caja.** Cuadrícula de mesas, detalle de mesa, hojas de abrir / editar / compartir / quitar / cerrar, y login con el nuevo estilo.
- **RF-6 Superficies.** Campos, tarjetas, barras y hojas con vidrio esmerilado suave (degradado leve + blur + filo de luz), como la referencia.
- **RNF-1 Sin regresiones.** `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` salen con 0. Ninguna ruta `app/api/**` ni `lib/**` existente cambia de comportamiento.
- **RNF-2 Accesibilidad.** Anillo de foco visible, `prefers-reduced-motion` respetado, trampa de foco y Esc en hojas (ya existe, no romper), contraste legible en claro y oscuro, `inputmode` (no `type=number`), `role=status/alert` donde ya están.
- **RNF-3 Tokens.** Cero colores literales en componentes: todo sale de variables en `app/globals.css`. Se conservan los nombres de token actuales (se les cambia el valor) y se agregan los nuevos de la referencia.
- **RNF-4 Textos.** Se conservan los textos funcionales actuales (DESIGN.md §6). Solo cambian los de marca (RF-2) y los del campo nombre.

## Fronteras

**Non-Goals**
- Lógica de pagos, API, webhooks, Supabase, tipos de dominio.
- Lo que es solo de la demo: marco de teléfono, selector Comensal/Caja, botón reiniciar, datos sembrados, QR decorativo (se queda `QrImage` real), reloj falso.
- Tests de componentes con DOM.
- Página `/qrs` (solo cambia el nombre de marca si aparece el fallback "Pay Share").

**Anti-Goals**
- Dependencias nuevas (ni UI kits, ni librerías de animación, ni jsdom / testing-library, ni next-themes).
- `tailwind.config.*`. CSS-in-JS. Proveedor de contexto para el tema (basta clase en `<html>` + script inline).
- `backdrop-filter` dentro del ticket (su padre usa `filter: drop-shadow`; usar degradados opacos).
- Refactors no pedidos, renombrar archivos fuera de lo listado, tocar `tests/**` existentes.

## Criterios de aceptación

- **CA-1 Tema por defecto.** Sin valor guardado → `<html>` con clase `t-light`. Valor guardado inválido (`"x"`) → `t-light`.
- **CA-2 Tema auto.** `ps-theme=auto` + sistema en oscuro → tokens oscuros; sistema en claro → tokens claros. `ps-theme=dark` → oscuro siempre. `localStorage` bloqueado → no truena, queda claro.
- **CA-3 Marca.** `/mesa/[id]` muestra "PayShare", "Paga con CoDi", "Mesa N". Caja muestra "PayShare" y "Caja · Casa Nopal"; sin nombre de restaurante configurado → solo "Caja".
- **CA-4 Ticket.** Cuenta $1,840 con pagos → renglones de pagos + restante correcto. Sin pagos → sin renglones, restante = total. Cubierta → restante $0.00 y texto de la referencia ("No falta nada por pagar.").
- **CA-5 Renglón propio.** Nombre "Ana" + monto válido → "Ana · por pagar" con ese monto y el restante proyectado. Monto 0 o mayor al restante → no aparece renglón pendiente.
- **CA-6 Nombre.** Campo visible con etiqueta, placeholder "Para que la mesa vea quién pagó", máx. 40 caracteres, va primero.
- **CA-7 Compuertas.** `pnpm test && pnpm typecheck && pnpm lint && pnpm build` → exit 0; los 30 tests previos siguen iguales.
- **CA-8 A11y.** Tab recorre controles con anillo visible; con reduced-motion no hay animaciones de entrada; Esc cierra hojas.
- **CA-9 Vista previa.** `/dev/preview` (solo desarrollo; en producción da 404) muestra las pantallas con datos fijos, sin red, y cambia con el tema.

## Slices (en orden, uno a la vez)

Todos: modelo **Grok 4.7 high** (implementación ágil de UI). No hacer commit; dejar cambios en el árbol de trabajo. Correr las compuertas de CA-7 antes del memo.

### S1 — Fundamentos: tokens, tema, marca
- Objetivo: base visual y de tema lista; la app ya se ve con la paleta nueva.
- Archivos: `app/globals.css`, `app/layout.tsx`, `lib/theme.ts` (nuevo), `tests/theme.test.ts` (nuevo), `components/ui/theme-menu.tsx` (nuevo), `components/ui/brand-bar.tsx` (nuevo, reemplaza a `shop-bar.tsx`; borrar `shop-bar.tsx` y actualizar sus 3 usos y el barrel), `components/ui/icons.tsx`, `components/ui/index.ts`, `app/dev/preview/page.tsx` (nuevo, esqueleto).
- Detalle:
  - Tokens claros en `:root`; oscuros en `:root.t-dark` y en `@media (prefers-color-scheme: dark){ :root.t-auto }`. `color-scheme` acorde. Mantener el puente `@theme inline`.
  - `lib/theme.ts`: funciones puras `parseTheme(valor desconocido) → 'light'|'auto'|'dark'` y `themeClass(tema)`. El script inline de `layout.tsx` aplica la clase antes de pintar, dentro de try/catch.
  - `ThemeMenu`: botón de icono en la barra que abre el `DropdownMenu` existente con Claro / Auto / Oscuro y marca el activo.
  - `BrandBar`: logo + "PayShare" + subtítulo + ranura derecha (chip / ThemeMenu). Barra de vidrio.
  - Fuente: pila del sistema (SF primero) con Inter de respaldo; mono con Geist Mono vía `next/font/google`.
  - Metadata y fallbacks "Pay Share" → "PayShare".
- Tests: `tests/theme.test.ts` (válidos, inválido, null, objeto raro → 'light'; clase por tema).
- Cubre: RF-1, RF-2, RNF-3, CA-1, CA-2, CA-3, CA-9.

### S2 — Primitivos de UI
- Objetivo: todos los componentes compartidos con el estilo nuevo.
- Archivos: `components/ui/{button,input,card,badge,banner,status-pill,bottom-sheet,dropdown-menu,empty-state,text,page-shell}.tsx`, `app/globals.css`, `app/dev/preview/page.tsx`.
- Detalle: botones tipo píldora con presión elástica; campos de vidrio (alto 52, radio 16); hoja inferior flotante de vidrio; quitar colores literales (p. ej. `bottom-sheet.tsx`). No cambiar props públicas salvo que sea imprescindible (reportarlo).
- Tests: no hay lógica nueva; compuertas CA-7 + vista previa.
- Cubre: RF-6, RNF-2, RNF-3, CA-8.

### S3 — Ticket
- Objetivo: componente `Ticket` que reemplaza a `AccountCard` en comensal y caja.
- Archivos: `components/ui/ticket.tsx` (nuevo), `lib/ticket.ts` (nuevo), `tests/ticket.test.ts` (nuevo), `components/ui/account-card.tsx` (borrar si queda sin usos; conservar o migrar `AccountSkeleton`), `components/ui/index.ts`, `app/globals.css`, sitios de uso en `components/mesa/mesa-app.tsx` y `components/caja/table-detail.tsx`, `app/dev/preview/page.tsx`.
- Detalle: `lib/ticket.ts` con función pura que arma el modelo del ticket (renglones, renglón pendiente, restante proyectado, porcentaje, leyenda) siguiendo `ticketHTML` de la referencia; reutilizar `lib/totals` y `lib/money` existentes.
- Tests: `tests/ticket.test.ts` con CA-4 y CA-5 (con pagos, sin pagos, cubierta, pendiente válido, pendiente 0, pendiente mayor al restante, variante caja).
- Cubre: RF-3, CA-4, CA-5.

### S4 — Flujo comensal
- Objetivo: pantallas del comensal iguales a la referencia.
- Archivos: `components/mesa/{mesa-app,payment-form,tip-selector,payment-sheets,payment-views}.tsx`, `app/mesa/[id]/{page,not-found}.tsx`, `app/globals.css`, `app/dev/preview/page.tsx`.
- Detalle: nombre primero y visible; monto grande; propina como control segmentado con pastilla deslizante; vistas QR / celular / pagado; `SimulateBox` se conserva en modo mock.
- Tests: compuertas CA-7 + vista previa (la lógica ya está cubierta por S3 y tests previos).
- Cubre: RF-4, RNF-4, CA-6.

### S5 — Flujo caja y cierre
- Objetivo: caja con el estilo nuevo; documentación al día.
- Archivos: `components/caja/{caja-app,login-form,table-grid,table-card,table-detail,table-sheets}.tsx`, `app/caja/{page,login/page}.tsx`, `app/qrs/page.tsx` (solo fallback de marca), `app/globals.css`, `app/dev/preview/page.tsx`, `DESIGN.md` (actualizar: nombre PayShare, tres temas, tokens nuevos, vidrio y degradados permitidos, ticket).
- Tests: compuertas CA-7 + vista previa.
- Cubre: RF-5, RNF-1, CA-3, CA-7.

## Trazabilidad

| Req | Slice |
|---|---|
| RF-1 | S1 |
| RF-2 | S1, S5 |
| RF-3 | S3 |
| RF-4 | S4 |
| RF-5 | S5 |
| RF-6 | S2 |
| RNF-1 | todos (compuertas), S5 |
| RNF-2 | S2, S4, S5 |
| RNF-3 | S1, S2 |
| RNF-4 | S4, S5 |
| CA-1, CA-2 | S1 |
| CA-3 | S1, S5 |
| CA-4, CA-5 | S3 |
| CA-6 | S4 |
| CA-7 | todos |
| CA-8 | S2 |
| CA-9 | S1 (y se amplía en S2–S5) |

## Reglas para el agente que implementa

1. Ejecuta solo el slice indicado. Toca solo los archivos listados; si necesitas otro, detente y repórtalo en el memo.
2. No hagas commit, ni push, ni cambies de rama.
3. No instales dependencias.
4. Los tests nuevos deben poder fallar: verifica cada uno rompiendo un momento la implementación.
5. Termina con este memo y nada más (máx. 10 líneas):

```text
[SLICE]: <id y nombre>
[AGENTE]: <modelo>
[ARCHIVOS]: <git diff --stat resumido>
[EVIDENCIA]: <comandos corridos y resultado, con exit code>
[NON-GOALS]: <Confirmado | violación: ...>
[ALERTAS/BLOQUEOS]: <Ninguno | ...>
```
