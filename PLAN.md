# PLAN — Un QR por mesa para dividir la cuenta (MVP hackatón pey.build)

> Plan de implementación por fases para agentes y subagentes.
> Fuente: `documento.pdf` (14-nov-2026) + verificación contra la documentación real de Pey
> (`https://docs.pey.mx`, `https://docs.pey.mx/openapi.json`, versión de API `2026-10-20`).
> Entrega del hackatón: **12-dic-2026**. Resultados: 14-dic-2026.

---

## 0. Cómo usar este plan

- Las fases van **en orden**. Dentro de una fase, las tareas marcadas `∥` pueden correr en paralelo (subagentes distintos); las demás son secuenciales.
- Cada tarea tiene: ID, archivos que toca (propiedad exclusiva para evitar choques entre agentes), qué hacer y **criterio de aceptación** verificable.
- Cada fase termina con una **puerta de salida**: no se avanza hasta que pase.
- Las tareas `[HUMANO]` solo las puede hacer Valentin (cuentas, llaves, pagar desde el banco). Los agentes **no** crean cuentas, **no** escriben llaves reales y **no** hacen pagos.
- Si la realidad de la API de Pey contradice este plan, gana la API: el agente ajusta, y anota el cambio en la sección 10 ("Bitácora de decisiones").
- **Toda tarea de interfaz sigue `DESIGN.md`** (tokens, componentes, pantallas, textos y lista de verificación). Referencia visual navegable: `design/prototipo-ui.html`. En diseño, `DESIGN.md` manda sobre las descripciones de pantalla de este plan.

---

## 1. Veredicto sobre el documento

La idea, el alcance y el stack están bien y se conservan. El documento tenía varios supuestos sobre Pey marcados como "sin confirmar"; ya están verificados y **varios eran incorrectos**. Correcciones obligatorias:

| # | El documento dice | Realidad verificada | Decisión |
|---|---|---|---|
| C1 | `numRef` = referencia única de texto del pago, guardada en `pey_ref` | `numRef` solo acepta **dígitos, máximo 7** (`^[0-9]{1,7}$`). Un UUID o texto hace fallar la llamada | No usar `numRef` para correlacionar. Se correlaciona con el **`id` del QR** que devuelve Pey (llega en el webhook como `codiQrId`) y, de respaldo, con `metadata.paymentId`. `numRef` = id del pago módulo 10 000 000, solo informativo |
| C2 | Firma del webhook: "HMAC SHA-256 del cuerpo crudo, a confirmar" | Pey usa el estándar **Standard Webhooks**: encabezados `webhook-id`, `webhook-timestamp`, `webhook-signature`; secreto con prefijo `whsec_` | Usar la librería oficial `standardwebhooks` (npm). No escribir HMAC a mano |
| C3 | Formato de respuesta del QR desconocido | `201` con `{ id, qrString, qrImage? }`. `qrString` es el texto a codificar como QR | Renderizar el QR en el navegador con `qrcode` a partir de `qrString`. No pedir `generateImage` (es más lento) |
| C4 | El webhook trae "monto, referencia y folio" | Trae `amount`, `codiQrId`, `concept`, `datePaid`, `numRef`, `transactionId`, `metadata.externalMetadata`, `type` | Guardar `transactionId`. Idempotencia por estado del pago + `transactionId` único |
| C5 | Monto: ¿pesos o centavos? | **Pesos**, como número decimal (`150.0`, `0.01`) | En nuestra base se guardan **centavos enteros**; se convierte a pesos solo al llamar a Pey |
| C6 | `expiration: 900` | Válido: `0` = sin vencimiento, o mínimo `360` s | Se queda en 900 |
| C7 | "¿Hay forma de pagar desde el mismo teléfono?" (pregunta abierta 8) | **Sí**: `POST /codi/pn` manda la solicitud de cobro al celular del comensal (10 dígitos) y le llega dentro de la app de su banco | Se agrega como segunda forma de pago (Fase 4). Es la mejor experiencia en móvil |
| C8 | No se menciona qué pasa si el webhook se pierde | Existe `GET /transaction/codi/qr/{id}` y `GET /transaction/{id}` para consultar el estado | Reconciliación de respaldo: si el pago sigue pendiente, el servidor le pregunta a Pey (Fase 3) |
| C9 | "Una cuenta bancaria con CoDi para recibir" | Registrar la cuenta propia tarda **5 días hábiles** ante Banxico. Pey ofrece una cuenta de prueba de activación inmediata, pero **el dinero enviado ahí no se devuelve** | `[HUMANO]` registrar hoy la cuenta real. Mientras tanto se usa la de prueba **solo con $0.01**. Ver salvaguarda S1 |
| C10 | "Pey no tiene sandbox" | Correcto por ahora ("ambiente de pruebas próximamente"). Pey recomienda probar en producción con $0.01 | Se conserva `DEMO_MODE`, y se agrega un proveedor simulado local para desarrollar sin dinero real |

