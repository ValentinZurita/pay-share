# DESIGN — Guía de interfaz de Pay Share

> Complemento de `PLAN.md`. Todo agente que toque interfaz (tareas F2.5–F2.8, F4.1–F4.4) lee este documento antes de escribir código.
> Referencia visual navegable: `design/prototipo-ui.html` (abrir en el navegador).
>
> **AVISO (2026-11-14): el estilo visual está en revisión.** El prototipo ya va en su cuarta versión (estética de checkout financiero: fondo gris azulado, superficies blancas con sombra fina, tinta azul marino, acento índigo, Inter, radios de 8–12 px, etiquetas de estado). Las secciones 2 y 3 y los detalles visuales de las secciones 4 y 5 de este documento todavía describen la versión anterior (verde selva y lima). Además, **el anillo se eliminó**: la tarjeta de arriba ahora es "la cuenta", como un recibo (Total de la cuenta en grande → un renglón por pago con el nombre de quien pagó → Restante), y el formulario de pago tiene un campo opcional "Tu nombre". Donde este documento mencione `MesaRing`, `Hero` con anillo o "Falta por pagar", ya no aplica. **Hasta que se sincronicen, en lo visual manda el prototipo** (sus variables CSS en `:root` son los tokens vigentes). Siguen vigentes sin cambios: los principios (§1), la estructura y el contenido de cada pantalla (§4 y §5), los textos (§6), las reglas móviles (§7), accesibilidad (§8), lo que no entra (§9) y la lista de verificación (§10).

---

## 1. Qué debe sentir la persona

Alguien en una mesa, con el teléfono en una mano, a punto de mover dinero en una página que nunca había visto. Tiene que entender en tres segundos cuánto falta, cuánto pone y qué botón tocar, y sentir que nada raro va a pasar.

Seis principios, en orden de prioridad:

1. **Un número manda, y el anillo lo acompaña.** Arriba va una tarjeta verde con lo que falta por pagar (comensal) o por cobrar en efectivo (caja) escrito en grande, con su etiqueta y el total de la cuenta debajo. A su lado, el anillo de la mesa: la firma visual de la app, con una rebanada por cada pago. El anillo nunca sustituye al número. La rebanada del comensal aparece **mientras escribe**, antes de pagar.
2. **Una sola acción principal por pantalla.** En lima, de ancho completo, fija abajo, al alcance del pulgar.
3. **Sin sorpresas con el dinero.** El botón dice el monto exacto (`Pagar $330.00`). Nunca se agrega dinero que la persona no eligió: la propina empieza en "No".
4. **Siempre se sabe qué está pasando.** Esperando, recibido o falló, con palabras simples y visibles.
5. **Solo lo indispensable.** Si un elemento no ayuda a pagar o a cobrar, no entra. Sin menús, sin pie de página, sin banners, sin ilustraciones decorativas.
6. **Lo que no se puede deshacer se confirma.** Cerrar una mesa pide un segundo toque.

Qué transmite seguridad (y hay que conservar): el nombre del restaurante y de la mesa siempre visibles; montos consistentes en todas las pantallas; el candado con "Pagas desde la app de tu banco. Sin comisión."; explicar para qué se pide el celular; lenguaje llano sin tecnicismos; nada de urgencia artificial.

---

## 2. Fundamentos visuales

### Color

Un solo tema claro para el MVP (el QR necesita fondo blanco y la consistencia importa más que el modo oscuro). Declarar `color-scheme: light`.

