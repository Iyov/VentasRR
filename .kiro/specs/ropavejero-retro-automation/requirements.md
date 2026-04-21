# Documento de Requisitos

## Introducción

Sistema de automatización de inventario para **Ropavejero.Retro**, una tienda de videojuegos retro. El sistema permite registrar una venta ingresando únicamente el ID del producto, actualizando de forma automática y sincronizada dos hojas de cálculo de Google Sheets y el caption del post correspondiente en Instagram, marcando el artículo como vendido en todo el ecosistema digital.

El sistema se implementa como un proyecto de **Google Apps Script** vinculado a los archivos de Google Sheets existentes, e interactúa con la **Instagram Graph API** para mantener los posts actualizados en tiempo real.

---

## Glosario

- **Sistema**: El proyecto de Google Apps Script que implementa la automatización de inventario de Ropavejero.Retro.
- **ID_Producto**: Identificador único alfanumérico de un artículo en el inventario de la tienda.
- **Hoja_Ventas**: Hoja de cálculo de Google Sheets ubicada en `https://docs.google.com/spreadsheets/d/1DbC75pvXfWAWSqLoXMDvgN1CWT1n1xXq/`, que registra el historial de ventas.
- **Hoja_Disponibles**: Hoja de cálculo de Google Sheets ubicada en `https://docs.google.com/spreadsheets/d/18kZ6wyheBWMmoa5yb1PR_XqhqzHCTAlT/`, que lista los productos disponibles para la venta.
- **Shortcode**: Identificador corto de un post de Instagram, extraído de la URL del post (columna G de la Hoja_Disponibles).
- **Media_Object_ID**: Identificador numérico del post de Instagram obtenido a partir del Shortcode mediante la Instagram Graph API.
- **Caption**: Texto descriptivo de un post de Instagram que incluye la línea de disponibilidad del producto.
- **Línea_Disponibilidad**: Línea dentro del Caption que comienza con `[✅]` (disponible) o `[❌]` (vendido) seguido del ID_Producto y el resto de la descripción del artículo. Ejemplo: `[✅] 4091 NBA Live 2005 (CIB) [Xbox] $5K`.
- **Access_Token**: Token de acceso de larga duración para la Instagram Graph API, almacenado en las propiedades del script.
- **IG_Business_Account_ID**: Identificador de la cuenta de Instagram Business, almacenado en las propiedades del script.
- **Configurador**: Función de Google Apps Script que permite al usuario guardar el Access_Token y el IG_Business_Account_ID.
- **Menú_Personalizado**: Menú adicional creado en la interfaz de Google Sheets para ejecutar las funciones del Sistema.
- **Datos_Venta**: Objeto que contiene los campos: `ID_Producto`, `User_IG`, `Nombre_Cliente`, `Metodo_Pago`, `Monto_Pagado`, `Fecha`, `Estado_Entrega`.

---

## Requisitos

### Requisito 1: Configuración inicial del sistema

**User Story:** Como administrador de Ropavejero.Retro, quiero configurar las credenciales de la Instagram Graph API una sola vez, para que el sistema pueda autenticarse en futuras ejecuciones sin requerir intervención manual.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer una función `configurarCredenciales()` que permita al usuario ingresar y guardar el Access_Token y el IG_Business_Account_ID mediante cuadros de diálogo de Google Apps Script.
2. WHEN el usuario ejecuta `configurarCredenciales()`, THE Sistema SHALL almacenar el Access_Token y el IG_Business_Account_ID en las propiedades del script usando `PropertiesService.getScriptProperties()`.
3. WHEN el usuario ejecuta `configurarCredenciales()` con un Access_Token vacío o nulo, THE Sistema SHALL mostrar un mensaje de error indicando que el Access_Token es obligatorio y SHALL cancelar el guardado.
4. WHEN el usuario ejecuta `configurarCredenciales()` con un IG_Business_Account_ID vacío o nulo, THE Sistema SHALL mostrar un mensaje de error indicando que el IG_Business_Account_ID es obligatorio y SHALL cancelar el guardado.
5. WHEN las credenciales son guardadas exitosamente, THE Sistema SHALL mostrar un mensaje de confirmación al usuario.