Riesgos de diseño que el documento no cubría y este plan sí:

- **El comensal sale del navegador para pagar.** Al irse a la app del banco, el teléfono suspende la conexión en tiempo real. Al volver, la pantalla debe **volver a consultar** el estado; no basta con Realtime.
- **Escrituras desde el navegador.** El prompt original permitía que el navegador escribiera en la base con la llave pública. Aquí **toda escritura pasa por el servidor**; la llave pública solo puede leer.
- **Tablero público.** Cualquiera con la dirección podría abrir o cerrar mesas. Se agrega un PIN sencillo para la caja (no es un sistema de usuarios; es una contraseña compartida).
- **Dos cuentas abiertas en la misma mesa.** Se impide en la base de datos con un índice único, no solo en la pantalla.
- **Pagar más de lo que falta.** El servidor rechaza una "parte" mayor al restante (la propina es libre).
- **Afirmación fiscal.** "La propina no cuenta como venta ni para IVA" es una afirmación fiscal no verificada. En la app y el pitch decir: *"la propina se registra aparte de la venta"*. Si se quiere afirmar lo del IVA, confirmarlo con un contador.

Preguntas que siguen abiertas para Pey (no bloquean el MVP): política de reintentos del webhook; criterios de evaluación y entregables del hackatón (revisar en el portal de pey.build).

---

## 2. Decisiones de arquitectura (definitivas para el MVP)

- **Stack:** Next.js (App Router, última versión estable vía `create-next-app@latest`) + TypeScript + Tailwind CSS + Supabase (Postgres + Realtime) + Vercel. Gestor de paquetes: `pnpm`.
- **Dependencias de runtime (y nada más):** `@supabase/supabase-js`, `qrcode`, `standardwebhooks`. Pruebas: `vitest`.
- **Dinero:** enteros en centavos (`*_cents`) en base y en código. Un solo módulo convierte y formatea (`$1,234.00`).
- **Lecturas:** un único "snapshot" por mesa calculado en el servidor (`getTableSnapshot`). Ambas pantallas lo consumen por `GET /api/tables` y `GET /api/tables/[id]`. La fórmula del restante vive en **un solo lugar** (`computeTotals`).
- **Tiempo real:** Supabase Realtime se usa solo como **señal** ("algo cambió → vuelve a pedir el snapshot"). Respaldo: volver a pedir al regresar a la pestaña (`visibilitychange`) y cada 4 s mientras haya un pago pendiente propio.
- **Escrituras:** solo route handlers del servidor con la llave de servicio. RLS activo; la llave pública solo tiene `select`.
- **Proveedor de pagos intercambiable por variable de entorno** (`PEY_MODE`):
  - `mock` — sin Pey; QR falso y botón "Simular pago" (para desarrollo y plan B).
  - `live` — Pey real.
- **`DEMO_MODE`** (activo salvo que valga exactamente `false`): la base y la pantalla muestran los montos reales del ejemplo, pero a Pey se le cobra `$0.01`.
- **Correlación de pagos:** se guarda `pey_qr_id` (QR) o `pey_transaction_id` (push). El webhook busca por `codiQrId` / `transactionId`; respaldo por `metadata.externalMetadata.paymentId`.

### Salvaguardas no negociables

- **S1.** `DEMO_MODE` se considera activo por defecto. Mientras la cuenta receptora sea la de prueba de Pey, **nunca** poner `DEMO_MODE=false` (ese dinero no regresa).
- **S2.** `PEY_API_KEY`, `PEY_WEBHOOK_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` solo en servidor; jamás con prefijo `NEXT_PUBLIC_`, jamás en git. `.env.local` está en `.gitignore`.
- **S3.** El webhook verifica la firma sobre el **cuerpo crudo** (`await request.text()`) antes de tocar la base. Firma inválida → `401`, sin efectos.
- **S4.** Marcar pagado es idempotente: `update ... where status = 'pending'`. Un aviso repetido responde `200` sin cambiar nada.
- **S5.** El endpoint de "simular pago" responde `404` si `PEY_MODE` no es `mock`.
- **S6.** El número de celular (push CoDi) no se guarda en la base ni en logs: solo se reenvía a Pey.
- **S7.** Los agentes no ejecutan pagos reales ni registran webhooks en el portal: son tareas `[HUMANO]`.

---

## 3. Modelo de datos

Archivo: `supabase/migrations/0001_init.sql` (se pega en el editor SQL de Supabase).