| Token | Valor | Uso |
|---|---|---|
| `--forest` (Selva) | `#0A3A2A` | Bloque superior con el anillo; pantalla de pago recibido |
| `--forest-2` | `#12503B` | Superficies elevadas sobre selva (insignia de mesa, botón redondo, resumen) |
| `--on-forest` | `#F3F8F2` | Texto sobre selva |
| `--on-forest-muted` | `#A9C4B8` | Texto secundario sobre selva |
| `--track` | `rgba(255,255,255,.16)` | Pista vacía del anillo sobre selva |
| `--lime` (Lima) | `#C9F158` | Acción principal; rebanadas pagadas del anillo; palomita de confirmación |
| `--lime-press` | `#B6E13C` | Lima presionada / hover |
| `--mango` (Mango) | `#FFB547` | Propina sobre fondo selva |
| `--tip-ink` | `#8A5300` | Propina sobre fondo claro |
| `--ink` (Tinta) | `#0D1512` | Texto, montos, opción seleccionada, botón oscuro |
| `--muted` | `#5F6B66` | Texto secundario, etiquetas |
| `--bg` (Niebla) | `#F1F4F0` | Fondo de la app |
| `--surface` | `#FFFFFF` | Tarjetas, hojas inferiores |
| `--line` | `#DFE5DE` | Divisores, pista del anillo sobre claro |
| `--line-strong` | `#C3CCC4` | Bordes de opciones y campos |
| `--danger` (Chile) | `#C2311F` | **Solo** errores de validación o de sistema |

Reglas: la lima es para **la** acción principal y para dinero que ya entró; siempre con texto en tinta, nunca texto lima sobre blanco (no tiene contraste). Sobre fondo claro, las rebanadas pagadas del anillo van en selva. La selección (chips) es tinta sólida con texto blanco. El rojo nunca se usa en botones (cerrar mesa es un botón oscuro con confirmación). Contraste mínimo AA (4.5:1) para todo texto.

Definir los tokens una sola vez como variables CSS en `app/globals.css` y exponerlos a Tailwind según la versión instalada (en Tailwind 4, con `@theme`). Ningún componente usa colores literales.

### Tipografía

Dos familias de Google Fonts, cargadas con `next/font/google`:

- **Bricolage Grotesque** (`--display`): montos, títulos, botones, nombres de mesa. Es la que da carácter; siempre con `letter-spacing` negativo.
- **Instrument Sans** (`--text`): todo lo demás.

Respaldo: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Montos en listas con `font-variant-numeric: tabular-nums`.

| Rol | Familia · tamaño / peso | Notas |
|---|---|---|
| Monto que escribe el comensal | Display · 52 / 700 | `letter-spacing: -0.04em`; centrado, sin caja |
| Monto de pago recibido | Display · 54 / 700 | Sobre selva |
| Monto principal (Hero) | Display · 42 / 700 | `-0.04em`; baja a 32 con montos largos |
| Porcentaje al centro del anillo | Display · 20 / 700 | |
| Título de estado | Display · 26 / 700 | "Revisa la app de tu banco" |
| Título de hoja | Display · 23 / 700 | Hojas inferiores |
| Monto en tarjeta de mesa | Display · 21 / 700 | |
| Botón | Display · 18 / 600 | |
| Nombre de mesa / sección | Display · 17 / 700 | |
| Texto | Text · 15 / 400 | Base |
| Etiqueta / pregunta | Text · 14.5 / 600 | Color `--muted` |
| Nota de confianza | Text · 12.5 / 400 | Línea del candado |

Ningún campo de texto por debajo de 16 px (evita el zoom automático de iOS).

### Espaciado, forma y profundidad

- Escala de espacios: 4 · 8 · 12 · 16 · 20 · 24 · 32. Margen lateral de pantalla: 20 px (16 px si el ancho es < 380 px).
- Formas muy redondas: botones, chips y campos en píldora (999); tarjetas y filas 20–28; bloque selva con las esquinas inferiores a 34; hojas inferiores 32 arriba.
- Sin sombras, sin degradados, casi sin bordes. La jerarquía se hace con bloques de color (selva arriba, niebla abajo) y tarjetas blancas sin borde. Única excepción: el velo oscuro detrás de una hoja inferior (`rgba(13,21,18,.5)`).
- Iconos: de trazo (2 px), 22 px, color heredado. Usar los menos posibles: atrás, candado, palomita, teléfono, QR, flecha. Sin emojis.

### Movimiento

