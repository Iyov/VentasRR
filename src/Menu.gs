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
 * Opciones válidas para el método de pago.
 */
var METODOS_PAGO = ['BcoBCI', 'BcoChile', 'BcoEstado', 'Efectivo', 'MercadoPago', 'Pagado', 'SumUp', 'Tenpo'];

/**
 * Abre un formulario HTML con todos los campos de la venta, incluyendo
 * un comboBox para el Método de Pago.
 * Al enviar, construye el objeto DatosVenta y llama a procesarVenta(datos).
 *
 * Requisitos: 2.3
 */
function abrirFormularioVenta() {
  var opcionesPago = METODOS_PAGO.map(function(m) {
    return '<option value="' + m + '">' + m + '</option>';
  }).join('');

  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html>' +
    '<html><head>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:13px;padding:12px;margin:0}' +
    'label{display:block;margin-top:10px;font-weight:bold}' +
    'input,select{width:100%;padding:5px;box-sizing:border-box;margin-top:3px}' +
    '.required{color:red}' +
    'button{margin-top:14px;padding:7px 18px;cursor:pointer}' +
    '#btnOk{background:#4285f4;color:#fff;border:none;border-radius:3px}' +
    '#btnCancelar{background:#e0e0e0;border:none;border-radius:3px;margin-left:8px}' +
    '</style></head><body>' +
    '<label>ID Producto <span class="required">*</span><input id="idProducto" type="text" autofocus></label>' +
    '<label>Usuario Instagram<input id="userIG" type="text"></label>' +
    '<label>Nombre Cliente<input id="nombreCliente" type="text"></label>' +
    '<label>Método de Pago' +
    '<select id="metodoPago"><option value="">-- Seleccionar --</option>' + opcionesPago + '</select></label>' +
    '<label>Monto Pagado <span class="required">*</span><input id="montoPagado" type="number" min="0"></label>' +
    '<label>Fecha <span class="required">*</span><input id="fecha" type="text" placeholder="15/ene/25"></label>' +
    '<label>Estado Entrega<input id="estadoEntrega" type="text"></label>' +
    '<div><button id="btnOk" onclick="enviar()">Registrar Venta</button>' +
    '<button id="btnCancelar" onclick="google.script.host.close()">Cancelar</button></div>' +
    '<script>' +
    'function enviar(){' +
    '  var id=document.getElementById("idProducto").value.trim();' +
    '  if(!id){alert("El ID del Producto es obligatorio.");return;}' +
    '  var monto=document.getElementById("montoPagado").value;' +
    '  if(monto===""||isNaN(parseFloat(monto))){alert("El Monto Pagado es obligatorio y debe ser numérico.");return;}' +
    '  var fecha=document.getElementById("fecha").value.trim();' +
    '  if(!fecha){alert("La Fecha es obligatoria.");return;}' +
    '  var datos={' +
    '    ID_Producto:id,' +
    '    User_IG:document.getElementById("userIG").value,' +
    '    Nombre_Cliente:document.getElementById("nombreCliente").value,' +
    '    Metodo_Pago:document.getElementById("metodoPago").value,' +
    '    Monto_Pagado:parseFloat(monto),' +
    '    Fecha:fecha,' +
    '    Estado_Entrega:document.getElementById("estadoEntrega").value' +
    '  };' +
    '  google.script.run.withSuccessHandler(function(){google.script.host.close();})' +
    '    .withFailureHandler(function(e){alert("Error: "+e.message);})' +
    '    .procesarVenta(datos);' +
    '}' +
    '</script>' +
    '</body></html>'
  ).setWidth(360).setHeight(440).setTitle('Registrar Venta');

  SpreadsheetApp.getUi().showModalDialog(html, 'Registrar Venta');
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
