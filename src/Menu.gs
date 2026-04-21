// Módulo: Menu.gs
// Responsabilidad: Creación del menú personalizado (onOpen) y apertura del formulario de venta.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Trigger automático de Google Apps Script.
 * Crea el Menú_Personalizado "Ropavejero.Retro" en la barra de menús de Google Sheets.
 *
 * Requisitos: 2.1, 2.2
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Ropavejero.Retro')
    .addItem('Registrar Venta', 'abrirFormularioVenta')
    .addItem('Configurar Credenciales', 'configurarCredenciales')
    .addItem('Ver Logs', 'verLogs')
    .addToUi();
}

/**
 * Abre un formulario secuencial de cuadros de diálogo para recopilar los datos de la venta.
 * Si el usuario cancela algún campo obligatorio (ID_Producto, Monto_Pagado, Fecha),
 * muestra un mensaje de error y cancela el proceso.
 * Al completar todos los campos, construye el objeto DatosVenta y llama a procesarVenta(datos).
 *
 * Requisitos: 2.3
 */
function abrirFormularioVenta() {
  var cancelValue = Browser.Buttons.CANCEL;

  // ID_Producto (obligatorio)
  var idProducto = Browser.inputBox('Ingrese el ID del Producto:');
  if (idProducto === cancelValue || idProducto.trim() === '') {
    SpreadsheetApp.getUi().alert('Error: El ID del Producto es obligatorio. Operación cancelada.');
    return;
  }

  // User_IG (opcional)
  var userIG = Browser.inputBox('Ingrese el usuario de Instagram del comprador (opcional):');
  if (userIG === cancelValue) {
    userIG = '';
  }

  // Nombre_Cliente (opcional)
  var nombreCliente = Browser.inputBox('Ingrese el nombre del cliente (opcional):');
  if (nombreCliente === cancelValue) {
    nombreCliente = '';
  }

  // Metodo_Pago (opcional)
  var metodoPago = Browser.inputBox('Ingrese el método de pago (opcional):');
  if (metodoPago === cancelValue) {
    metodoPago = '';
  }

  // Monto_Pagado (obligatorio)
  var montoPagadoStr = Browser.inputBox('Ingrese el monto pagado:');
  if (montoPagadoStr === cancelValue || montoPagadoStr.trim() === '') {
    SpreadsheetApp.getUi().alert('Error: El Monto Pagado es obligatorio. Operación cancelada.');
    return;
  }

  // Fecha (obligatorio)
  var fecha = Browser.inputBox('Ingrese la fecha de la venta (formato dd/mmm/aa, ej: 15/ene/25):');
  if (fecha === cancelValue || fecha.trim() === '') {
    SpreadsheetApp.getUi().alert('Error: La Fecha es obligatoria. Operación cancelada.');
    return;
  }

  // Estado_Entrega (opcional)
  var estadoEntrega = Browser.inputBox('Ingrese el estado de entrega (opcional):');
  if (estadoEntrega === cancelValue) {
    estadoEntrega = '';
  }

  var datos = {
    ID_Producto: idProducto.trim(),
    User_IG: userIG,
    Nombre_Cliente: nombreCliente,
    Metodo_Pago: metodoPago,
    Monto_Pagado: parseFloat(montoPagadoStr),
    Fecha: fecha.trim(),
    Estado_Entrega: estadoEntrega,
  };

  procesarVenta(datos);
}

/**
 * Muestra un mensaje informando al usuario cómo acceder a los logs detallados.
 *
 * Requisitos: 2.4, 8.5
 */
function verLogs() {
  SpreadsheetApp.getUi().alert(
    'Ver Logs: Abra el editor de Apps Script y vaya a Ver > Registros para ver los logs detallados.'
  );
}

// Exportar para compatibilidad con Jest (entorno Node.js)
if (typeof module !== 'undefined') {
  module.exports = { onOpen, abrirFormularioVenta, verLogs };
}
