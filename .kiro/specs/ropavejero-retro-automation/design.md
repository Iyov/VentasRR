# Documento de Diseño Técnico

## Ropavejero.Retro — Automatización de Inventario y Posts de Instagram

---

## Resumen de Investigación

### Google Apps Script
- `SpreadsheetApp.openByUrl(url)` permite abrir hojas de cálculo externas siempre que el script tenga permiso de acceso (`https://www.googleapis.com/auth/spreadsheets`).
- `PropertiesService.getScriptProperties()` almacena pares clave-valor persistentes a nivel de script, ideales para credenciales.
- `UrlFetchApp.fetch(url, options)` es el mecanismo nativo para llamadas HTTP externas desde Apps Script.
- El evento `onOpen` se dispara automáticamente al abrir el archivo y es el punto de entrada para crear el menú personalizado.

### Instagram Graph API
- **Endpoint de listado de media**: `GET /{ig-user-id}/media?fields=id,shortcode,caption&access_token=...` devuelve los posts del usuario con paginación (cursor-based). El campo `shortcode` está disponible en el objeto IG Media.
- **Endpoint de lectura de media**: `GET /{ig-media-id}?fields=caption&access_token=...` devuelve el caption actual de un post específico.
- **Endpoint de actualización de caption**: `POST /{ig-media-id}?caption=...&access_token=...` actualiza el caption de un post existente. Requiere el permiso `instagram_content_publish`.
- La API usa paginación con cursores (`paging.next`); para encontrar un shortcode específico puede ser necesario iterar varias páginas.
- La versión estable actual es **v25.0** (Graph API). El host es `graph.facebook.com`.
- Permisos requeridos: `instagram_basic` (lectura) e `instagram_content_publish` (escritura de caption). Este último requiere revisión de Meta para cuentas en producción.
- Rate limit: 200 llamadas por hora por usuario.

---

## Overview

El sistema **Ropavejero.Retro Automation** es un proyecto de Google Apps Script que automatiza el flujo de registro de ventas de una tienda de videojuegos retro. Al ingresar un único `ID_Producto`, el sistema:

1. Valida los datos de la venta.
2. Actualiza la fila correspondiente en la **Hoja_Ventas** (historial de ventas).
3. Marca el producto como vendido en la **Hoja_Disponibles** (inventario activo) y extrae el shortcode del post de Instagram.
4. Localiza el post en Instagram mediante la Graph API, obtiene su caption actual, reemplaza `[✅]: DISPONIBLE` por `[❌]: VENDIDO` y publica el caption actualizado.

Todo el proceso se ejecuta desde un menú personalizado dentro de Google Sheets, sin necesidad de abrir el editor de scripts.

### Decisiones de diseño clave

- **Google Apps Script como plataforma**: El sistema vive dentro del ecosistema Google (Sheets + Apps Script), eliminando la necesidad de infraestructura externa. La latencia de `UrlFetchApp` es aceptable para operaciones manuales de registro de ventas.
- **Búsqueda de Media Object ID por iteración de páginas**: La Instagram Graph API no ofrece un endpoint directo de búsqueda por shortcode. El diseño itera sobre `/{ig-user-id}/media` con paginación hasta encontrar el shortcode, con un límite máximo de páginas para evitar bucles infinitos.
- **Proceso secuencial con parada ante error**: Los tres pasos (Hoja_Ventas → Hoja_Disponibles → Instagram) se ejecutan en orden. Un fallo en cualquier paso detiene los siguientes y registra el estado de cada uno, permitiendo corrección manual informada.
- **Instagram como paso opcional**: Si no hay shortcode en la Hoja_Disponibles, o si el Access_Token no está configurado, el sistema omite la actualización de Instagram sin fallar, ya que las hojas de cálculo son la fuente de verdad del inventario.

---

## Arquitectura

```mermaid
graph TD
    A[Google Sheets - onOpen] -->|crea| B[Menú Personalizado]
    B -->|"Registrar Venta"| C[Formulario de Datos_Venta]
    C --> D[procesarVenta(datos)]
    D --> E{Validar datos}
    E -->|inválido| F[Error + Log]
    E -->|válido| G[actualizarHojaVentas]
    G -->|error| H[Log + Detener]
    G -->|ok| I[actualizarHojaDisponibles]
    I -->|error| J[Log + Detener]
    I -->|ok, shortcode| K{¿Shortcode disponible?}
    K -->|no| L[Log advertencia, fin OK]
    K -->|sí| M[obtenerMediaObjectId]
    M -->|error API| N[Log + Detener Instagram]
    M -->|ok| O[obtenerYActualizarCaption]
    O -->|error API| P[Log + Notificar usuario]
    O -->|ok| Q[Log éxito + Mensaje confirmación]

    B -->|"Configurar Credenciales"| R[configurarCredenciales]
    B -->|"Ver Logs"| S[verLogs]

    subgraph "Servicios Externos"
        T[(Hoja_Ventas\nGoogle Sheets)]
        U[(Hoja_Disponibles\nGoogle Sheets)]
        V[Instagram Graph API\ngraph.facebook.com]
    end

    G <--> T
    I <--> U
    M <--> V
    O <--> V
```