```sql
create table tables (
  id   serial primary key,
  name text not null
);

create table bills (
  id          serial primary key,
  table_id    int not null references tables(id),
  total_cents int not null check (total_cents > 0),
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);
-- Solo una cuenta abierta por mesa
create unique index one_open_bill_per_table on bills(table_id) where status = 'open';

create table payments (
  id                 serial primary key,
  bill_id            int not null references bills(id),
  amount_cents       int not null check (amount_cents > 0),   -- parte (venta)
  tip_cents          int not null default 0 check (tip_cents >= 0),
  charged_cents      int not null check (charged_cents > 0),  -- lo que realmente se pidió a Pey (1 en DEMO_MODE)
  payer_name         text check (char_length(payer_name) <= 20),  -- opcional: "Miguel pagó $200"
  method             text not null check (method in ('qr','pn')),
  status             text not null default 'pending' check (status in ('pending','paid')),
  pey_qr_id          text unique,   -- id del QR (codiQrId en el webhook)
  pey_transaction_id text unique,   -- transactionId de Pey
  expires_at         timestamptz,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);
create index payments_bill_idx on payments(bill_id);

insert into tables(name) select 'Mesa ' || g from generate_series(1,6) g;

-- Seguridad: la llave pública solo lee
alter table tables   enable row level security;
alter table bills    enable row level security;
alter table payments enable row level security;
create policy read_tables   on tables   for select to anon using (true);
create policy read_bills    on bills    for select to anon using (true);
create policy read_payments on payments for select to anon using (true);

-- Tiempo real
alter publication supabase_realtime add table bills, payments;
```

Reglas de cálculo (únicas, en `computeTotals`):

- `pagado = Σ amount_cents` de pagos `paid`
- `propinas = Σ tip_cents` de pagos `paid`
- `restante = max(0, total_cents − pagado)`; si `pagado > total`, exponer `excedente = pagado − total`
- Los pagos `pending` no cuentan. Un `pending` con `expires_at` pasado se muestra como "vencido" (solo visual, no cambia de estado).

---

## 4. Estructura del proyecto

```
app/
  page.tsx                        → redirige a /caja
  caja/page.tsx                   → tablero del cajero
  caja/login/page.tsx             → PIN (Fase 4)
  mesa/[id]/page.tsx              → pantalla del comensal
  qrs/page.tsx                    → QR imprimibles
  api/tables/route.ts             → GET snapshots de todas las mesas
  api/tables/[id]/route.ts        → GET snapshot de una mesa
  api/bills/route.ts              → POST abrir cuenta
  api/bills/[id]/close/route.ts   → POST cerrar mesa
  api/pay/route.ts                → POST crear pago (QR o push)
  api/payments/[id]/route.ts      → GET estado del pago (+ reconciliación)
  api/webhooks/pey/route.ts       → POST webhook de Pey
  api/dev/simulate/route.ts       → POST simular pago (solo PEY_MODE=mock)
components/                       → piezas de interfaz
lib/
  money.ts                        → centavos ↔ pesos, parseo y formato
  totals.ts                       → computeTotals
  env.ts                          → lectura validada de variables de entorno
  db.ts                           → cliente Supabase de servidor + getTableSnapshot + markPaid
  supabase-browser.ts             → cliente público (solo Realtime)
  use-live-snapshot.ts            → hook: snapshot + Realtime + respaldo por sondeo
  payments/provider.ts            → tipo PaymentProvider + selección por PEY_MODE
  payments/mock.ts                → proveedor simulado
  payments/pey.ts                 → cliente HTTP de Pey
supabase/migrations/0001_init.sql
tests/                            → vitest
.env.example
README.md
```

Variables de entorno (`.env.example`):

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | Llave pública (anon / publishable), solo lectura |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Llave de servicio (secret) para escrituras |
| `NEXT_PUBLIC_BASE_URL` | público | Dirección del sitio, para los QR de mesa |
| `NEXT_PUBLIC_RESTAURANT_NAME` | público | Nombre mostrado al comensal |
| `PEY_MODE` | servidor | `mock` o `live` |
| `PEY_API_KEY` | servidor | Llave de API de Pey |
| `PEY_WEBHOOK_SECRET` | servidor | Secreto `whsec_…` del webhook |
| `DEMO_MODE` | servidor | Activo salvo `false`: cobra $0.01 a Pey |
| `CASHIER_PIN` | servidor | PIN de la caja (Fase 4) |

---

## 5. Contratos de API interna

Todos los montos viajan en **centavos enteros**. Errores: `{ error: "mensaje en español" }` con el código HTTP adecuado.

| Endpoint | Entrada | Salida | Reglas |
|---|---|---|---|
| `GET /api/tables` | — | `Snapshot[]` | Todas las mesas con su cuenta abierta (o `bill: null`) |
| `GET /api/tables/[id]` | — | `Snapshot` | `404` si la mesa no existe |
| `POST /api/bills` | `{ tableId, totalCents }` | `Snapshot` | `totalCents > 0`. Si ya hay cuenta abierta → `409` (lo garantiza el índice único) |
| `POST /api/bills/[id]/close` | — | `Snapshot` | Pone `closed` y `closed_at`. Idempotente |
| `POST /api/pay` | `{ billId, amountCents, tipCents, method: 'qr'\|'pn', phone?, name? }` | `{ paymentId, method, qrString?, expiresAt }` | Cuenta abierta; `amountCents > 0`; `tipCents ≥ 0`; `amountCents ≤ restante`; `phone` de 10 dígitos si `pn`; `name` opcional, se recorta a 20 caracteres y se guarda como texto plano (React lo escapa al mostrarlo; nunca usar `dangerouslySetInnerHTML`) |
| `GET /api/payments/[id]` | — | `{ status }` | Si sigue `pending` y `PEY_MODE=live`, consulta a Pey y reconcilia |
| `POST /api/webhooks/pey` | cuerpo crudo firmado | `200` / `401` | Ver Fase 3 |
| `POST /api/dev/simulate` | `{ paymentId }` | `{ ok }` | Solo `PEY_MODE=mock`; si no, `404` |

