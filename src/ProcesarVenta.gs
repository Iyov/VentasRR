// Módulo: ProcesarVenta.gs
// Responsabilidad: Orquestador principal — llama a los módulos en orden y maneja errores.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Orquesta el proceso completo de registro de una venta:
 *   1. Valida los datos de entrada.
 *   2. Actualiza la Hoja_Ventas.
 *   3. Actualiza la Hoja_Disponibles y obtiene el shortcode.
 *   4. Si hay shortcode, actualiza el caption del post de Instagram.
 *
 * Envuelve toda la lógica en try/catch para capturar excepciones no controladas.
 * Registra el estado de cada paso ante un fallo para facilitar la corrección manual.
 *
 * @param {DatosVenta} datos - Objeto con los datos de la venta a procesar.
 * @throws {Error} Si la validación falla (el error se propaga después de mostrarlo al usuario).
 *
 * Requisitos: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
 */
function procesarVenta(datos) {
  try {
    // Requisito 8.4: Registrar inicio de ejecución con ID_Producto y timestamp
    logInfo('procesarVenta iniciado — ID_Producto: ' + datos.ID_Producto + ' — ' + new Date().toISOString());

    // Paso 0: Validar datos de entrada (Requisito 3)
    validarDatosVenta(datos);

    // Paso 1: Actualizar Hoja_Ventas (Requisito 4)
    try {
      buscarYActualizarHojaVentas(datos.ID_Producto, datos);
    } catch (error) {
      // Requisito 9.1: Fallo en paso 1 → Disponibles e Instagram NO EJECUTADOS
      logEstadoPasos(1, [], ['Hoja_Disponibles', 'Instagram'], datos.ID_Producto, error);
      throw error;
    }

    // Paso 2: Actualizar Hoja_Disponibles y obtener shortcode (Requisito 5)
    var shortcode;
    try {
      shortcode = buscarYActualizarHojaDisponibles(datos.ID_Producto);
    } catch (error) {
      // Requisito 9.2: Fallo en paso 2 → Ventas COMPLETADO, Instagram NO EJECUTADO
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], datos.ID_Producto, error);
      throw error;
    }

    // Paso 3: Actualizar caption de Instagram si hay shortcode (Requisito 6, 7)
    if (shortcode !== null) {
      try {
        var credenciales = obtenerCredenciales();
        var mediaObjectId = obtenerMediaObjectId(shortcode, credenciales.igBusinessAccountId, credenciales.accessToken);
        if (mediaObjectId !== null) {
          obtenerYActualizarCaption(mediaObjectId, datos.ID_Producto, credenciales.accessToken);
        }
      } catch (error) {
        // Requisito 9.3: Fallo en paso 3 → Ventas y Disponibles COMPLETADOS
        logEstadoPasos(3, ['Hoja_Ventas', 'Hoja_Disponibles'], [], datos.ID_Producto, error);
        throw error;
      }
    }

    // Requisito 8.4: Registrar finalización exitosa con ID_Producto y timestamp
    logInfo('procesarVenta completado exitosamente — ID_Producto: ' + datos.ID_Producto + ' — ' + new Date().toISOString());

    // Requisito 9.4: Mostrar mensaje de confirmación al usuario
    Browser.msgBox('Venta registrada exitosamente. ID_Producto: ' + datos.ID_Producto);

  } catch (error) {
    // Requisito 8.2: Registrar mensaje de error y stack trace
    console.error('[ERROR] procesarVenta — ' + error.message + '\n  Stack: ' + (error.stack || error.toString()));

    // Requisito 8.3: Mostrar mensaje de error legible al usuario
    Browser.msgBox('Error al procesar la venta: ' + error.message);
  }
}

// Exportar para compatibilidad con Jest (entorno Node.js)
if (typeof module !== 'undefined') {
  module.exports = { procesarVenta };
}
