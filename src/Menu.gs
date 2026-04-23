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
 * Opciones predefinidas para UserId (J) — admite texto libre también.
 */
var OPCIONES_USER_ID = [
  'Vendido en Bio Bio', 'Vendido en Friki', 'Vendido en MC',
  'Vendido en Otagamer', 'Vendido en Paño', 'Vendido en Retro',
  'NoFunciona', 'Perdido', 'Permutado', 'Regalado', 'Robado'
];

/**
 * Opciones predefinidas para NombreCliente (K) — admite texto libre también.
 */
var OPCIONES_NOMBRE_CLIENTE = [
  'Vendido en Bio Bio', 'Vendido en Friki', 'Vendido en MataControles',
  'Vendido en Otagamer', 'Vendido en Paño', 'Vendido en Retro',
  'No Funciona', 'Perdido', 'Permutado', 'Regalado', 'Robado'
];

/**
 * Opciones para Estado de Entrega (O).
 * Texto visible → valor guardado en la hoja.
 */
var OPCIONES_ENTREGA = [
  { texto: 'Entregado', valor: '1' },
  { texto: 'Por entregar', valor: '0' }
];

/**
 * Convierte un array de strings en opciones HTML <option>.
 */
function _opcionesHtml(arr, conVacio) {
  var html = conVacio ? '<option value="">-- Seleccionar --</option>' : '';
  arr.forEach(function(v) {
    html += '<option value="' + v + '">' + v + '</option>';
  });
  return html;
}

/**
 * Abre un formulario HTML con todos los campos de la venta.
 * - UserId y NombreCliente: comboBox editable (datalist) que permite texto libre o selección.
 * - Método de Pago: comboBox fijo.
 * - Fecha: selector de fecha nativo con conversión a formato dd/mmm/aa.
 * - Estado Entrega: comboBox con texto "Entregado"/"Por entregar" y valores 1/0.
 *
 * Requisitos: 2.3
 */
function abrirFormularioVenta() {
  var opcionesPago     = _opcionesHtml(METODOS_PAGO, true);
  var opcionesUserId   = OPCIONES_USER_ID.map(function(v) { return '<option value="' + v + '">'; }).join('');
  var opcionesNombre   = OPCIONES_NOMBRE_CLIENTE.map(function(v) { return '<option value="' + v + '">'; }).join('');
  var opcionesEntrega  = OPCIONES_ENTREGA.map(function(o) {
    return '<option value="' + o.valor + '">' + o.texto + '</option>';
  }).join('');

  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:13px;padding:12px 14px;margin:0}' +
    'label{display:block;margin-top:9px;font-weight:bold;font-size:12px}' +
    'input,select{width:100%;padding:5px;box-sizing:border-box;margin-top:3px;font-size:13px}' +
    '.required{color:red}' +
    '.btns{margin-top:14px}' +
    'button{padding:7px 18px;cursor:pointer;border-radius:3px;border:none;font-size:13px}' +
    '#btnOk{background:#4285f4;color:#fff;margin-right:8px}' +
    '#btnCancelar{background:#e0e0e0}' +
    '</style></head><body>' +

    '<label>ID Producto <span class="required">*</span>' +
    '<input id="idProducto" type="text" autofocus></label>' +

    '<label>Usuario Instagram (UserId)' +
    '<input id="userIG" type="text" list="listUserIG" placeholder="Texto libre o seleccionar">' +
    '<datalist id="listUserIG">' + opcionesUserId + '</datalist></label>' +

    '<label>Nombre Cliente' +
    '<input id="nombreCliente" type="text" list="listNombre" placeholder="Texto libre o seleccionar">' +
    '<datalist id="listNombre">' + opcionesNombre + '</datalist></label>' +

    '<label>Método de Pago' +
    '<select id="metodoPago"><option value="">-- Seleccionar --</option>' + opcionesPago + '</select></label>' +

    '<label>Monto Pagado <span class="required">*</span>' +
    '<input id="montoPagado" type="number" min="0" step="any"></label>' +

    '<label>Fecha <span class="required">*</span>' +
    '<input id="fechaInput" type="date">' +
    '<input id="fecha" type="hidden"></label>' +

    '<label>Estado Entrega' +
    '<select id="estadoEntrega"><option value="">-- Seleccionar --</option>' + opcionesEntrega + '</select></label>' +

    '<div class="btns">' +
    '<button id="btnOk" onclick="enviar()">Registrar Venta</button>' +
    '<button id="btnCancelar" onclick="google.script.host.close()">Cancelar</button>' +
    '</div>' +

    '<script>' +
    'var MESES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];' +
    'function fechaAFormato(val){' +
    '  if(!val)return "";' +
    '  var p=val.split("-");' +
    '  var dd=p[2];var mm=MESES[parseInt(p[1],10)-1];var aa=p[0].slice(-2);' +
    '  return dd+"/"+mm+"/"+aa;' +
    '}' +
    'function enviar(){' +
    '  var id=document.getElementById("idProducto").value.trim();' +
    '  if(!id){alert("El ID del Producto es obligatorio.");return;}' +
    '  var monto=document.getElementById("montoPagado").value;' +
    '  if(monto===""||isNaN(parseFloat(monto))){alert("El Monto Pagado es obligatorio y debe ser numérico.");return;}' +
    '  var fechaRaw=document.getElementById("fechaInput").value;' +
    '  if(!fechaRaw){alert("La Fecha es obligatoria.");return;}' +
    '  var fechaFmt=fechaAFormato(fechaRaw);' +
    '  var datos={' +
    '    ID_Producto:id,' +
    '    User_IG:document.getElementById("userIG").value,' +
    '    Nombre_Cliente:document.getElementById("nombreCliente").value,' +
    '    Metodo_Pago:document.getElementById("metodoPago").value,' +
    '    Monto_Pagado:parseFloat(monto),' +
    '    Fecha:fechaFmt,' +
    '    Estado_Entrega:document.getElementById("estadoEntrega").value' +
    '  };' +
    '  document.getElementById("btnOk").disabled=true;' +
    '  document.getElementById("btnOk").textContent="Procesando...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(){google.script.host.close();})' +
    '    .withFailureHandler(function(e){' +
    '      alert("Error: "+e.message);' +
    '      document.getElementById("btnOk").disabled=false;' +
    '      document.getElementById("btnOk").textContent="Registrar Venta";' +
    '    })' +
    '    .procesarVenta(datos);' +
    '}' +
    '</script>' +
    '</body></html>'
  ).setWidth(380).setHeight(500).setTitle('Registrar Venta');

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