### Módulos del sistema

| Módulo | Responsabilidad |
|---|---|
| `Menu.gs` | Creación del menú personalizado (`onOpen`) y apertura del formulario |
| `Credenciales.gs` | Gestión de Access_Token e IG_Business_Account_ID via PropertiesService |
| `Validacion.gs` | Validación de campos de Datos_Venta antes del procesamiento |
| `HojaVentas.gs` | Búsqueda y actualización de filas en Hoja_Ventas |
| `HojaDisponibles.gs` | Búsqueda, actualización y lectura de shortcode en Hoja_Disponibles |
| `InstagramAPI.gs` | Comunicación con Instagram Graph API (obtener media ID, leer y actualizar caption) |
| `ProcesarVenta.gs` | Orquestador principal: llama a los módulos en orden y maneja errores |
| `Logger.gs` | Utilidades de logging centralizadas |

---

## Componentes e Interfaces

### `procesarVenta(datos: DatosVenta): void`

Función principal orquestadora. Envuelve todo en `try/catch`.

```javascript
/**
 * @param {DatosVenta} datos
 * @throws {Error} si la validación falla
 */
function procesarVenta(datos) { ... }
```

### `configurarCredenciales(): void`

Muestra diálogos para ingresar Access_Token e IG_Business_Account_ID y los persiste.

### `validarDatosVenta(datos: DatosVenta): void`

Lanza errores descriptivos si algún campo es inválido. No retorna valor; el éxito es implícito.

### `buscarYActualizarHojaVentas(idProducto: string, datos: DatosVenta): void`

Abre Hoja_Ventas, busca `idProducto` en columna B de la hoja "Ventas", actualiza columnas I–P.

### `buscarYActualizarHojaDisponibles(idProducto: string): string | null`

Abre Hoja_Disponibles, busca `idProducto` en columna A de la hoja "Disponibles", actualiza columna H con `1`, retorna el shortcode de columna G (o `null` si está vacío).

### `obtenerMediaObjectId(shortcode: string, igUserId: string, accessToken: string): string | null`

Itera sobre `GET /{ig-user-id}/media?fields=id,shortcode` con paginación hasta encontrar el shortcode. Retorna el `id` del media o `null` si no se encuentra.

### `obtenerYActualizarCaption(mediaObjectId: string, idProducto: string, accessToken: string): void`

1. `GET /{mediaObjectId}?fields=caption` — obtiene caption actual.
2. Localiza y reemplaza la Línea_Disponibilidad.
3. `POST /{mediaObjectId}` con el caption actualizado.

### `onOpen(): void`

Trigger automático de Google Apps Script. Crea el Menú_Personalizado "Ropavejero.Retro".

---

## Modelos de Datos

### `DatosVenta`

```javascript
/**
 * @typedef {Object} DatosVenta
 * @property {string} ID_Producto   - Identificador único del artículo (obligatorio, no vacío)
 * @property {string} User_IG       - Handle de Instagram del comprador
 * @property {string} Nombre_Cliente - Nombre del comprador
 * @property {string} Metodo_Pago   - Método de pago utilizado
 * @property {number} Monto_Pagado  - Monto pagado (numérico)
 * @property {string} Fecha         - Fecha en formato dd/mmm/aa (ej: 15/ene/25)
 * @property {string} Estado_Entrega - Estado de entrega del artículo
 */
```

### Mapeo de columnas — Hoja_Ventas (hoja "Ventas")

| Campo | Columna | Valor |
|---|---|---|
| ID_Producto | B | (búsqueda) |
| Sold | I | `1` |
| UserId | J | `User_IG` |
| NombreCliente | K | `Nombre_Cliente` |
| Mét Pago | L | `Metodo_Pago` |
| Test | M | `1` |
| Fecha | N | `Fecha` (dd/mmm/aa) |
| Entreg | O | `Estado_Entrega` |
| Pago | P | `Monto_Pagado` |

### Mapeo de columnas — Hoja_Disponibles (hoja "Disponibles")

| Campo | Columna | Operación |
|---|---|---|
| ID_Producto | A | (búsqueda) |
| Shortcode | G | (lectura) |
| Sold | H | Escribir `1` |

### Propiedades del Script (`PropertiesService`)

| Clave | Descripción |
|---|---|
| `ACCESS_TOKEN` | Token de acceso de larga duración de Instagram Graph API |
| `IG_BUSINESS_ACCOUNT_ID` | ID numérico de la cuenta de Instagram Business |

