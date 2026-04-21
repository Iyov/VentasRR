// Módulo: HojaDisponibles.gs
// Responsabilidad: Búsqueda, actualización y lectura de shortcode en Hoja_Disponibles.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

var URL_HOJA_DISPONIBLES = 'https://docs.google.com/spreadsheets/d/18kZ6wyheBWMmoa5yb1PR_XqhqzHCTAlT/';

/**
 * Busca el ID_Producto en la columna A de la hoja "Disponibles", marca la fila
 * como vendida escribiendo `1` en la columna H, y retorna el shortcode de la
 * columna G (o `null` si está vacío).
 *
 * Mapeo de columnas:
 *   A (1) → ID_Producto (búsqueda)
 *   G (7) → Shortcode (lectura)
 *   H (8) → Sold (escribir 1)
 *
 * @param {string} idProducto - ID del producto a buscar en columna A.
 * @returns {string|null} El shortcode del post de Instagram, o `null` si está vacío.
 * @throws {Error} Si el ID_Producto no se encuentra en la hoja.
 */
function buscarYActualizarHojaDisponibles(idProducto) {
  var sheet = SpreadsheetApp.openByUrl(URL_HOJA_DISPONIBLES).getSheetByName('Disponibles');

  // Buscar idProducto en columna A
  var valores = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  var rowIndex = -1;

  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]) === String(idProducto)) {
      rowIndex = i + 1; // getRange usa índices 1-based
      break;
    }
  }

  if (rowIndex === -1) {
    var mensaje = 'ID_Producto ' + idProducto + ' no encontrado en Hoja_Disponibles';
    logError(mensaje);
    throw new Error(mensaje);
  }

  // Marcar como vendido en columna H
  sheet.getRange(rowIndex, 8).setValue(1);

  // Leer shortcode de columna G
  var shortcode = sheet.getRange(rowIndex, 7).getValue();

  if (shortcode === null || shortcode === undefined || shortcode === '') {
    logAdvertencia('ID_Producto ' + idProducto + ': columna G (Shortcode) está vacía. Se omitirá la actualización de Instagram.');
    return null;
  }

  return shortcode;
}

if (typeof module !== 'undefined') {
  module.exports = { buscarYActualizarHojaDisponibles };
}