```ts
type Snapshot = {
  table: { id: number; name: string };
  bill: null | {
    id: number; totalCents: number; status: 'open'; createdAt: string;
    paidCents: number; tipsCents: number; remainingCents: number; overpaidCents: number;
    payments: { id: number; name: string | null; amountCents: number; tipCents: number; method: 'qr'|'pn';
                status: 'pending'|'paid'; expired: boolean; createdAt: string; paidAt: string|null }[];
  };
};
```

Interfaz del proveedor (única, con dos implementaciones reales: `mock` y `pey`):

```ts
type ChargeInput  = { paymentId: number; billId: number; chargeCents: number; concept: string;
                      expirationSeconds: number; method: 'qr'|'pn'; phone?: string };
type ChargeResult = { qrId?: string; qrString?: string; transactionId?: string };
interface PaymentProvider {
  createCharge(input: ChargeInput): Promise<ChargeResult>;
  /** ¿Pey ya tiene este cobro como pagado? Devuelve el transactionId si sí. */
  findPaid(ref: { qrId?: string; transactionId?: string }): Promise<string | null>;
}
```

---

## 6. Fases

### Fase 0 — Preparación `[HUMANO]` (en paralelo con la Fase 1)

| ID | Tarea | Resultado |
|---|---|---|
| H0.1 | Crear cuentas gratis: GitHub, Vercel, Supabase | Accesos listos |
| H0.2 | Crear proyecto en Supabase. Copiar URL, llave pública y llave de servicio | 3 valores guardados |
| H0.3 | En el portal de Pey (`portal.mipey.mx`): crear perfil → Finanzas → agregar cuenta de pago tipo **codi** con **tu cuenta bancaria real** (tarda 5 días hábiles: hacerlo **hoy**) | Registro en trámite |
| H0.4 | Mientras se activa: registrar la cuenta de prueba que indica la documentación de Pey (tutorial "Crear una API key"). **Ese dinero no se devuelve: solo $0.01** | Cuenta activa de inmediato |
| H0.5 | Portal → Developer → crear API key ligada a la cuenta codi | `PEY_API_KEY` |
| H0.6 | Tener una app bancaria **con CoDi activado** para pagar (distinta a la cuenta receptora) y verificar que lee QR CoDi (cámara y "desde galería") | App pagadora lista |
| H0.7 | Preguntar a los organizadores: criterios de evaluación, entregables del 12-dic, política de reintentos del webhook | Respuestas anotadas en sección 10 |

**Puerta de salida:** H0.2 listo antes de la Fase 2; H0.4–H0.6 listos antes de la Fase 3.

---

### Fase 1 — Cimientos (sin Pey, sin interfaz)

| ID | Tarea | Archivos | Criterio de aceptación |
|---|---|---|---|
| F1.1 | Crear proyecto: `pnpm create next-app@latest .` (TypeScript, Tailwind, App Router, ESLint, sin `src/`). `git init`. Instalar `@supabase/supabase-js qrcode standardwebhooks` y dev `vitest @types/qrcode`. Scripts `test` y `typecheck`. Seguir las convenciones de la versión de Next instalada (p. ej. `params` asíncrono) | raíz, `package.json` | `pnpm dev`, `pnpm build`, `pnpm typecheck` sin errores. Primer commit |
| F1.2 ∥ | Migración SQL exactamente como la sección 3 | `supabase/migrations/0001_init.sql` | SQL válido; `[HUMANO]` lo corre en Supabase y ve 6 mesas |
| F1.3 ∥ | `money.ts`: `parsePesosToCents("300.50") → 30050` (rechaza negativos, texto, más de 2 decimales; acepta coma de miles), `centsToPesos`, `formatMXN(30050) → "$300.50"`. `totals.ts`: `computeTotals(totalCents, payments)` | `lib/money.ts`, `lib/totals.ts`, `tests/money.test.ts`, `tests/totals.test.ts` | Pruebas cubren: propina no resta; pendientes no cuentan; restante nunca negativo; excedente; redondeo de `0.1+0.2` |
| F1.4 ∥ | `env.ts`: funciones que leen y validan cada variable, con error claro en español si falta. `demoMode()` = activo salvo `"false"`. `peyMode()` = `mock`\|`live`. `.env.example` con comentarios | `lib/env.ts`, `.env.example` | Falta de variable produce mensaje que dice cuál y dónde ponerla |
| F1.5 | `db.ts`: cliente de servidor (llave de servicio), `getTableSnapshot(id)`, `getAllSnapshots()`, `openBill`, `closeBill`, `createPendingPayment`, `attachProviderRefs`, `markPaid(paymentId, transactionId)` con `where status='pending'` | `lib/db.ts` | Depende de F1.2–F1.4. `markPaid` llamado dos veces cambia la fila una sola vez |