---

### Requisito 2: Menú personalizado en Google Sheets

**User Story:** Como operador de la tienda, quiero acceder a las funciones del sistema desde un menú en Google Sheets, para no tener que abrir el editor de scripts cada vez que registro una venta.

#### Criterios de Aceptación

1. WHEN Google Sheets carga el archivo, THE Sistema SHALL crear automáticamente un Menú_Personalizado llamado "Ropavejero.Retro" en la barra de menús mediante el evento `onOpen`.
2. THE Menú_Personalizado SHALL contener al menos las opciones: "Registrar Venta", "Configurar Credenciales" y "Ver Logs".
3. WHEN el usuario selecciona "Registrar Venta" desde el Menú_Personalizado, THE Sistema SHALL abrir un formulario o cuadro de diálogo para ingresar los Datos_Venta.
4. WHEN el usuario selecciona "Configurar Credenciales" desde el Menú_Personalizado, THE Sistema SHALL ejecutar la función `configurarCredenciales()`.

---

### Requisito 3: Validación de datos de entrada

**User Story:** Como operador de la tienda, quiero que el sistema valide los datos antes de procesar una venta, para evitar registros incompletos o inconsistentes en el inventario.

#### Criterios de Aceptación

1. WHEN `procesarVenta(datos)` es invocada, THE Sistema SHALL verificar que el campo `ID_Producto` de los Datos_Venta no sea vacío ni nulo.
2. WHEN `procesarVenta(datos)` es invocada, THE Sistema SHALL verificar que el campo `Fecha` tenga formato `dd/mmm/aa` (por ejemplo, `15/ene/25`).
3. WHEN `procesarVenta(datos)` es invocada con un `ID_Producto` vacío o nulo, THE Sistema SHALL lanzar un error descriptivo con el mensaje "ID_Producto es obligatorio" y SHALL detener el procesamiento.
4. WHEN `procesarVenta(datos)` es invocada con una `Fecha` en formato inválido, THE Sistema SHALL lanzar un error descriptivo indicando el formato esperado y SHALL detener el procesamiento.
5. WHEN `procesarVenta(datos)` es invocada con campos `Monto_Pagado` no numérico, THE Sistema SHALL lanzar un error descriptivo indicando que el monto debe ser un valor numérico y SHALL detener el procesamiento.

---

### Requisito 4: Actualización de la Hoja_Ventas

**User Story:** Como operador de la tienda, quiero que al registrar una venta el sistema actualice automáticamente la Hoja_Ventas, para mantener el historial de ventas completo y preciso.

#### Criterios de Aceptación

1. WHEN `procesarVenta(datos)` es invocada con un ID_Producto válido, THE Sistema SHALL buscar el ID_Producto en la columna B de la hoja "Ventas" dentro de la Hoja_Ventas.
2. WHEN el ID_Producto es encontrado en la columna B de la hoja "Ventas", THE Sistema SHALL actualizar las siguientes columnas en la fila correspondiente:
   - Columna I: valor `1` (Sold)
   - Columna J: valor de `User_IG` (UserId)
   - Columna K: valor de `Nombre_Cliente` (NombreCliente)
   - Columna L: valor de `Metodo_Pago` (Mét Pago)
   - Columna M: valor `1` (Test)
   - Columna N: valor de `Fecha` en formato `dd/mmm/aa`
   - Columna O: valor de `Estado_Entrega` (Entreg)
   - Columna P: valor de `Monto_Pagado` (Pago)
3. IF el ID_Producto no es encontrado en la columna B de la hoja "Ventas", THEN THE Sistema SHALL registrar un error en el log con el mensaje "ID_Producto [valor] no encontrado en Hoja_Ventas" y SHALL detener el procesamiento.
4. WHEN la actualización de la Hoja_Ventas es completada exitosamente, THE Sistema SHALL registrar en el log la fila actualizada y el ID_Producto correspondiente.

---

### Requisito 5: Actualización de la Hoja_Disponibles