- Curva única: `cubic-bezier(.2,.8,.2,1)`. Duraciones: 150 ms (color, borde), 250 ms (hojas, entradas), 500 ms (barra de progreso).
- **Anillo:** cada rebanada crece desde cero con una transición de 600 ms sobre `stroke-dasharray`. La rebanada del comensal sigue lo que escribe, tecla a tecla.
- Hoja inferior: sube desde abajo (320 ms) con el velo apareciendo. Pago recibido: la pantalla pasa a selva y la palomita lima rebota una vez (500 ms). Pago nuevo en caja: la fila aparece en lima y se desvanece a blanco (2 s).
- Botones y tarjetas: `scale(.97)` al presionar.
- Nada se mueve en bucle salvo el indicador de espera. Respetar `prefers-reduced-motion: reduce` (sin animaciones).
- Cuando un monto cambia en vivo, cambia el número y la barra de progreso; no hay parpadeos ni avisos emergentes.

---

## 3. Componentes

Viven en `components/ui/`. Son pocos a propósito; no crear variantes que no se usen.

| Componente | Especificación |
|---|---|
| **MesaRing** | La firma. SVG: una pista circular y un arco por cada pago (`stroke-dasharray`), con separación de 5 px entre rebanadas y extremos rectos. Tamaño normal 100 px / trazo 13 (sobre selva: pagado en lima, la rebanada del comensal en blanco); al centro, el porcentaje pagado ("60%" + "pagado"). Tamaño mini 36 px / trazo 6 (sobre blanco: pagado en selva, pista `--line`), sin texto. Lleva texto alternativo ("$300.00 pagado de $500.00") |
| **Hero** | Tarjeta selva de radio 30, dentro del contenido (no pegada a los bordes), relleno 22/20. Dos columnas: a la izquierda etiqueta ("Falta por pagar"), monto en display 42 (32 si pasa de 9 caracteres) y "Total de la cuenta **$500.00**"; a la derecha el `MesaRing`. Arriba de la tarjeta, sobre fondo claro, va el encabezado: "Mesa 4" en display 24 y el nombre del restaurante |
| **Button** | Píldora, alto 58, ancho completo, fuente display. Variantes: `primary` (lima, texto tinta; lleva flecha a la derecha en "Pagar"), `dark` (tinta, texto blanco; "Cerrar mesa"), `outline` (borde tinta), `quiet` (solo texto gris, alto 44; "Cancelar"). Deshabilitado: fondo `--line`, texto `--muted`. Con carga: indicador + texto, y bloqueado para evitar doble envío |
| **BigAmount** | Monto centrado sin caja: `$` gris de 30 + número display 52/700 que crece con lo que se escribe (`width` en `ch`). Con error, el número pasa a rojo y el mensaje va debajo con `role="alert"`. `inputmode="decimal"`, `autocomplete="off"`, `enterkeyhint="done"` |
| **Pills** | Píldoras de alto 42, borde 1.5 px. Seleccionada: fondo tinta, texto blanco. Son botones con `aria-pressed`. Se usan para atajos de monto y para propina |
| **Card / lista** | Fondo blanco, sin borde, radio 20–28. Filas de pago: círculo de 36 (lima con palomita si pagado; gris con indicador si espera) + monto display + línea secundaria + hora |
| **StatusPill** | Píldora blanca con indicador giratorio + texto ("Esperando tu pago · vence en 14:32"), con `role="status"` |
| **BottomSheet** | Sube desde abajo, radio 32 arriba, asa gris, velo detrás. Opciones como filas grandes sobre niebla con icono lima en círculo selva. Se cierra con el velo, "Cancelar" o `Esc`. Atrapa el foco y lo devuelve al cerrar. En escritorio (≥ 768 px), diálogo centrado de 420 px |
| **TopBar clara** | Para pantallas sin hero (QR, cobro enviado): botón redondo blanco de volver de 40 + título display y subtítulo |
| **ActionBar** | Fija abajo sobre niebla, sin borde, relleno `10 20 18` + `env(safe-area-inset-bottom)`. Contiene el botón principal y, en el comensal, la línea del candado |
| **StateScreen** | Centro de pantalla: círculo blanco de 76 con icono selva, título display 26, una línea de explicación |

Reglas comunes: zona táctil mínima 44×44; foco visible (contorno azul de 2 px, separado 2 px); todos los campos con `<label>`.

---

## 4. Pantallas del comensal (`/mesa/[id]`)

Pensada para teléfono. En pantallas anchas, el mismo diseño centrado en una columna de **440 px** máximo; no se reorganiza.