**Puerta de salida:** `pnpm test`, `pnpm typecheck`, `pnpm build` en verde; tablas creadas en Supabase; `.env.local` lleno con las llaves de Supabase y `PEY_MODE=mock`.

---

### Fase 2 — Flujo completo con proveedor simulado

Objetivo: **el guion del demo funciona de punta a punta en local, sin Pey.**

| ID | Tarea | Archivos | Criterio de aceptación |
|---|---|---|---|
| F2.1 | Proveedor: tipo `PaymentProvider`, selector por `PEY_MODE`, e implementación `mock` (`qrString` falso reconocible, `qrId = "mock-<paymentId>"`) | `lib/payments/provider.ts`, `lib/payments/mock.ts` | `getProvider()` devuelve el mock con `PEY_MODE=mock` |
| F2.2 | Endpoints de lectura y de cajero: `GET /api/tables`, `GET /api/tables/[id]`, `POST /api/bills`, `POST /api/bills/[id]/close` | `app/api/tables/**`, `app/api/bills/**` | Abrir dos veces la misma mesa → `409`. Total `0` o negativo → `400` |
| F2.3 | `POST /api/pay` (método `qr`), `GET /api/payments/[id]`, `POST /api/dev/simulate`. Orden en `/api/pay`: validar → insertar `pending` → llamar al proveedor → guardar referencias. Si el proveedor falla, borrar el `pending` y devolver error legible. `chargeCents = demoMode() ? 1 : amount + tip`. Concepto: `"Mesa {n} cuenta {billId}"` | `app/api/pay/route.ts`, `app/api/payments/[id]/route.ts`, `app/api/dev/simulate/route.ts` | Parte mayor al restante → `400`. Cuenta cerrada → `409`. Simular con `PEY_MODE=live` → `404` |
| F2.4 ∥ | Hook `useLiveSnapshot(tableId?)`: carga inicial, suscripción Realtime a `bills` y `payments` (cualquier evento → volver a pedir), recarga en `visibilitychange`/`focus`, sondeo cada 4 s opcional | `lib/supabase-browser.ts`, `lib/use-live-snapshot.ts` | Con dos pestañas, un cambio en una se ve en la otra en < 2 s sin recargar |
| F2.5 | Caja `/caja`, **primero para teléfono** y en dos paneles desde 900 px, según `DESIGN.md` §5: cuadrícula de mesas (libre / monto por cobrar); mesa libre → hoja "Abrir cuenta" con solo el total; detalle con "Por cobrar en efectivo" en grande, total, pagado por transferencia, propinas aparte y lista de pagos; **Cerrar mesa** con hoja de confirmación | `app/caja/page.tsx`, `components/caja/*` | Cumple `DESIGN.md` §5 y la lista de verificación §10. Todo se actualiza solo |
| F2.6 | Comensal `/mesa/[id]` según `DESIGN.md` §4: tarjeta "Falta por pagar" en vivo; campo "¿Cuánto pagas tú?" con atajo "Pagar todo lo que falta"; propina por chips (No/10/15/20/Otra, empieza en No); barra inferior con `Pagar $X`; pantalla de QR (renderizado con `qrcode` desde `qrString`, cuenta regresiva, pasos, vencimiento); "Pago recibido"; estados sin cuenta, cubierta, cargando y error. En esta fase el botón Pagar va directo al QR (la hoja de método llega en F4.2). Con `PEY_MODE=mock`, botón de demostración "Simular pago" claramente separado de la interfaz real | `app/mesa/[id]/page.tsx`, `components/mesa/*` | Cumple `DESIGN.md` §4 y §10. Tras generar el QR sondea `GET /api/payments/[id]` cada 4 s y al volver a la pestaña |
| F2.7 ∥ | `/qrs` según `DESIGN.md` §5.6: una tarjeta imprimible por mesa con QR a `{NEXT_PUBLIC_BASE_URL}/mesa/{id}` | `app/qrs/page.tsx` | Vista previa de impresión limpia; el QR abre la mesa correcta |
| F2.8 | **Base de diseño (va antes de F2.5–F2.7):** tokens de `DESIGN.md` §2 en `globals.css` y expuestos a Tailwind; fuentes Bricolage Grotesque e Instrument Sans con `next/font/google`; `lang="es-MX"`, viewport con `viewport-fit=cover`; componentes de `DESIGN.md` §3 (`MesaRing`, `Hero`, `Button`, `BigAmount`, `Pills`, tarjetas y filas, `StatusPill`, `BottomSheet`, barra clara, `ActionBar`, `StateScreen`) | `app/layout.tsx`, `app/globals.css`, `components/ui/*` | Cada componente coincide con el prototipo; ningún color literal fuera de los tokens; foco visible y zonas táctiles ≥ 44 px |