### Formato de Línea_Disponibilidad en Caption

```
{ID_Producto} [✅]: DISPONIBLE   →   {ID_Producto} [❌]: VENDIDO
```

La sustitución se realiza con una expresión regular que localiza la línea exacta:

```javascript
const regex = new RegExp(`(${escapeRegex(idProducto)}\\s*\\[✅\\]:\\s*DISPONIBLE)`, 'g');
caption = caption.replace(regex, `${idProducto} [❌]: VENDIDO`);
```

---

## Manejo de Errores

### Estrategia general

Todos los errores se propagan hacia arriba hasta el bloque `try/catch` de `procesarVenta`. Cada módulo lanza errores descriptivos o registra advertencias según la severidad.

### Tabla de errores y comportamiento

| Condición | Tipo | Comportamiento |
|---|---|---|
| `ID_Producto` vacío/nulo | Error fatal | Lanza `Error("ID_Producto es obligatorio")`, detiene todo |
| `Fecha` con formato inválido | Error fatal | Lanza error con formato esperado, detiene todo |
| `Monto_Pagado` no numérico | Error fatal | Lanza error descriptivo, detiene todo |
| ID no encontrado en Hoja_Ventas | Error fatal | Log + detiene (Disponibles e Instagram no ejecutados) |
| ID no encontrado en Hoja_Disponibles | Error fatal | Log + detiene (Instagram no ejecutado) |
| Shortcode vacío en columna G | Advertencia | Log + omite Instagram, proceso continúa como exitoso |
| Access_Token no configurado | Error de Instagram | Log + omite Instagram, proceso continúa |
| API Instagram HTTP 4xx/5xx | Error de Instagram | Log código + mensaje, notifica al usuario |
| Shortcode no encontrado en API | Advertencia | Log + omite actualización de caption |
| Línea_Disponibilidad no encontrada | Advertencia | Log + omite POST de caption |
| Excepción no controlada | Error fatal | `console.error` con stack trace + mensaje legible al usuario |

### Registro de estado de pasos

Cuando `procesarVenta` falla en un paso intermedio, el log registra explícitamente qué pasos se completaron y cuáles no:

```
[ERROR] procesarVenta(ABC-001): Fallo en paso 2 (Hoja_Disponibles).
  ✅ Paso 1 (Hoja_Ventas): COMPLETADO
  ❌ Paso 2 (Hoja_Disponibles): FALLIDO — [mensaje de error]
  ⏭️ Paso 3 (Instagram): NO EJECUTADO
```

---

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema — esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquinas.*

### Propiedad 1: Validación rechaza entradas inválidas

*Para cualquier* objeto `DatosVenta` donde `ID_Producto` sea una cadena vacía o compuesta únicamente de espacios en blanco, la función `validarDatosVenta` SHALL lanzar un error y el estado del sistema (hojas de cálculo e Instagram) SHALL permanecer sin modificaciones.

**Valida: Requisito 3.1, 3.3**

---

### Propiedad 2: Validación de formato de fecha

*Para cualquier* cadena `Fecha` que no cumpla el patrón `dd/mmm/aa` (donde `mmm` es una abreviatura de mes en español de 3 letras), la función `validarDatosVenta` SHALL lanzar un error descriptivo.

**Valida: Requisito 3.2, 3.4**

---

### Propiedad 3: Actualización de Hoja_Ventas es idempotente en columnas correctas

*Para cualquier* `ID_Producto` válido encontrado en la Hoja_Ventas, después de ejecutar `buscarYActualizarHojaVentas`, las columnas I–P de la fila correspondiente SHALL contener exactamente los valores de `DatosVenta` proporcionados, sin modificar ninguna otra fila ni columna.

**Valida: Requisito 4.1, 4.2**

---

### Propiedad 4: Actualización de Hoja_Disponibles marca correctamente y retorna shortcode

*Para cualquier* `ID_Producto` válido encontrado en la Hoja_Disponibles, después de ejecutar `buscarYActualizarHojaDisponibles`, la columna H de la fila correspondiente SHALL contener `1` y el valor retornado SHALL ser igual al contenido de la columna G de esa misma fila antes de la actualización.

**Valida: Requisito 5.1, 5.2, 5.3**

---

### Propiedad 5: Sustitución de Línea_Disponibilidad preserva el resto del caption

*Para cualquier* caption de Instagram que contenga la Línea_Disponibilidad `{ID_Producto} [✅]: DISPONIBLE`, la función de sustitución SHALL producir un caption donde únicamente esa línea cambia a `{ID_Producto} [❌]: VENDIDO`, y el resto del texto del caption SHALL permanecer byte a byte idéntico.

**Valida: Requisito 7.2, 7.3**

---

### Propiedad 6: Proceso secuencial registra estado de pasos ante fallo

