// Módulo: HojaVentas.gs
// Responsabilidad: Búsqueda y actualización de filas en Hoja_Ventas.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

var URL_HOJA_VENTAS = 'https://docs.google.com/spreadsheets/d/1kUTZQhP7A1qsrPtjSDq7p4XCuvBtCu5RW1bQWWYgVQA/';

/**
 * Busca el ID_Producto en la columna B de la hoja "Ventas" y actualiza las
 * columnas I–P con los datos de la venta.
 *
 * Mapeo de columnas:
 *   I (9)  → 1 (Sold)
 *   J (10) → datos.User_IG
 *   K (11) → datos.Nombre_Cliente
 *   L (12) → datos.Metodo_Pago
 *   M (13) → 1 (Test)
 *   N (14) → datos.Fecha (dd/mmm/aa)
 *   O (15) → datos.Estado_Entrega
 *   P (16) → datos.Monto_Pagado
 *
 * @param {string} idProducto - ID del producto a buscar en columna B.
 * @param {DatosVenta} datos  - Objeto con los datos de la venta.
 * @throws {Error} Si el ID_Producto no se encuentra en la hoja.
 */
function buscarYActualizarHojaVentas(idProducto, datos) {
  var sheet = SpreadsheetApp.openByUrl(URL_HOJA_VENTAS).getSheetByName('Ventas');

  // Buscar idProducto en columna B
  var valores = sheet.getRange(1, 2, sheet.getLastRow(), 1).getValues();
  var rowIndex = -1;

  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]) === String(idProducto)) {
      rowIndex = i + 1; // getRange usa índices 1-based
      break;
    }
  }

  if (rowIndex === -1) {
    var mensaje = 'ID_Producto ' + idProducto + ' no encontrado en Hoja_Ventas';
    logError(mensaje);
    throw new Error(mensaje);
  }

  // Actualizar columnas I–P
  sheet.getRange(rowIndex, 9).setValue(1);                    // I: Sold
  sheet.getRange(rowIndex, 10).setValue(datos.User_IG);       // J: UserId
  sheet.getRange(rowIndex, 11).setValue(datos.Nombre_Cliente);// K: NombreCliente
  sheet.getRange(rowIndex, 12).setValue(datos.Metodo_Pago);   // L: Mét Pago
  sheet.getRange(rowIndex, 13).setValue(1);                   // M: Test
  sheet.getRange(rowIndex, 14).setValue(datos.Fecha);         // N: Fecha
  sheet.getRange(rowIndex, 15).setValue(datos.Estado_Entrega);// O: Entreg
  sheet.getRange(rowIndex, 16).setValue(datos.Monto_Pagado);  // P: Pago

  logInfo('HojaVentas actualizada — Fila: ' + rowIndex + ', ID_Producto: ' + idProducto);
}

if (typeof module !== 'undefined') {
  module.exports = { buscarYActualizarHojaVentas };
}