Dependencias: F2.1 → F2.3; F2.8 puede ir en paralelo con F2.1–F2.4; F2.2, F2.4 y **F2.8** → F2.5 y F2.6. F2.5, F2.6 y F2.7 pueden ir en paralelo (archivos distintos).

**Puerta de salida (verificación manual en navegador, escritorio + ventana móvil):**
1. Abrir Mesa 4 con $500.
2. En `/mesa/4`: parte $300, propina $30 → generar QR → Simular pago.
3. El tablero muestra sin recargar: Pagado $300, Propinas $30, **"$200.00 restantes en efectivo"**.
4. Segundo comensal intenta pagar $250 → rechazado (faltan $200).
5. Cerrar mesa → `/mesa/4` muestra "sin cuenta abierta".

---

### Fase 3 — Pey real y publicación

| ID | Tarea | Archivos | Criterio de aceptación |
|---|---|---|---|
| F3.1 | Cliente de Pey. `createCharge` QR: `POST https://api.pey.mx/codi/qr`, `Authorization: Bearer`, cuerpo `{ amount: chargeCents/100, concept, expiration: 900, numRef: String(paymentId % 10000000), metadata: { paymentId, billId } }`; éxito = `201` → `{ qrId: id, qrString }`. Errores: leer `error.message`/`error.type`/`error.requestId`, registrar `requestId` y devolver mensaje en español. `503` → "Pey está en mantenimiento, intenta de nuevo". `findPaid`: `GET /transaction/codi/qr/{qrId}` → algún `item.status === 'PAID'`. Tiempo límite de 10 s | `lib/payments/pey.ts`, `tests/pey.test.ts` | Pruebas con `fetch` simulado: forma exacta del cuerpo, `numRef` solo dígitos ≤ 7, manejo de `400`/`503` |
| F3.2 | Webhook `POST /api/webhooks/pey`: (1) `raw = await request.text()`; (2) verificar con `new Webhook(secret).verify(raw, headers)` → si falla `401`; (3) si `type === 'codi.qr.payment_received'`: buscar pago por `pey_qr_id = codiQrId`, respaldo `metadata.externalMetadata.paymentId`; (4) no encontrado → registrar y `200`; (5) si `amount` ≠ `charged_cents/100` → registrar aviso y **no** marcar; (6) `markPaid` (idempotente); (7) `200` rápido. Otros tipos de evento → `200` sin efecto. Registrar `webhook-id` y tipo, nunca el secreto | `app/api/webhooks/pey/route.ts`, `tests/webhook.test.ts` | Pruebas firmando con `standardwebhooks`: firma válida marca pagado; repetido no duplica; firma inválida → `401` sin cambios; monto distinto no marca |
| F3.3 | Reconciliación: `GET /api/payments/[id]` — si `pending` y `PEY_MODE=live`, llamar `provider.findPaid` (máx. una vez cada 5 s por pago) y `markPaid` si corresponde | `app/api/payments/[id]/route.ts` | Con el webhook apagado, el pago igual termina en "pagado" en < 10 s tras volver a la pantalla |
| F3.4 | README para no programadores: correr en local, llenar `.env.local`, publicar en Vercel, registrar webhook, lista de variables | `README.md` | Valentin puede seguirlo sin ayuda |
| H3.5 | `[HUMANO]` Crear repositorio en GitHub (privado), subir, importar en Vercel, copiar variables (`PEY_MODE=live`, `DEMO_MODE=true`), poner `NEXT_PUBLIC_BASE_URL` con la dirección de Vercel y volver a desplegar | — | Sitio público funcionando |
| H3.6 | `[HUMANO]` Portal Pey → Developer → engrane de la API key → webhook `https://<sitio>.vercel.app/api/webhooks/pey` → copiar el secreto a `PEY_WEBHOOK_SECRET` en Vercel → redesplegar | — | Webhook registrado |
| H3.7 | `[HUMANO]` **Prueba real de $0.01**: abrir Mesa 4 $500 → escanear → $300 + $30 → pagar desde el banco | — | Tablero se actualiza solo. Revisar "Webhook Logs" en el portal: respuesta `200` |
| F3.8 | Con los datos reales de H3.7 (logs de Vercel): confirmar que `codiQrId` del webhook = `id` de creación; ajustar la correlación si no; anotar en sección 10 | según hallazgo | Correlación confirmada con un pago real |

F3.1, F3.2 y F3.4 pueden ir en paralelo. F3.3 depende de F3.1.

**Puerta de salida:** un pago real de $0.01 pasa de "Esperando pago…" a "Pago recibido" en el teléfono y actualiza el tablero, **dos veces seguidas**; un reenvío del mismo webhook no duplica el pago.

---