Estructura fija: `TopBar` → contenido con desplazamiento → `ActionBar`. Altura con `100dvh` para que la barra de acción no quede bajo la barra del navegador.

### 4.1 Pagar (pantalla inicial)

1. **Encabezado y Hero:** "Mesa 4" + restaurante, y debajo la tarjeta selva: "Falta por pagar" → monto grande → "Total de la cuenta $500.00", con el `MesaRing` a la derecha (una rebanada lima por cada pago ya hecho). Se actualiza en vivo.
2. **¿Cuánto pagas tú?** `BigAmount` vacío con marcador `0`. Al escribir, la rebanada blanca crece en el anillo y aparece debajo una línea gris: "Después de tu pago faltarán $200.00."
3. **Un solo atajo:** enlace "Pagar todo lo que falta", que llena el campo. Sin atajos de fracciones (se probaron y complicaban la pantalla).
4. **Propina:** píldoras `No · 10% · 15% · 20% · Otra`. Empieza en **No**. Los porcentajes se calculan sobre "tu parte"; el monto resultante se muestra a la derecha de la etiqueta ("+ $30.00"). "Otra" despliega un campo en píldora.
5. **ActionBar:** botón lima `Pagar $330.00 →` (suma en vivo). Deshabilitado y con texto "Pagar" mientras el monto no sea válido. Debajo: candado + "Pagas desde la app de tu banco. Sin comisión."

Validación en vivo, sin esperar al botón: si la parte supera lo que falta → el número pasa a rojo y aparece "Solo faltan $200.00."

### 4.2 Elegir cómo pagar (hoja inferior)

Título "¿Cómo quieres pagar?" y dos filas grandes, cada una con icono, nombre y una línea:

- **Cobro a mi celular** — "Te llega a la app de tu banco". Va primero: es lo más cómodo en el propio teléfono.
- **Código QR** — "Para guardarlo o escanearlo".

Mientras el cobro al celular no exista (antes de F4.2), **no se muestra esta hoja**: el botón Pagar lleva directo al QR.

Si elige celular: segunda hoja "¿A qué celular enviamos el cobro?" con la explicación "El que tienes registrado en tu banco. Solo lo usamos para este cobro y no lo guardamos.", campo numérico de 10 dígitos (`inputmode="numeric"`, `autocomplete="tel-national"`) y botón `Enviar cobro de $330.00`.

### 4.3 Código QR

- TopBar con flecha (vuelve a 4.1 y descarta el cobro pendiente), título `Pagar $330.00`, subtítulo "Mesa 4 · cuenta 12".
- QR sobre tarjeta blanca, mínimo 188 px de lado, con margen blanco alrededor.
- `StatusPill`: "Esperando tu pago · vence en 14:32" (cuenta regresiva real).
- Tres pasos numerados: "Guarda el código en tus fotos" · "Abre la app de tu banco y entra a CoDi" · "Elige leer el código desde una imagen".
- ActionBar: `Guardar código` (al terminar cambia a "Guardado en tus fotos" con palomita). Si el navegador permite compartir archivos, un botón secundario `Compartir`.
- Si vence: el QR se atenúa, el estado dice "Este código venció" y el botón principal pasa a `Generar otro código`.

### 4.4 Cobro enviado al celular

`StateScreen` con icono de teléfono: "Revisa la app de tu banco" / "Te enviamos un cobro por $330.00 al celular terminado en 4567." + `StatusPill` "Esperando tu pago". ActionBar con botón secundario `Mejor usar código QR`.

### 4.5 Pago recibido

Pantalla completa en selva: círculo lima de 84 con palomita que rebota una vez → "Pago recibido" → monto total en display 54 → resumen (`--forest-2`, radio 24) con tres filas: Tu parte / Propina (en mango) / Falta de la mesa. Abajo, botón lima `Listo` (vuelve a 4.1 con el anillo actualizado).

Esta pantalla debe aparecer sola al volver de la app del banco, sin que la persona toque nada.

### 4.6 Estados sin acción

