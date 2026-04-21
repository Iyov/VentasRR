// Módulo: Credenciales.gs
// Responsabilidad: Gestión de Access_Token e IG_Business_Account_ID via PropertiesService.
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Muestra cuadros de diálogo para ingresar el Access Token y el IG Business Account ID,
 * valida que no estén vacíos y los persiste en las propiedades del script.
 *
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5
 */
function configurarCredenciales() {
  // Paso 1: Solicitar ACCESS_TOKEN
  var accessToken = Browser.inputBox('Ingrese el Access Token de Instagram Graph API:');

  // Si el usuario canceló o ingresó vacío/solo espacios
  if (accessToken === Browser.Buttons.CANCEL || !accessToken || !accessToken.trim()) {
    Browser.msgBox('Error: El Access Token es obligatorio.');
    return;
  }

  // Paso 2: Solicitar IG_BUSINESS_ACCOUNT_ID
  var igBusinessAccountId = Browser.inputBox('Ingrese el IG Business Account ID:');

  // Si el usuario canceló o ingresó vacío/solo espacios
  if (igBusinessAccountId === Browser.Buttons.CANCEL || !igBusinessAccountId || !igBusinessAccountId.trim()) {
    Browser.msgBox('Error: El IG Business Account ID es obligatorio.');
    return;
  }

  // Paso 3: Persistir ambos valores
  var props = PropertiesService.getScriptProperties();
  props.setProperty('ACCESS_TOKEN', accessToken);
  props.setProperty('IG_BUSINESS_ACCOUNT_ID', igBusinessAccountId);

  // Paso 4: Confirmar al usuario
  Browser.msgBox('Credenciales guardadas exitosamente.');
}

/**
 * Retorna las credenciales almacenadas en las propiedades del script.
 *
 * @returns {{ accessToken: string|null, igBusinessAccountId: string|null }}
 *
 * Requisitos: 6.5
 */
function obtenerCredenciales() {
  var props = PropertiesService.getScriptProperties();
  return {
    accessToken: props.getProperty('ACCESS_TOKEN') || null,
    igBusinessAccountId: props.getProperty('IG_BUSINESS_ACCOUNT_ID') || null,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { configurarCredenciales, obtenerCredenciales };
}