**User Story:** Como operador de la tienda, quiero que al registrar una venta el sistema marque el producto como vendido en la Hoja_Disponibles y obtenga el shortcode del post de Instagram, para mantener el inventario sincronizado.

#### Criterios de Aceptación

1. WHEN `procesarVenta(datos)` es invocada con un ID_Producto válido, THE Sistema SHALL buscar el ID_Producto en la columna A de la hoja "Disponibles" dentro de la Hoja_Disponibles.
2. WHEN el ID_Producto es encontrado en la columna A de la hoja "Disponibles", THE Sistema SHALL actualizar la columna H de la fila correspondiente con el valor `1` (Sold).
3. WHEN el ID_Producto es encontrado en la columna A de la hoja "Disponibles", THE Sistema SHALL leer el valor de la columna G de la fila correspondiente para obtener el Shortcode del post de Instagram.
4. IF el ID_Producto no es encontrado en la columna A de la hoja "Disponibles", THEN THE Sistema SHALL registrar un error en el log con el mensaje "ID_Producto [valor] no encontrado en Hoja_Disponibles" y SHALL detener el procesamiento.
5. IF el valor de la columna G para el ID_Producto encontrado está vacío o es nulo, THEN THE Sistema SHALL registrar una advertencia en el log indicando que no hay Shortcode disponible y SHALL omitir la actualización de Instagram sin detener el procesamiento.

---

### Requisito 6: Obtención del Media Object ID de Instagram

**User Story:** Como operador de la tienda, quiero que el sistema obtenga automáticamente el identificador del post de Instagram a partir del shortcode, para poder actualizar el caption sin intervención manual.

#### Criterios de Aceptación

1. WHEN el Shortcode de un post es obtenido de la Hoja_Disponibles, THE Sistema SHALL construir una petición GET a la Instagram Graph API usando el endpoint `/{ig-user-id}?fields=media` con el Access_Token almacenado para localizar el Media_Object_ID correspondiente al Shortcode.
2. WHEN la petición a la Instagram Graph API retorna una respuesta exitosa (HTTP 200), THE Sistema SHALL extraer el Media_Object_ID del post cuyo `shortcode` coincida con el Shortcode buscado.
3. IF la petición a la Instagram Graph API retorna un código de error HTTP (4xx o 5xx), THEN THE Sistema SHALL registrar el código de error y el mensaje de respuesta en el log y SHALL detener el procesamiento de la actualización de Instagram.
4. IF el Shortcode no es encontrado entre los posts retornados por la API, THEN THE Sistema SHALL registrar una advertencia en el log indicando que el Shortcode no fue localizado y SHALL omitir la actualización del Caption.
5. IF el Access_Token no está configurado en las propiedades del script, THEN THE Sistema SHALL registrar un error en el log con el mensaje "Access_Token no configurado. Ejecute configurarCredenciales()" y SHALL detener el procesamiento de la actualización de Instagram.

---

### Requisito 7: Obtención y actualización del Caption de Instagram

**User Story:** Como operador de la tienda, quiero que el sistema actualice automáticamente el caption del post de Instagram para reflejar que el producto está vendido, para que los seguidores vean el estado actualizado sin que yo tenga que editar el post manualmente.

#### Criterios de Aceptación

1. WHEN el Media_Object_ID es obtenido, THE Sistema SHALL realizar una petición GET a `/{media-object-id}?fields=caption` de la Instagram Graph API para obtener el Caption actual del post.
2. WHEN el Caption actual es obtenido, THE Sistema SHALL localizar dentro del Caption la Línea_Disponibilidad que comience con `[✅]` seguido del ID_Producto.
3. WHEN la Línea_Disponibilidad es localizada, THE Sistema SHALL reemplazar únicamente el ícono `[✅]` al inicio de esa línea por `[❌]`, manteniendo el resto de la línea y del Caption sin modificaciones.
4. WHEN el Caption modificado está listo, THE Sistema SHALL realizar una petición POST al endpoint `/{media-object-id}` de la Instagram Graph API con el campo `caption` actualizado y el Access_Token.
5. WHEN la petición POST retorna una respuesta exitosa (HTTP 200), THE Sistema SHALL registrar en el log el Media_Object_ID actualizado y el ID_Producto correspondiente.
6. IF la Línea_Disponibilidad con `[✅]` seguido del ID_Producto no es encontrada en el Caption, THEN THE Sistema SHALL registrar una advertencia en el log indicando que la línea de disponibilidad no fue localizada para el ID_Producto y SHALL omitir la petición POST.
7. IF la petición POST a la Instagram Graph API retorna un código de error HTTP (4xx o 5xx), THEN THE Sistema SHALL registrar el código de error y el mensaje de respuesta en el log y SHALL notificar al usuario que la actualización de Instagram falló.

