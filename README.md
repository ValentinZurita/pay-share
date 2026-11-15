# PayShare

Un QR por mesa para que cada quien pague su parte con CoDi.

## Enlaces

- **App en vivo:** [https://pay-share-one.vercel.app](https://pay-share-one.vercel.app)
- **Caja:** [https://pay-share-one.vercel.app/caja](https://pay-share-one.vercel.app/caja) — PIN de prueba: `977564`
- **Mesa de ejemplo:** [https://pay-share-one.vercel.app/mesa/4](https://pay-share-one.vercel.app/mesa/4)
- _Video demo: enlace en el formulario de entrega_

## El problema

Cuando varios comensales pagan por separado, el restaurante termina revisando transferencias a mano. Las propinas se revuelven con la venta. El cajero no ve al momento cuánto ya se cubrió y cuánto falta en efectivo.

## Cómo funciona

1. El cajero abre la mesa escribiendo solo el total.
2. El comensal escanea el QR fijo de esa mesa.
3. Escribe su parte y la propina.
4. Paga con un Mensaje de Cobro CoDi dinámico.
5. La caja se actualiza sola: muestra lo pagado por transferencia, las propinas aparte y lo que falta en efectivo. El cajero cierra la mesa cuando la cuenta está completa.

## Cómo usa el API de pey

Al pagar, `app/api/pay/route.ts` crea el cobro y `lib/payments/pey.ts` llama a `POST https://api.pey.mx/codi/qr` con el monto, un concepto como `Mesa 4 cuenta 12`, la expiración y `numRef`.

Cuando el pago entra, pey envía el webhook firmado `codi.qr.payment_received` a `app/api/webhooks/pey/route.ts`. La firma se verifica con [Standard Webhooks](https://www.standardwebhooks.com/). El registro es idempotente: un aviso reenviado no cuenta dos veces (`markPaid` solo actualiza el pago si sigue pendiente).

La versión publicada usa el modo de prueba mientras se activa la cuenta CLABE en pey; con `PEY_MODE=live` usa el API real.

## Cómo probarlo

1. Entra a [la caja](https://pay-share-one.vercel.app/caja) con el PIN de prueba `977564`.
2. Abre la Mesa 4 escribiendo solo el total, por ejemplo `$500`.
3. En otra pestaña o en el celular abre [la mesa de ejemplo](https://pay-share-one.vercel.app/mesa/4). Escribe tu parte y la propina, y paga. En la versión publicada, confirma el cobro con el botón de demostración (el sitio corre con `PEY_MODE=mock`).
4. Vuelve a la caja: verás lo pagado, la propina aparte y el restante en efectivo. Si la cuenta está completa, ciérrala con **Cerrar mesa**.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Supabase, Vercel, `qrcode` y `standardwebhooks`.

## Correrlo localmente

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abre `http://localhost:3000`. Si usas Supabase, ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor (crea 6 mesas). Si dejas las llaves de Supabase vacías y usas `PEY_MODE=mock`, las mesas viven en memoria y se borran al reiniciar.

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave `anon` / public |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave `service_role`. Es secreta: no la compartas ni la expongas en el navegador |
| `NEXT_PUBLIC_BASE_URL` | Dirección del sitio, sin barra al final (en local, `http://localhost:3000`) |
| `NEXT_PUBLIC_RESTAURANT_NAME` | Nombre que ve el comensal |
| `PEY_MODE` | `mock` para probar sin banco; `live` para usar el API de pey |
| `DEMO_MODE` | Con `true`, en modo `live` pey cobra $0.01. No lo pongas en `false` mientras uses la cuenta de prueba de pey: ese dinero no se devuelve |
| `PEY_API_KEY` | Portal pey → Developer. Solo hace falta con `PEY_MODE=live`. Es secreta |
| `PEY_WEBHOOK_SECRET` | Secreto `whsec_…` del webhook. Solo servidor; no lo publiques |
| `CASHIER_PIN` | PIN de la caja. En el sitio publicado es obligatorio |

## Componentes de terceros

Next.js, React, TypeScript, Tailwind CSS, `@supabase/supabase-js`, `qrcode`, `standardwebhooks`, `@vercel/blob` y el API de pey. El proyecto se construyó durante el hackathon con ayuda de herramientas de IA (Cursor).