- **Sin cuenta abierta:** "Esta mesa no tiene cuenta abierta" / "Pídela a tu mesero." Sin botones.
- **Cuenta cubierta:** el anillo completo en lima con "Cubierta" al centro, y debajo "No falta nada por pagar".
- **Cargando:** esqueleto de la tarjeta principal (bloques grises estáticos). Nunca una pantalla en blanco ni un indicador a pantalla completa.
- **Sin conexión o error del servidor:** aviso en línea sobre la barra de acción, "No pudimos conectar. Revisa tu internet e inténtalo de nuevo.", con el botón principal convertido en `Reintentar`. Los datos escritos no se pierden.

---

## 5. Pantallas de la caja (`/caja`)

Se usa tanto en teléfono (mesero) como en tableta o computadora (cajero). **Se diseña primero para teléfono.**

### 5.1 Mesas

- Encabezado: "Caja" en display 28 y, debajo, el nombre del restaurante.
- Cuadrícula de tarjetas de mesa: 2 columnas en teléfono, 3 desde 600 px. Alto mínimo 118, radio 24.
  - **Libre:** sin relleno, borde punteado, nombre + círculo con "+" + "Libre · abrir cuenta" en gris.
  - **Con cuenta:** tarjeta blanca, nombre + `MesaRing` mini arriba; abajo el monto por cobrar en display 21 + "por cobrar". Si está cubierta: "Cubierta" + "lista para cerrar".
- Tocar una mesa libre abre la hoja 5.2; tocar una con cuenta abre 5.3.

### 5.2 Abrir cuenta (hoja inferior)

Título "Abrir cuenta · Mesa 4", `BigAmount` "Total de la cuenta" con el foco puesto al abrir, botón lima `Abrir cuenta`, y "Cancelar". `Enter` envía.

### 5.3 Detalle de mesa

- **Encabezado:** botón redondo de volver + "Mesa 4" y "Cuenta 12".
- **Hero:** "Por cobrar en efectivo" → monto grande (o "Cubierta") → "Total de la cuenta $500.00", con el `MesaRing` a la derecha.
- **Resumen:** tarjeta blanca con dos filas: Pagado por transferencia / **Propinas, aparte** (monto en `--tip-ink`).
- **Pagos:** lista, lo más nuevo arriba. Cada fila: círculo lima con palomita (pagado) o gris con indicador (esperando), monto de la parte, debajo "+ $30.00 de propina" o "Esperando el pago", y la hora a la derecha. Vacía: "Aún no entra ningún pago. Aparecen aquí solos."
- ActionBar: `Cerrar mesa` como botón **oscuro** (no lima: la lima es para cobrar, no para terminar).

### 5.4 Cerrar mesa (hoja inferior)

"¿Cerrar la Mesa 4?" / "Confirma que ya cobraste **$200.00** en efectivo. La mesa quedará libre." Botón `Sí, cerrar mesa` y "Cancelar".

### 5.5 En pantallas anchas (≥ 900 px)

Dos paneles: a la izquierda la cuadrícula de mesas (ancho fijo ~360 px), a la derecha el detalle de la mesa seleccionada (máximo 560 px). No hay flecha de volver; la mesa seleccionada se marca con borde azul. Las hojas inferiores se vuelven diálogos centrados. Mismos componentes, sin diseños distintos.

### 5.6 Otras

- **PIN de caja (`/caja/login`):** una sola tarjeta centrada: nombre del restaurante, campo de PIN (`inputmode="numeric"`, `type="password"`), botón `Entrar`. Error: "PIN incorrecto."
- **QR imprimibles (`/qrs`):** una tarjeta por mesa para recortar: nombre del restaurante, QR grande, "Mesa 4", y la línea "Escanea para pagar tu parte". En impresión: sin navegación, fondo blanco, una tarjeta por página o cuatro por hoja.

---

## 6. Textos

Español de México, de tú, frases cortas. Verbos concretos en los botones. Sin tecnicismos: nunca "webhook", "transacción", "pendiente de confirmación", "referencia".

