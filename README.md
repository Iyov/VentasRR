# Ropavejero.Retro — Automatización de Inventario

Sistema de Google Apps Script que automatiza el registro de ventas para **Ropavejero.Retro**, una tienda de videojuegos retro. Al ingresar un único `ID_Producto`, el sistema actualiza de forma sincronizada:

- **Hoja_Ventas** — registra la venta en el historial.
- **Hoja_Disponibles** — marca el producto como vendido en el inventario activo.
- **Caption del post de Instagram** — reemplaza el ícono `[✅]` por `[❌]` en la línea del producto correspondiente.

Todo el proceso se ejecuta desde un menú personalizado dentro de Google Sheets, sin necesidad de abrir el editor de scripts.

---

## Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/)
- [clasp](https://github.com/google/clasp) — CLI de Google Apps Script

```bash
npm install -g @google/clasp
```

---

## Instalación

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Autenticarse con Google:

```bash
clasp login
```

3. Crear archivo `.clasp.json` en la raíz y reemplazar `YOUR_SCRIPT_ID_HERE` con el ID del proyecto de Apps Script [script.google.com] vinculado a la hoja de cálculo:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "src"
}
```

El Script ID se encuentra en el editor de Apps Script bajo **Configuración del proyecto** (ícono de engranaje).

4. Subir el código al proyecto de Apps Script:

```bash
clasp push
```

---

## Ejecutar tests

```bash
npm test
```

Los tests usan [Jest](https://jestjs.io/) con [fast-check](https://github.com/dubzzz/fast-check) para tests basados en propiedades.

---

## Estructura de módulos

| Archivo | Responsabilidad |
|---|---|
| `Menu.gs` | Crea el menú personalizado "Ropavejero.Retro" en Google Sheets mediante el trigger `onOpen`. Contiene el formulario secuencial de ingreso de datos. |
| `Credenciales.gs` | Gestiona el `Access_Token` y el `IG_Business_Account_ID` usando `PropertiesService`. Expone `configurarCredenciales()` y `obtenerCredenciales()`. |
| `Validacion.gs` | Valida los campos de `DatosVenta` antes del procesamiento. Lanza errores descriptivos si `ID_Producto` está vacío, `Fecha` tiene formato inválido o `Monto_Pagado` no es numérico. |
| `HojaVentas.gs` | Busca el `ID_Producto` en la columna B de la hoja "Ventas" y actualiza las columnas I–P con los datos de la venta. |
| `HojaDisponibles.gs` | Busca el `ID_Producto` en la columna A de la hoja "Disponibles", escribe `1` en la columna H (Sold) y retorna el shortcode de la columna G. |
| `InstagramAPI.gs` | Comunica con la Instagram Graph API: itera páginas para encontrar el `Media_Object_ID` por shortcode, obtiene el caption actual y publica el caption actualizado. |
| `ProcesarVenta.gs` | Orquestador principal. Ejecuta los tres pasos en orden (Hoja_Ventas → Hoja_Disponibles → Instagram) y registra el estado de cada paso ante un fallo. |
| `Logger.gs` | Utilidades de logging centralizadas: `logInfo`, `logError`, `logAdvertencia` y `logEstadoPasos`. |

---

## Uso

1. Abrir la hoja de cálculo de Google Sheets vinculada al proyecto.
2. En la barra de menús, hacer clic en **Ropavejero.Retro → Registrar Venta**.
3. Completar los campos del formulario:
   - **ID del Producto** (obligatorio)
   - Usuario de Instagram del comprador (opcional)
   - Nombre del cliente (opcional)
   - Método de pago (opcional)
   - **Monto pagado** (obligatorio, numérico)
   - **Fecha** (obligatorio, formato `dd/mmm/aa`, ej: `15/ene/25`)
   - Estado de entrega (opcional)
4. El sistema actualiza Hoja_Ventas, Hoja_Disponibles y el caption de Instagram de forma automática.
5. Al finalizar, se muestra un mensaje de confirmación. Si ocurre un error, se indica qué pasos se completaron y cuáles no.

---

## Estructura de las hojas de cálculo

### Hoja_Ventas (hoja "Ventas")

| Columna | Campo | Descripción |
|---|---|---|
| B | ID_Producto | Identificador del producto (búsqueda) |
| I | Sold | Se escribe `1` al registrar la venta |
| J | UserId | Handle de Instagram del comprador |
| K | NombreCliente | Nombre del comprador |
| L | Mét Pago | Método de pago |
| M | Test | Se escribe `1` |
| N | Fecha | Fecha en formato `dd/mmm/aa` |
| O | Entreg | Estado de entrega |
| P | Pago | Monto pagado |

### Hoja_Disponibles (hoja "Disponibles")

| Columna | Campo | Descripción |
|---|---|---|
| A | ID_Producto | Identificador del producto (búsqueda) |
| G | Shortcode | Shortcode del post de Instagram (lectura) |
| H | Sold | Se escribe `1` al registrar la venta |

---

## Configuración de la Instagram Graph API (Requisito 10)

Esta sección describe los pasos necesarios para conectar el sistema con la Instagram Graph API.

### Paso 1: Crear una Facebook App en Meta for Developers

1. Ir a [Meta for Developers](https://developers.facebook.com/) y crear una nueva app de tipo **Business**.
2. Agregar el producto **Instagram Graph API** a la app.
3. En "Permisos y funciones", solicitar los siguientes permisos:
   - `instagram_basic` — para leer posts y captions.
   - `instagram_content_publish` — para actualizar captions.

> ⚠️ **Advertencia**: El permiso `instagram_content_publish` requiere **revisión de la aplicación por parte de Meta** antes de poder usarse con cuentas que no sean de prueba. Durante el desarrollo, solo funciona con cuentas de Instagram agregadas como testers de la app en el panel de Meta for Developers.

### Paso 2: Generar un Access Token de larga duración

1. Obtener un **Short-Lived Token** desde el [Graph API Explorer](https://developers.facebook.com/tools/explorer/) o mediante el flujo OAuth de la app.
2. Intercambiarlo por un **Long-Lived Token** (válido aproximadamente 60 días) con la siguiente petición:

```
GET https://graph.facebook.com/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={app-id}
  &client_secret={app-secret}
  &fb_exchange_token={short-lived-token}
```

3. Guardar el Long-Lived Token en el sistema usando `configurarCredenciales()` (ver Paso 4).

### Paso 3: Obtener el IG_Business_Account_ID

Primero, obtener las páginas de Facebook asociadas a la cuenta:

```
GET https://graph.facebook.com/v25.0/me/accounts?access_token={token}
```

Luego, para cada página retornada, obtener la cuenta de Instagram Business vinculada:

```
GET https://graph.facebook.com/v25.0/{page-id}?fields=instagram_business_account&access_token={token}
```

El valor del campo `instagram_business_account.id` en la respuesta es el `IG_Business_Account_ID`.

### Paso 4: Configurar las credenciales en el sistema

1. Abrir la hoja de cálculo de Google Sheets.
2. En la barra de menús, hacer clic en **Ropavejero.Retro → Configurar Credenciales**.
3. Ingresar el **Access Token** obtenido en el Paso 2.
4. Ingresar el **IG_Business_Account_ID** obtenido en el Paso 3.

Las credenciales se almacenan de forma segura en las propiedades del script de Google Apps Script y persisten entre ejecuciones.
