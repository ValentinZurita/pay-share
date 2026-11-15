# Pay Share

Un código QR por mesa para que cada quien pague su parte con CoDi, desde el celular, y la caja vea al momento cuánto falta por cobrar en efectivo.

## Demo, sin banco

No hace falta cuenta bancaria, ni Pey, ni Supabase. Con `PEY_MODE=mock` el botón **Simular pago** marca el cobro. No mueve dinero. Es la forma de presentar el producto.

En esta computadora la app está en [http://127.0.0.1:3001](http://127.0.0.1:3001). El puerto 3000 lo usa otra aplicación. `NEXT_PUBLIC_BASE_URL` tiene que ser esa misma dirección, porque va dentro de los QR de las mesas.

Guion:

1. En la caja, abre la Mesa 4 con $500.
2. En otra pestaña abre `/mesa/4`. Escribe 300, propina 10% y, si quieres, un nombre.
3. Paga, elige el código QR y pulsa **Simular pago**.
4. La caja muestra, sola, $300 pagados, $30 de propina y $200 restantes en efectivo.

Si reinicias el servidor, las mesas se borran: viven en la memoria, no en una base de datos.

Para cobrar de verdad más adelante harían falta Supabase, una cuenta de Pey y una app de banco con CoDi. La cuenta bancaria real de Pey tarda días y no es necesaria para esta demo. Mientras la cuenta receptora sea la de prueba, `DEMO_MODE` se queda en `true`: Pey cobraría $0.01 y ese dinero no regresa.

## Correrlo en otra computadora

En esta máquina ya está corriendo. Estos pasos son para otra.

1. Instala las dependencias:

```bash
pnpm install
```

2. Copia el ejemplo de variables y ábrelo:

```bash
cp .env.example .env.local
```

3. Llena `.env.local`:

| Variable | Dónde la consigues |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La misma pantalla, llave `anon` / public |
| `SUPABASE_SERVICE_ROLE_KEY` | La misma pantalla, llave `service_role`. Es secreta. No la compartas ni la pongas en el navegador |
| `NEXT_PUBLIC_BASE_URL` | La misma dirección que abres en el navegador, sin barra al final |
| `NEXT_PUBLIC_RESTAURANT_NAME` | El nombre que ve el comensal, por ejemplo `La Ceiba` |
| `PEY_MODE` | `mock` para practicar sin banco. `live` cuando ya tengas la llave de Pey |
| `DEMO_MODE` | Déjalo en `true`. Pey cobra $0.01 aunque la cuenta diga $500. **No lo pongas en `false` mientras uses la cuenta de prueba de Pey: ese dinero no regresa** |
| `PEY_API_KEY` | Portal Pey → Developer. Solo hace falta con `PEY_MODE=live` |
| `PEY_WEBHOOK_SECRET` | El secreto `whsec_…` del webhook. Solo servidor |
| `CASHIER_PIN` | Un PIN para la caja. En el sitio publicado es obligatorio |

4. En Supabase, abre **SQL Editor**, pega todo el archivo `supabase/migrations/0001_init.sql` y ejecútalo. Deben aparecer 6 mesas.

5. Arranca:

```bash
pnpm dev
```

Abre `http://localhost:3000`. Entra a la caja, abre una mesa y, en otra pestaña, visita `/mesa/4`.

Si todavía no tienes Supabase, deja esas tres llaves vacías y usa `PEY_MODE=mock`. La app guarda las mesas en la memoria del servidor: sirven para ensayar y **se borran al reiniciar**. En el sitio publicado las llaves son obligatorias.

Con `PEY_MODE=mock` aparece el botón **Simular pago**. No mueve dinero.

## Publicar en Vercel

Opcional. La demo local no lo necesita. Hace falta tu cuenta de GitHub y la de Vercel.

1. Crea un repositorio privado en GitHub y súbelo.
2. En [Vercel](https://vercel.com), importa ese repositorio.
3. En **Settings → Environment Variables** copia todas las variables de `.env.local`.
4. Pon `PEY_MODE=live` y `DEMO_MODE=true`.
5. En el primer despliegue, `NEXT_PUBLIC_BASE_URL` puede quedar con la dirección que te da Vercel, por ejemplo `https://pay-share.vercel.app`.
6. Vuelve a desplegar después de cambiar `NEXT_PUBLIC_BASE_URL`, porque esa dirección va impresa en los QR de las mesas.
7. Define `CASHIER_PIN`. Sin él, la caja publicada no se abre.

## Registrar el webhook de Pey

1. Portal Pey → Developer → el engrane de tu API key.
2. Webhook: `https://TU-SITIO.vercel.app/api/webhooks/pey`
3. Copia el secreto `whsec_…` a `PEY_WEBHOOK_SECRET` en Vercel.
4. Redespliega.

## Probar con $0.01

1. En la caja, abre la Mesa 4 con $500.
2. En el teléfono abre el QR de esa mesa (o entra a `/mesa/4`).
3. Escribe $300, propina $30 y paga desde la app del banco.
4. La caja debe mostrar, sola, pagado $300, propinas $30 y $200 restantes en efectivo.
5. En el portal de Pey, **Webhook Logs** debe decir `200`.

Repite el pago una segunda vez. Un reenvío del mismo aviso no debe sumar el dinero dos veces.

## Antes del demo

- [ ] `DEMO_MODE=true` (sobre todo si la cuenta de Pey es la de prueba)
- [ ] `PEY_MODE=live` en el sitio real y las variables completas en Vercel
- [ ] El webhook responde 200 en un pago de prueba
- [ ] La mesa del demo está cerrada antes de empezar, para abrirla en vivo
- [ ] Celular con batería, datos móviles y CoDi activo
- [ ] Sabes el PIN de la caja
- [ ] Plan B: otro despliegue con `PEY_MODE=mock` y el video del pago real

## Comandos

```bash
pnpm dev        # la app en local
pnpm test       # pruebas
pnpm typecheck  # revisión de tipos
pnpm build      # la misma compilación que usa Vercel
```
