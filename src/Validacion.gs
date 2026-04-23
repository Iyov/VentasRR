// Módulo: Validacion.gs
// Responsabilidad: Validación de campos de DatosVenta antes del procesamiento.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Opciones válidas para el método de pago.
 * Debe mantenerse sincronizado con METODOS_PAGO en Menu.gs.
 */
var METODOS_PAGO_VALIDOS = ['BcoBCI', 'BcoChile', 'BcoEstado', 'Efectivo', 'MercadoPago', 'Pagado', 'SumUp', 'Tenpo'];

/**
 * Valida los campos obligatorios de un objeto DatosVenta.
 * Lanza un Error descriptivo si algún campo es inválido.
 * El éxito es implícito (no retorna valor).
 *
 * @param {DatosVenta} datos - Objeto con los datos de la venta a validar.
 * @throws {Error} Si ID_Producto es vacío/nulo, Fecha tiene formato inválido,
 *                 o Monto_Pagado no es numérico.
 */
function validarDatosVenta(datos) {
  // Requisito 3.1, 3.3: ID_Producto no debe ser vacío, solo espacios, null o undefined
  if (
    datos.ID_Producto === null ||
    datos.ID_Producto === undefined ||
    String(datos.ID_Producto).trim() === ''
  ) {
    throw new Error('ID_Producto es obligatorio');
  }

  // Requisito 3.2, 3.4: Fecha debe cumplir el patrón dd/mmm/aa
  var FECHA_REGEX = /^\d{2}\/(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\/\d{2}$/i;
  if (!FECHA_REGEX.test(datos.Fecha)) {
    throw new Error('Fecha debe tener formato dd/mmm/aa (ej: 15/ene/25)');
  }

  // Requisito 3.5: Monto_Pagado debe ser un valor numérico
  if (
    datos.Monto_Pagado === null ||
    datos.Monto_Pagado === undefined ||
    typeof datos.Monto_Pagado === 'string' ||
    (typeof datos.Monto_Pagado === 'number' && isNaN(datos.Monto_Pagado))
  ) {
    throw new Error('Monto_Pagado debe ser un valor numérico');
  }

  // Verificación adicional: NaN puede llegar como resultado de operaciones
  if (isNaN(datos.Monto_Pagado)) {
    throw new Error('Monto_Pagado debe ser un valor numérico');
  }

  // Requisito 3: Metodo_Pago debe ser uno de los valores permitidos (si se proporciona)
  if (datos.Metodo_Pago && datos.Metodo_Pago.trim() !== '') {
    if (METODOS_PAGO_VALIDOS.indexOf(datos.Metodo_Pago) === -1) {
      throw new Error(
        'Metodo_Pago inválido. Opciones válidas: ' + METODOS_PAGO_VALIDOS.join(', ')
      );
    }
  }
}

// Exportar para compatibilidad con Jest (entorno Node.js)
if (typeof module !== 'undefined') {
  module.exports = { validarDatosVenta };
}