| Situación | Texto |
|---|---|
| Tarjeta principal (comensal) | Dos renglones con etiquetas paralelas: **Total** (monto mediano) y **Restante** (monto grande) |
| Tarjeta principal (caja) | **Total** y **Restante en efectivo** |
| Vocabulario | Siempre "Total" y "Restante". No usar "Falta por pagar" ni "Por cobrar" en la tarjeta principal |
| Campo de monto | ¿Cuánto pagas tú? |
| Atajo de monto | Pagar todo el restante |
| Botón principal | Pagar $330.00 |
| Línea de confianza | Pagas desde la app de tu banco. Sin comisión. |
| Monto mayor al restante | El restante es $200.00. |
| Monto inválido | Escribe solo el monto, por ejemplo 300. |
| Esperando | Esperando tu pago |
| Confirmación | Pago recibido |
| Código vencido | Este código venció |
| Pey en mantenimiento | El servicio de cobro no está disponible en este momento. Inténtalo en un minuto o paga en efectivo. |
| Cobro al celular falló | No pudimos enviar el cobro a ese número. Revisa que sea el de tu banco o usa el código QR. |
| Sin conexión | No pudimos conectar. Revisa tu internet e inténtalo de nuevo. |
| Propinas en caja | Propinas, aparte |

Formato de dinero: siempre `$1,234.00`, con dos decimales, sin "MXN". Horas en formato de 24 h o el del dispositivo (`es-MX`).

No afirmar nada fiscal sobre las propinas en la interfaz; solo "aparte".

---

## 7. Buenas prácticas móviles (obligatorias)

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; no desactivar el zoom.
- Respetar zonas seguras: `env(safe-area-inset-*)` en la barra superior e inferior.
- Altura con `dvh`, no `vh`.
- La barra de acción debe quedar visible con el teclado abierto; al enfocar un campo, este no queda tapado.
- Teclado correcto en cada campo (`inputmode`), y nunca `type="number"` (flechas y formato inconsistentes).
- Zonas táctiles ≥ 44×44 y separadas al menos 8 px.
- Sin gestos ocultos: todo lo que se puede hacer tiene un botón visible.
- Sin desplazamiento horizontal en ningún ancho desde 320 px.
- Botones con estado de carga y bloqueados durante el envío (evita cobros dobles).
- Al volver de la app del banco (`visibilitychange`), la pantalla se actualiza sola.
- Primera pantalla útil sin esperar JavaScript pesado: el total y lo que falta se renderizan desde el servidor.

## 8. Accesibilidad

- HTML semántico: `button` para acciones, `label` para campos, encabezados en orden, `lang="es-MX"`.
- Cambios de estado de pago anunciados con `role="status"`; errores con `role="alert"`.
- El color nunca es el único indicador: los estados llevan texto.
- Navegable completo con teclado; las hojas atrapan y devuelven el foco.
- Texto escalable: la interfaz no se rompe al 200 % de tamaño de letra.

---

## 9. Lo que no entra

Menús o pestañas de navegación · pie de página · logotipos de terceros o insignias de "pago seguro" inventadas · ilustraciones o fotos decorativas · degradados y sombras · barras de progreso rectas (el avance siempre es el anillo) · azul corporativo o cualquier color fuera de los tokens · avisos emergentes (toasts) · ventanas modales para información que cabe en línea · modo oscuro · selector de idioma · onboarding o tutoriales · campos opcionales (nombre, correo, comentarios) · animaciones en bucle · textos de marketing.

---

## 10. Lista de verificación para tareas de interfaz

Antes de dar por terminada una tarea de UI, el agente confirma en el navegador:

- [ ] Se ve igual que el prototipo en 360 px, 390 px y 430 px de ancho, y no hay desplazamiento horizontal en 320 px.
- [ ] La caja funciona en teléfono y, desde 900 px, en dos paneles.
- [ ] Una sola acción primaria por pantalla, en la barra inferior.
- [ ] El botón de pago muestra el monto exacto y se bloquea mientras envía.
- [ ] Todos los colores salen de los tokens; ningún valor literal en componentes.
- [ ] Estados cubiertos: cargando, vacío, error, esperando, éxito, vencido.
- [ ] Con teclado abierto, el botón principal sigue visible.
- [ ] Navegación completa con teclado y foco visible.
- [ ] Con "reducir movimiento" activado no hay animaciones.
- [ ] Los textos coinciden con la sección 6.