### Fase 4 — Experiencia de pago en el mismo teléfono + protección de la caja

| ID | Tarea | Archivos | Criterio de aceptación |
|---|---|---|---|
| F4.1 | QR en el propio teléfono: botones **"Guardar QR"** (descarga PNG) y **"Compartir"** (Web Share API con archivo, si el navegador lo soporta) + instrucción breve: "Abre tu app del banco → CoDi → leer QR desde imagen" | `components/mesa/*` | Probado en iPhone (Safari) y Android (Chrome) |
| F4.2 | **Cobro al celular (push CoDi)**: en `/mesa/[id]`, alternativa "Recibir el cobro en mi celular" → campo de 10 dígitos → `POST /api/pay` con `method: 'pn'`. En `pey.ts`: `POST /codi/pn` `{ amount, phoneNumber, concept, expiration: 360, numRef, metadata }` → guarda `transactionId`. `findPaid` para push: `GET /transaction/{transactionId}`. Webhook: aceptar también `codi.pn.payment_received` (buscar por `pey_transaction_id = transactionId`). Mock soporta `pn`. No guardar ni registrar el teléfono (S6) | `lib/payments/*`, `app/api/pay/route.ts`, `app/api/webhooks/pey/route.ts`, `components/mesa/*`, pruebas | `[HUMANO]` prueba real de $0.01: llega la solicitud a la app del banco y el pago se confirma. Si el push falla (`503` o número sin CoDi), mensaje claro y se ofrece el QR |
| F4.3 ∥ | PIN de caja: `/caja/login` con un campo; compara contra `CASHIER_PIN` en tiempo constante; cookie `httpOnly`, `secure`, `sameSite=lax` firmada; protege `/caja`, `/qrs`, `POST /api/bills*` y `GET /api/tables` (lista). `/mesa/*`, `GET /api/tables/[id]`, `/api/pay`, `/api/payments/*` y el webhook siguen públicos. Si `CASHIER_PIN` no está definido en producción, la caja muestra error de configuración en lugar de quedar abierta | `middleware.ts` (o el equivalente de la versión de Next), `app/caja/login/*`, `app/api/caja/login/route.ts` | Sin cookie: `/caja` redirige al PIN y `POST /api/bills` responde `401` |
| F4.4 ∥ | Pulido de lo que se ve en el demo: animación de confirmación de pago, resaltado del pago nuevo en el tablero, mensajes de QR vencido ("Este QR venció, genera otro"), estado sin conexión | `components/**` | Revisión visual en móvil y tableta |

**Puerta de salida:** en un teléfono real, pagar sin un segundo dispositivo por ambas vías (QR guardado y push); caja inaccesible sin PIN.

---

### Fase 5 — Demo y entrega

| ID | Tarea | Responsable | Resultado |
|---|---|---|---|
| F5.1 | Revisión final: `/code-review` y `/security-review` sobre el repositorio; corregir hallazgos | Agente | Sin hallazgos graves |
| F5.2 | Lista de verificación previa al demo en el README: variables, webhook, mesa cerrada, batería, datos móviles, PIN | Agente | Checklist |
| H5.3 | Imprimir el QR de la Mesa 4 desde `/qrs` | Humano | QR físico |
| H5.4 | Grabar en video un pago real de $0.01 completo (plan B si falla el internet) | Humano | Video |
| H5.5 | Ensayar dos veces el guion de 3 minutos (sección 11 del documento), usando la frase corregida sobre propinas | Humano | Demo listo |
| H5.6 | Cuando la cuenta bancaria real quede activa: cambiar la API key a esa cuenta y repetir la prueba de $0.01 | Humano | Dinero llega a la cuenta propia |
| F5.7 | Entregables según lo que respondan los organizadores (H0.7): repositorio, video, presentación | Ambos | Entrega del 12-dic |

**Plan B en vivo** (si Pey o el banco fallan durante la presentación): un segundo despliegue en Vercel con `PEY_MODE=mock` y el botón "Simular pago", avisando al jurado que es simulación, más el video de H5.4.

---

## 7. Después del MVP (no construir ahora)

En orden: corte del día (ventas por transferencia, propinas, efectivo esperado) · manejo de pago recibido en cuenta ya cerrada y de excedentes · usuarios reales para la caja y propina por mesero · prueba en un restaurante de Villahermosa · varias sucursales · facturación.

Fuera de alcance definitivo del MVP: tarjetas, integración con punto de venta, división por platillo, reembolsos.

---

## 8. Reglas para los agentes