---

### Requisito 8: Manejo de errores y registro de logs

**User Story:** Como administrador del sistema, quiero que todos los errores y eventos importantes queden registrados, para poder diagnosticar problemas y auditar las operaciones realizadas.

#### Criterios de Aceptación

1. THE Sistema SHALL envolver toda la lógica de `procesarVenta(datos)` en un bloque `try/catch` para capturar excepciones no controladas.
2. WHEN una excepción no controlada es capturada, THE Sistema SHALL registrar el mensaje de error y el stack trace en el log usando `console.error()` o `Logger.log()` de Google Apps Script.
3. WHEN una excepción no controlada es capturada, THE Sistema SHALL mostrar al usuario un mensaje de error legible indicando que el proceso falló y el motivo.
4. THE Sistema SHALL registrar en el log el inicio y la finalización exitosa de cada ejecución de `procesarVenta(datos)`, incluyendo el ID_Producto procesado y la marca de tiempo.
5. WHEN el usuario selecciona "Ver Logs" desde el Menú_Personalizado, THE Sistema SHALL abrir el visor de logs de Google Apps Script o mostrar los últimos registros en un cuadro de diálogo.

---

### Requisito 9: Atomicidad del proceso de venta

**User Story:** Como operador de la tienda, quiero que si algún paso del proceso falla, el sistema me informe claramente qué pasos se completaron y cuáles no, para poder corregir manualmente solo lo necesario.

#### Criterios de Aceptación

1. WHEN `procesarVenta(datos)` falla durante la actualización de la Hoja_Ventas, THE Sistema SHALL registrar en el log que los pasos de Hoja_Disponibles e Instagram no fueron ejecutados.
2. WHEN `procesarVenta(datos)` falla durante la actualización de la Hoja_Disponibles, THE Sistema SHALL registrar en el log que la actualización de Hoja_Ventas fue completada y que el paso de Instagram no fue ejecutado.
3. WHEN `procesarVenta(datos)` falla durante la actualización de Instagram, THE Sistema SHALL registrar en el log que las actualizaciones de Hoja_Ventas y Hoja_Disponibles fueron completadas.
4. WHEN `procesarVenta(datos)` completa todos los pasos exitosamente, THE Sistema SHALL mostrar al usuario un mensaje de confirmación indicando que la venta fue registrada y el post de Instagram fue actualizado.

---

### Requisito 10: Instrucciones de configuración de permisos en Meta Console

**User Story:** Como administrador de Ropavejero.Retro, quiero contar con instrucciones claras para configurar los permisos necesarios en Meta for Developers, para poder poner en marcha el sistema sin necesidad de soporte externo.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir en su documentación (comentarios del código o archivo README) los pasos para crear o configurar una Facebook App en Meta for Developers con los permisos `instagram_basic` e `instagram_content_publish`.
2. THE Sistema SHALL incluir en su documentación el procedimiento para generar un Access_Token de larga duración (Long-Lived Token) a partir de un token de corta duración.
3. THE Sistema SHALL incluir en su documentación el procedimiento para obtener el IG_Business_Account_ID de la cuenta de Instagram Business asociada.
4. THE Sistema SHALL incluir en su documentación una advertencia indicando que el permiso `instagram_content_publish` requiere revisión de la aplicación por parte de Meta antes de poder usarse en producción con cuentas que no sean de prueba.
