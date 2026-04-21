// Módulo: Logger.gs
// Responsabilidad: Utilidades de logging centralizadas.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Registra un mensaje informativo usando console.log y Logger.log de Apps Script.
 * @param {string} mensaje - Mensaje a registrar.
 */
function logInfo(mensaje) {
  var texto = '[INFO] ' + mensaje;
  console.log(texto);
  try {
    Logger.log(texto);
  } catch (e) {
    // Logger no disponible fuera de Apps Script (entorno de tests)
  }
}

/**
 * Registra un mensaje de error con stack trace usando console.error y Logger.log.
 * @param {string} mensaje - Mensaje de error a registrar.
 * @param {Error} [error] - Objeto de error opcional (para incluir stack trace).
 */
function logError(mensaje, error) {
  var texto = '[ERROR] ' + mensaje;
  if (error) {
    texto += '\n  Stack: ' + (error.stack || error.toString());
  }
  console.error(texto);
  try {
    Logger.log(texto);
  } catch (e) {
    // Logger no disponible fuera de Apps Script (entorno de tests)
  }
}

/**
 * Registra un mensaje de advertencia usando console.warn y Logger.log.
 * @param {string} mensaje - Mensaje de advertencia a registrar.
 */
function logAdvertencia(mensaje) {
  var texto = '[ADVERTENCIA] ' + mensaje;
  console.warn(texto);
  try {
    Logger.log(texto);
  } catch (e) {
    // Logger no disponible fuera de Apps Script (entorno de tests)
  }
}

/**
 * Registra el estado de cada paso del proceso de venta cuando ocurre un fallo.
 * Usa ✅ para pasos completados, ❌ para el paso fallido y ⏭️ para pasos no ejecutados.
 *
 * Ejemplo de salida:
 *   [ERROR] procesarVenta(ABC-001): Fallo en paso 2 (Hoja_Disponibles).
 *     ✅ Paso 1 (Hoja_Ventas): COMPLETADO
 *     ❌ Paso 2 (Hoja_Disponibles): FALLIDO — [mensaje de error]
 *     ⏭️ Paso 3 (Instagram): NO EJECUTADO
 *
 * @param {number} pasoFallido - Número del paso que falló (1, 2 o 3).
 * @param {string[]} completados - Nombres de los pasos completados exitosamente.
 * @param {string[]} noEjecutados - Nombres de los pasos que no fueron ejecutados.
 * @param {string} idProducto - ID del producto que se estaba procesando.
 * @param {Error} error - Error que causó el fallo.
 */
function logEstadoPasos(pasoFallido, completados, noEjecutados, idProducto, error) {
  var NOMBRES_PASOS = ['Hoja_Ventas', 'Hoja_Disponibles', 'Instagram'];
  var nombrePasoFallido = NOMBRES_PASOS[pasoFallido - 1] || ('Paso ' + pasoFallido);
  var mensajeError = error ? error.message || error.toString() : 'Error desconocido';

  var encabezado = '[ERROR] procesarVenta(' + idProducto + '): Fallo en paso ' + pasoFallido + ' (' + nombrePasoFallido + ').';

  var lineas = [encabezado];

  // Construir líneas de estado para cada uno de los 3 pasos
  for (var i = 1; i <= 3; i++) {
    var nombrePaso = NOMBRES_PASOS[i - 1];
    var lineaPaso;

    if (i === pasoFallido) {
      lineaPaso = '  ❌ Paso ' + i + ' (' + nombrePaso + '): FALLIDO — ' + mensajeError;
    } else if (completados.indexOf(nombrePaso) !== -1) {
      lineaPaso = '  ✅ Paso ' + i + ' (' + nombrePaso + '): COMPLETADO';
    } else if (noEjecutados.indexOf(nombrePaso) !== -1) {
      lineaPaso = '  ⏭️ Paso ' + i + ' (' + nombrePaso + '): NO EJECUTADO';
    } else {
      // Fallback: si el paso es posterior al fallido, marcarlo como no ejecutado
      lineaPaso = '  ⏭️ Paso ' + i + ' (' + nombrePaso + '): NO EJECUTADO';
    }

    lineas.push(lineaPaso);
  }

  var textoCompleto = lineas.join('\n');

  console.error(textoCompleto);
  try {
    Logger.log(textoCompleto);
  } catch (e) {
    // Logger no disponible fuera de Apps Script (entorno de tests)
  }
}

if (typeof module !== 'undefined') {
  module.exports = { logInfo, logError, logAdvertencia, logEstadoPasos };
}
