# Plan de Implementación: Ropavejero.Retro — Automatización de Inventario

## Overview

Implementación de un proyecto Google Apps Script que automatiza el registro de ventas actualizando la Hoja_Ventas, la Hoja_Disponibles y el caption del post de Instagram correspondiente. El sistema se organiza en módulos `.gs` independientes y se despliega con [clasp](https://github.com/google/clasp) para permitir desarrollo local con tests unitarios y de propiedades (Jest + fast-check).

## Tasks

- [x] 1. Configurar estructura del proyecto y entorno de desarrollo
  - Inicializar proyecto con `clasp` y crear el archivo `appsscript.json` con los scopes necesarios (`spreadsheets`, `script.external_request`, `script.scriptapp`).
  - Crear la estructura de carpetas: `src/` para los módulos `.gs` y `tests/` para los tests con Jest + fast-check.
  - Configurar `package.json` con dependencias de desarrollo: `jest`, `fast-check`, `@types/google-apps-script`.
  - Crear los archivos vacíos de módulos: `Menu.gs`, `Credenciales.gs`, `Validacion.gs`, `HojaVentas.gs`, `HojaDisponibles.gs`, `InstagramAPI.gs`, `ProcesarVenta.gs`, `Logger.gs`.
  - _Requisitos: 1, 2, 8_

- [x] 2. Implementar módulo de logging (`Logger.gs`)
  - [x] 2.1 Implementar funciones de logging centralizadas
    - Crear `logInfo(mensaje)`, `logError(mensaje, error)` y `logAdvertencia(mensaje)` usando `console.log`, `console.error` y `Logger.log` de Apps Script.
    - Implementar `logEstadoPasos(paso, completados, noEjecutados)` para registrar el estado de cada paso ante un fallo.
    - _Requisitos: 8.2, 8.4, 9.1, 9.2, 9.3_

  - [ ]* 2.2 Escribir tests unitarios para Logger
    - Verificar que `logError` registra mensaje y stack trace.
    - Verificar que `logEstadoPasos` produce el formato correcto con ✅, ❌ y ⏭️.
    - _Requisitos: 8.2, 9.1, 9.2, 9.3_

- [x] 3. Implementar módulo de validación (`Validacion.gs`)
  - [x] 3.1 Implementar `validarDatosVenta(datos)`
    - Verificar que `ID_Producto` no sea vacío ni nulo; lanzar `Error("ID_Producto es obligatorio")` si falla.
    - Verificar que `Fecha` cumpla el patrón `dd/mmm/aa` (regex: `/^\d{2}\/(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\/\d{2}$/i`); lanzar error con formato esperado si falla.
    - Verificar que `Monto_Pagado` sea un valor numérico; lanzar error descriptivo si falla.
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Escribir test de propiedad P1: Validación rechaza ID_Producto inválido
    - **Propiedad 1: Validación rechaza entradas inválidas**
    - Generar strings vacíos, solo espacios y `null`; verificar que `validarDatosVenta` siempre lanza error y no modifica estado externo.
    - **Valida: Requisitos 3.1, 3.3**

  - [ ]* 3.3 Escribir test de propiedad P2: Validación de formato de fecha
    - **Propiedad 2: Validación de formato de fecha**
    - Generar strings que no cumplan el patrón `dd/mmm/aa`; verificar que `validarDatosVenta` siempre lanza error descriptivo.
    - **Valida: Requisitos 3.2, 3.4**

  - [ ]* 3.4 Escribir tests unitarios para casos borde de validación
    - Verificar rechazo de `Monto_Pagado` no numérico (strings, `null`, `undefined`).
    - Verificar aceptación de datos completamente válidos (sin lanzar error).
    - _Requisitos: 3.5_

- [x] 4. Implementar módulo de credenciales (`Credenciales.gs`)
  - [x] 4.1 Implementar `configurarCredenciales()`
    - Mostrar cuadros de diálogo con `Browser.inputBox` para ingresar `ACCESS_TOKEN` e `IG_BUSINESS_ACCOUNT_ID`.
    - Validar que ninguno sea vacío o nulo; mostrar mensaje de error y cancelar guardado si falla (Requisitos 1.3, 1.4).
    - Persistir con `PropertiesService.getScriptProperties().setProperty(...)`.
    - Mostrar mensaje de confirmación al usuario si el guardado es exitoso (Requisito 1.5).
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Implementar `obtenerCredenciales()`
    - Retornar `{ accessToken, igBusinessAccountId }` desde `PropertiesService`.
    - Retornar `null` para cada campo si no está configurado.
    - _Requisitos: 6.5_

  - [ ]* 4.3 Escribir tests unitarios para credenciales
    - Verificar que `configurarCredenciales` con token vacío no persiste y muestra error.
    - Verificar que `configurarCredenciales` con ID vacío no persiste y muestra error.
    - Verificar que `obtenerCredenciales` retorna `null` cuando no hay valores guardados.
    - _Requisitos: 1.3, 1.4, 6.5_

- [x] 5. Implementar módulo Hoja_Ventas (`HojaVentas.gs`)
  - [x] 5.1 Implementar `buscarYActualizarHojaVentas(idProducto, datos)`
    - Abrir Hoja_Ventas con `SpreadsheetApp.openByUrl(URL_HOJA_VENTAS)` y acceder a la hoja "Ventas".
    - Buscar `idProducto` en la columna B; si no se encuentra, llamar a `logError` con "ID_Producto [valor] no encontrado en Hoja_Ventas" y lanzar error para detener el procesamiento.
    - Si se encuentra, actualizar columnas I–P con los valores de `DatosVenta` según el mapeo del diseño.
    - Registrar en log la fila actualizada y el `ID_Producto`.
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Escribir test de propiedad P3: Actualización de Hoja_Ventas es idempotente en columnas correctas
    - **Propiedad 3: Actualización de Hoja_Ventas es idempotente en columnas correctas**
    - Generar objetos `DatosVenta` aleatorios con `ID_Producto` válido; verificar que columnas I–P contienen exactamente los valores proporcionados y ninguna otra fila/columna fue modificada.
    - **Valida: Requisitos 4.1, 4.2**

  - [ ]* 5.3 Escribir tests unitarios para Hoja_Ventas
    - Verificar comportamiento cuando `ID_Producto` no existe en columna B (log + error).
    - Verificar que el mock de `SpreadsheetApp` recibe los valores correctos en las columnas I–P.
    - _Requisitos: 4.3, 4.4_

- [x] 6. Implementar módulo Hoja_Disponibles (`HojaDisponibles.gs`)
  - [x] 6.1 Implementar `buscarYActualizarHojaDisponibles(idProducto)`
    - Abrir Hoja_Disponibles con `SpreadsheetApp.openByUrl(URL_HOJA_DISPONIBLES)` y acceder a la hoja "Disponibles".
    - Buscar `idProducto` en columna A; si no se encuentra, llamar a `logError` con "ID_Producto [valor] no encontrado en Hoja_Disponibles" y lanzar error.
    - Si se encuentra, escribir `1` en columna H y leer el valor de columna G.
    - Si columna G está vacía o nula, registrar advertencia en log y retornar `null`.
    - Retornar el shortcode (columna G) o `null`.
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Escribir test de propiedad P4: Actualización de Hoja_Disponibles marca correctamente y retorna shortcode
    - **Propiedad 4: Actualización de Hoja_Disponibles marca correctamente y retorna shortcode**
    - Generar IDs y shortcodes alfanuméricos aleatorios; verificar que columna H queda en `1` y el valor retornado es igual al contenido previo de columna G.
    - **Valida: Requisitos 5.1, 5.2, 5.3**

  - [ ]* 6.3 Escribir tests unitarios para Hoja_Disponibles
    - Verificar comportamiento cuando `ID_Producto` no existe (log + error).
    - Verificar retorno de `null` cuando columna G está vacía (log de advertencia, sin error).
    - _Requisitos: 5.4, 5.5_

- [x] 7. Checkpoint — Verificar módulos de hojas de cálculo
  - Asegurarse de que todos los tests de los módulos `Logger`, `Validacion`, `HojaVentas` y `HojaDisponibles` pasan. Consultar al usuario si surgen dudas sobre el mapeo de columnas.

- [x] 8. Implementar módulo Instagram API (`InstagramAPI.gs`)
  - [x] 8.1 Implementar `obtenerMediaObjectId(shortcode, igUserId, accessToken)`
    - Construir petición GET a `https://graph.facebook.com/v25.0/{igUserId}/media?fields=id,shortcode&access_token={accessToken}`.
    - Iterar sobre páginas usando `paging.next` hasta encontrar el shortcode o agotar las páginas (límite máximo de páginas para evitar bucles infinitos).
    - Si la respuesta HTTP no es 200, registrar código y mensaje en log y retornar `null`.
    - Si el shortcode no se encuentra en ninguna página, registrar advertencia en log y retornar `null`.
    - Si `accessToken` es nulo o vacío, registrar error "Access_Token no configurado. Ejecute configurarCredenciales()" y retornar `null`.
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.2 Implementar `obtenerYActualizarCaption(mediaObjectId, idProducto, accessToken)`
    - Realizar GET a `https://graph.facebook.com/v25.0/{mediaObjectId}?fields=caption&access_token={accessToken}` para obtener el caption actual.
    - Localizar la Línea_Disponibilidad con regex: `new RegExp('\\[✅\\](\\s+' + escapeRegex(idProducto) + '\\b.*)', 'g')`.
    - Si la línea no se encuentra, registrar advertencia en log y retornar sin hacer POST.
    - Reemplazar `[✅]` por `[❌]` solo en esa línea y realizar POST a `/{mediaObjectId}` con el caption actualizado.
    - Si el POST retorna error HTTP, registrar código y mensaje en log y lanzar error para notificar al usuario.
    - Si el POST es exitoso (HTTP 200), registrar en log el `mediaObjectId` y el `idProducto`.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 8.3 Escribir test de propiedad P5: Sustitución de Línea_Disponibilidad preserva el resto del caption
    - **Propiedad 5: Sustitución de Línea_Disponibilidad preserva el resto del caption**
    - Generar captions con la Línea_Disponibilidad insertada en posición aleatoria; verificar que solo el ícono `[✅]` de esa línea cambia a `[❌]` y el resto del texto permanece byte a byte idéntico.
    - **Valida: Requisitos 7.2, 7.3**

  - [ ]* 8.4 Escribir tests unitarios para InstagramAPI
    - Verificar comportamiento ante respuesta HTTP 4xx/5xx en `obtenerMediaObjectId` (log + retorna `null`).
    - Verificar comportamiento ante respuesta HTTP 4xx/5xx en `obtenerYActualizarCaption` (log + lanza error).
    - Verificar que si `accessToken` es nulo, `obtenerMediaObjectId` registra el error correcto y retorna `null`.
    - Verificar que si la Línea_Disponibilidad no existe en el caption, no se realiza el POST.
    - _Requisitos: 6.3, 6.4, 6.5, 7.6, 7.7_

- [x] 9. Implementar orquestador principal (`ProcesarVenta.gs`)
  - [x] 9.1 Implementar `procesarVenta(datos)`
    - Envolver toda la lógica en `try/catch` para capturar excepciones no controladas.
    - Registrar en log el inicio de la ejecución con `ID_Producto` y marca de tiempo.
    - Llamar a `validarDatosVenta(datos)` — si lanza error, propagar.
    - Llamar a `buscarYActualizarHojaVentas(datos.ID_Producto, datos)` — si falla, registrar estado de pasos (Disponibles e Instagram como NO EJECUTADOS) y relanzar.
    - Llamar a `buscarYActualizarHojaDisponibles(datos.ID_Producto)` — si falla, registrar estado de pasos (Ventas como COMPLETADO, Instagram como NO EJECUTADO) y relanzar.
    - Si el shortcode retornado no es `null`, obtener credenciales, llamar a `obtenerMediaObjectId` y luego a `obtenerYActualizarCaption`.
    - Si el shortcode es `null`, continuar sin actualizar Instagram.
    - Registrar en log la finalización exitosa con `ID_Producto` y marca de tiempo.
    - Mostrar mensaje de confirmación al usuario (Requisito 9.4).
    - En el bloque `catch`, registrar con `console.error` el mensaje y stack trace, y mostrar mensaje de error legible al usuario.
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 9.2 Escribir test de propiedad P6: Proceso secuencial registra estado de pasos ante fallo
    - **Propiedad 6: Proceso secuencial registra estado de pasos ante fallo**
    - Simular fallos en cada uno de los 3 pasos mediante inyección de errores en mocks; verificar que el log contiene el estado explícito de cada paso (COMPLETADO / FALLIDO / NO EJECUTADO).
    - **Valida: Requisitos 9.1, 9.2, 9.3**

  - [ ]* 9.3 Escribir tests unitarios para el orquestador
    - Verificar que un fallo en paso 1 (Hoja_Ventas) registra Disponibles e Instagram como NO EJECUTADOS.
    - Verificar que un fallo en paso 2 (Hoja_Disponibles) registra Ventas como COMPLETADO e Instagram como NO EJECUTADO.
    - Verificar que un fallo en paso 3 (Instagram) registra Ventas y Disponibles como COMPLETADOS.
    - Verificar que con shortcode `null` el flujo termina exitosamente sin llamar a la API de Instagram.
    - _Requisitos: 9.1, 9.2, 9.3_

- [x] 10. Implementar menú personalizado y formulario (`Menu.gs`)
  - [x] 10.1 Implementar `onOpen()`
    - Crear el Menú_Personalizado "Ropavejero.Retro" con las opciones "Registrar Venta", "Configurar Credenciales" y "Ver Logs" usando `SpreadsheetApp.getUi().createMenu(...)`.
    - _Requisitos: 2.1, 2.2_

  - [x] 10.2 Implementar función de apertura del formulario de venta
    - Crear un `HtmlService` o `Browser.inputBox` en secuencia para recopilar los campos de `DatosVenta` (ID_Producto, User_IG, Nombre_Cliente, Metodo_Pago, Monto_Pagado, Fecha, Estado_Entrega).
    - Construir el objeto `DatosVenta` y llamar a `procesarVenta(datos)`.
    - _Requisitos: 2.3_

  - [x] 10.3 Implementar `verLogs()`
    - Mostrar los últimos registros en un cuadro de diálogo usando `SpreadsheetApp.getUi().alert(...)` o abrir el visor de logs de Apps Script.
    - _Requisitos: 2.4 (opción "Ver Logs"), 8.5_

  - [x]* 10.4 Escribir tests unitarios para el menú
    - Verificar que `onOpen` llama a `createMenu` con el nombre correcto y las tres opciones requeridas.
    - _Requisitos: 2.1, 2.2_

- [x] 11. Checkpoint — Verificar integración completa
  - Asegurarse de que todos los tests unitarios y de propiedades pasan (`npm test`). Consultar al usuario si surgen dudas sobre el comportamiento esperado del formulario o el menú.

- [x] 12. Agregar documentación de configuración (Requisito 10)
  - [x] 12.1 Crear o actualizar el archivo `README.md` del proyecto
    - Incluir los pasos para crear la Facebook App en Meta for Developers con permisos `instagram_basic` e `instagram_content_publish`.
    - Incluir el procedimiento para generar un Long-Lived Access Token.
    - Incluir el procedimiento para obtener el `IG_Business_Account_ID`.
    - Incluir la advertencia sobre la revisión de Meta para `instagram_content_publish` en producción.
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [x] 13. Checkpoint final — Verificar todos los tests y documentación
  - Ejecutar `npm test` y confirmar que todos los tests pasan. Revisar que el README incluye todas las secciones de configuración requeridas. Consultar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- El lenguaje de implementación es **JavaScript (Google Apps Script)**, con desarrollo local via `clasp` y tests con **Jest + fast-check**.
- Cada tarea referencia requisitos específicos para trazabilidad completa.
- Los tests de propiedades deben ejecutarse con mínimo 100 iteraciones cada uno.
- Los mocks de `SpreadsheetApp`, `UrlFetchApp` y `PropertiesService` son necesarios para todos los tests unitarios y de propiedades.
- El tag de cada test de propiedad debe seguir el formato: `// Feature: ropavejero-retro-automation, Property {N}: {texto de la propiedad}`.