1. Leer las secciones 1–5 antes de tocar código. Los contratos de la sección 5 no se cambian sin anotarlo en la sección 10.
2. Un agente por tarea; respetar la columna "Archivos". Si necesita tocar un archivo ajeno, coordinarlo con el orquestador.
3. Lo más simple que cumpla el criterio de aceptación. Sin dependencias nuevas fuera de la sección 2, sin abstracciones extra, sin funciones "por si acaso".
4. Dinero siempre en centavos enteros; la única conversión está en `lib/money.ts`. La única fórmula del restante está en `lib/totals.ts`.
5. Textos de interfaz y errores en español de México. Código e identificadores en inglés.
6. Al terminar cada tarea: `pnpm typecheck && pnpm test && pnpm build`, y un commit atómico con mensaje semántico.
7. Las tareas con interfaz se verifican en el navegador (escritorio y ancho móvil), no solo con pruebas.
8. Cumplir las salvaguardas S1–S7. Ante duda sobre dinero real, detenerse y preguntar a Valentin.
9. Reportar con honestidad: qué se hizo, qué se verificó y qué quedó sin verificar.

---

## 9. Orden de ejecución sugerido

```
Humano:  H0.1 ─ H0.2 ─ H0.3 ─ H0.4 ─ H0.5 ─ H0.6 ─ H0.7
Agentes: F1.1 ─┬─ F1.2 ∥ F1.3 ∥ F1.4 ─ F1.5
               └────────────────────────┬─ F2.1 ─ F2.3 ─┐
                                        ├─ F2.2 ────────┼─ F2.5 ∥ F2.6 ∥ F2.7 ─ F2.8 ─ [puerta 2]
                                        └─ F2.4 ────────┘
[puerta 2] ─ F3.1 ∥ F3.2 ∥ F3.4 ─ F3.3 ─ H3.5 ─ H3.6 ─ H3.7 ─ F3.8 ─ [puerta 3]
[puerta 3] ─ F4.1 ─ F4.2  ∥  F4.3  ∥  F4.4 ─ [puerta 4] ─ Fase 5
```

Hito mínimo presentable: **puerta 3** (pago real con QR actualizando el tablero). La Fase 4 lo vuelve cómodo y seguro; la Fase 5 lo vuelve entregable.

---

## 10. Bitácora de decisiones y hallazgos

_(Los agentes y Valentin anotan aquí, con fecha, cualquier desviación del plan o respuesta de Pey.)_

- 2026-11-14 — Valentin no registra cuenta bancaria real. La presentación usa la demo local: `PEY_MODE=mock`, sin Pey, sin Supabase y sin dinero. El botón «Simular pago» cubre el guion. La cuenta real y el pago de $0.01 quedan fuera.
- 2026-11-14 — Implementación: la interfaz sigue el prototipo vigente (Inter, índigo, recibo sin anillo). `POST /codi/pn` responde **200**, no 201; el QR sigue en 201. La comparación del webhook se hace en centavos (`Math.round(amount * 100)`) para no fallar por flotantes. Next.js 16 usa `proxy.ts` en lugar de `middleware.ts`. Sin llaves de Supabase y fuera de producción, la app usa memoria local (se pierde al reiniciar) para poder ensayar; en producción las llaves son obligatorias. La cookie del PIN lleva `secure` solo en producción, porque en `http://localhost` el navegador no la guardaría.
- 2026-11-14 — Se agrega `DESIGN.md` y el prototipo `design/prototipo-ui.html`. Cambios de producto derivados del diseño: la caja se diseña primero para teléfono; la propina se elige con chips y empieza en "No"; un solo tema; el botón de pago muestra el monto exacto.
- 2026-11-14 — Versión vigente del prototipo (manda sobre lo anterior): estética de checkout financiero (Inter, tinta azul marino, acento índigo, sombras finas). **Se elimina el anillo.** La tarjeta de arriba es "la cuenta", como un recibo: "Total de la cuenta" en grande, un renglón por pago (nombre en negrita, debajo "Propina $30.00" en gris, monto a la derecha; sin la palabra "pagó", sin signo de menos y **sin líneas divisorias**; sin nombre: "Un comensal") y al final "Restante" centrado en un recuadro índigo suave. Por decisión de Valentin, **el comensal sí ve la propina de cada persona**; ve solo pagos confirmados. La caja ve además la hora y los pagos en espera, y su recuadro dice "Restante en efectivo". Nuevo campo opcional "Tu nombre" al pagar (`payments.payer_name`).
- 2026-11-14 — Rediseño visual (segunda versión, ya reemplazada): el avance de la cuenta es un anillo con una rebanada por pago (`MesaRing`); paleta selva + lima + mango; fuentes Bricolage Grotesque e Instrument Sans (reemplazan a Geist); un solo atajo de monto ("Pagar todo lo que falta"; los de fracciones se descartaron por complicar); el monto que falta va escrito en grande en una tarjeta verde con el anillo al lado. Donde `PLAN.md` mencione Geist o `ProgressBar`, manda `DESIGN.md`.
- 2026-11-14 — Plan creado. Verificado contra `docs.pey.mx/openapi.json` (versión `2026-10-20`). Correcciones C1–C10 aplicadas.
- Pendiente de confirmar con un pago real (F3.8): que `codiQrId` del webhook sea igual al `id` devuelto al crear el QR.
- Pendiente (H0.7): reintentos del webhook, criterios de evaluación, entregables.