*Para cualquier* ejecución de `procesarVenta` que falle en el paso N (donde N ∈ {1, 2, 3}), el log SHALL contener el estado explícito de cada paso anterior como COMPLETADO y de cada paso posterior como NO EJECUTADO.

**Valida: Requisito 9.1, 9.2, 9.3**

---

## Estrategia de Testing

### Enfoque dual

El sistema combina tests unitarios con ejemplos concretos y tests basados en propiedades para las funciones de lógica pura.

**Tests unitarios** (ejemplos y casos borde):
- Configuración de credenciales con valores válidos e inválidos.
- Creación del menú personalizado.
- Comportamiento ante ID no encontrado en cada hoja.
- Comportamiento ante shortcode vacío.
- Comportamiento ante Access_Token no configurado.
- Respuestas HTTP 4xx y 5xx de la API de Instagram.

**Tests de propiedades** (usando [fast-check](https://github.com/dubzzz/fast-check) si se migra a Node.js/Clasp, o implementación manual de generadores en Apps Script):

> **Nota**: Google Apps Script no tiene un framework de PBT nativo. Para ejecutar tests de propiedades se recomienda usar [clasp](https://github.com/google/clasp) para desarrollar localmente con Node.js y Jest + fast-check, transpilando al entorno de Apps Script para despliegue.

Cada test de propiedad debe ejecutarse con mínimo **100 iteraciones**.

| Propiedad | Test | Generadores |
|---|---|---|
| P1: Validación rechaza entradas inválidas | Generar strings vacíos, solo espacios, null | `fc.string()` filtrado + `fc.constant('')` |
| P2: Validación de formato de fecha | Generar strings con formatos incorrectos | `fc.string()` excluyendo patrón válido |
| P3: Actualización Hoja_Ventas | Generar DatosVenta aleatorios con ID válido | `fc.record({...})` con campos arbitrarios |
| P4: Actualización Hoja_Disponibles | Generar IDs y shortcodes aleatorios | `fc.string()` alfanumérico |
| P5: Sustitución de caption | Generar captions con Línea_Disponibilidad en posición aleatoria | `fc.string()` + inserción de línea en posición aleatoria |
| P6: Registro de estado de pasos | Simular fallos en cada paso | Inyección de errores en mocks |

**Tag format para cada test de propiedad:**
```javascript
// Feature: ropavejero-retro-automation, Property {N}: {texto de la propiedad}
```

### Tests de integración

- Verificar conectividad con Hoja_Ventas y Hoja_Disponibles usando credenciales reales (ejecutar manualmente desde Apps Script).
- Verificar autenticación con Instagram Graph API con un token válido.
- Verificar flujo completo end-to-end con un producto de prueba.

### Estrategia de mocks

Para tests unitarios y de propiedades, los servicios externos se mockean:
- `SpreadsheetApp` → mock que simula `getRange`, `getValues`, `setValue`.
- `UrlFetchApp` → mock que retorna respuestas HTTP configurables.
- `PropertiesService` → mock con un objeto en memoria.

---

## Documentación de Configuración (Requisito 10)

Esta sección forma parte del diseño y debe incluirse en el README del proyecto.

### Paso 1: Crear una Facebook App en Meta for Developers

1. Ir a [Meta for Developers](https://developers.facebook.com/) y crear una nueva app de tipo **Business**.
2. Agregar el producto **Instagram Graph API** a la app.
3. En "Permisos y funciones", solicitar:
   - `instagram_basic` — para leer posts y captions.
   - `instagram_content_publish` — para actualizar captions.

> ⚠️ **Advertencia**: El permiso `instagram_content_publish` requiere **revisión de la aplicación por parte de Meta** antes de poder usarse con cuentas que no sean de prueba. Durante el desarrollo, solo funciona con cuentas de Instagram agregadas como testers de la app.

### Paso 2: Generar un Access Token de larga duración

1. Obtener un **Short-Lived Token** desde el Graph API Explorer o mediante el flujo OAuth.
2. Intercambiarlo por un **Long-Lived Token** (válido ~60 días):
   ```
   GET https://graph.facebook.com/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={short-lived-token}
   ```
3. Guardar el Long-Lived Token en el sistema usando `configurarCredenciales()`.

### Paso 3: Obtener el IG_Business_Account_ID

```
GET https://graph.facebook.com/v25.0/me/accounts?access_token={token}
```
Luego, para cada página retornada:
```
GET https://graph.facebook.com/v25.0/{page-id}?fields=instagram_business_account&access_token={token}
```
El campo `instagram_business_account.id` es el `IG_Business_Account_ID`.

### Paso 4: Configurar el sistema

Desde el Menú_Personalizado en Google Sheets → "Configurar Credenciales", ingresar el Access_Token y el IG_Business_Account_ID obtenidos en los pasos anteriores.
