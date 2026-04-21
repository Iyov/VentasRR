// Módulo: InstagramAPI.gs
// Responsabilidad: Comunicación con Instagram Graph API (obtener media ID, leer y actualizar caption).
// Proyecto: Ropavejero.Retro — Automatización de Inventario

/**
 * Escapa caracteres especiales de regex en un string.
 * @param {string} string - String a escapar.
 * @returns {string} String con caracteres especiales escapados.
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Obtiene el Media Object ID de un post de Instagram a partir de su shortcode.
 *
 * Itera sobre las páginas de `GET /{igUserId}/media?fields=id,shortcode` hasta
 * encontrar el shortcode o agotar las páginas (máximo 50 páginas).
 *
 * @param {string} shortcode - Shortcode del post de Instagram a buscar.
 * @param {string} igUserId - ID de la cuenta de Instagram Business.
 * @param {string} accessToken - Token de acceso de la Instagram Graph API.
 * @returns {string|null} El `id` del media object, o `null` si no se encuentra.
 */
function obtenerMediaObjectId(shortcode, igUserId, accessToken) {
  // Requisito 6.5: Validar que el accessToken esté configurado
  if (!accessToken) {
    logError('Access_Token no configurado. Ejecute configurarCredenciales()');
    return null;
  }

  var MAX_PAGES = 50;
  var url = 'https://graph.facebook.com/v25.0/' + igUserId + '/media?fields=id,shortcode&access_token=' + accessToken;
  var pagesVisited = 0;

  while (url && pagesVisited < MAX_PAGES) {
    pagesVisited++;

    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var statusCode = response.getResponseCode();

    // Requisito 6.3: Si la respuesta HTTP no es 200, registrar y retornar null
    if (statusCode !== 200) {
      var errorBody;
      try {
        errorBody = JSON.parse(response.getContentText());
      } catch (e) {
        errorBody = { error: { message: response.getContentText() } };
      }
      var errorMessage = (errorBody.error && errorBody.error.message) ? errorBody.error.message : response.getContentText();
      logError('Instagram API error ' + statusCode + ': ' + errorMessage);
      return null;
    }

    var data = JSON.parse(response.getContentText());
    var items = data.data || [];

    // Buscar el shortcode en la página actual
    for (var i = 0; i < items.length; i++) {
      if (items[i].shortcode === shortcode) {
        return items[i].id;
      }
    }

    // Avanzar a la siguiente página si existe
    url = (data.paging && data.paging.next) ? data.paging.next : null;
  }

  // Requisito 6.4: Shortcode no encontrado en ninguna página
  logAdvertencia('Shortcode "' + shortcode + '" no encontrado en ninguna página de la API de Instagram.');
  return null;
}

/**
 * Obtiene el caption actual de un post de Instagram y reemplaza [✅] por [❌]
 * en la línea que contiene el ID_Producto.
 *
 * @param {string} mediaObjectId - ID del media object de Instagram.
 * @param {string} idProducto - ID del producto a marcar como vendido.
 * @param {string} accessToken - Token de acceso de la Instagram Graph API.
 */
function obtenerYActualizarCaption(mediaObjectId, idProducto, accessToken) {
  // Requisito 7.1: GET para obtener el caption actual
  var getUrl = 'https://graph.facebook.com/v25.0/' + mediaObjectId + '?fields=caption&access_token=' + accessToken;
  var getResponse = UrlFetchApp.fetch(getUrl, { muteHttpExceptions: true });
  var getStatus = getResponse.getResponseCode();

  if (getStatus !== 200) {
    var getErrorBody;
    try {
      getErrorBody = JSON.parse(getResponse.getContentText());
    } catch (e) {
      getErrorBody = { error: { message: getResponse.getContentText() } };
    }
    var getErrorMessage = (getErrorBody.error && getErrorBody.error.message) ? getErrorBody.error.message : getResponse.getContentText();
    logError('Instagram API error al obtener caption ' + getStatus + ': ' + getErrorMessage);
    throw new Error('Instagram API error al obtener caption ' + getStatus + ': ' + getErrorMessage);
  }

  var getBody = JSON.parse(getResponse.getContentText());
  var caption = getBody.caption || '';

  // Requisito 7.2: Localizar la Línea_Disponibilidad con regex
  var regex = new RegExp('\\[✅\\](\\s+' + escapeRegex(idProducto) + '\\b.*)', 'g');

  // Requisito 7.6: Si la línea no se encuentra, registrar advertencia y retornar sin POST
  if (!regex.test(caption)) {
    logAdvertencia('Línea de disponibilidad con [✅] para ID_Producto "' + idProducto + '" no encontrada en el caption del post ' + mediaObjectId + '.');
    return;
  }

  // Requisito 7.3: Reemplazar [✅] por [❌] solo en esa línea
  regex.lastIndex = 0; // Resetear el índice del regex después del test()
  var captionActualizado = caption.replace(regex, '[❌]$1');

  // Requisito 7.4: POST con el caption actualizado
  var postUrl = 'https://graph.facebook.com/v25.0/' + mediaObjectId;
  var postResponse = UrlFetchApp.fetch(postUrl, {
    method: 'post',
    payload: {
      caption: captionActualizado,
      access_token: accessToken,
    },
    muteHttpExceptions: true,
  });
  var postStatus = postResponse.getResponseCode();

  // Requisito 7.7: Si el POST retorna error, registrar y lanzar error
  if (postStatus !== 200) {
    var postErrorBody;
    try {
      postErrorBody = JSON.parse(postResponse.getContentText());
    } catch (e) {
      postErrorBody = { error: { message: postResponse.getContentText() } };
    }
    var postErrorMessage = (postErrorBody.error && postErrorBody.error.message) ? postErrorBody.error.message : postResponse.getContentText();
    logError('Instagram API error al actualizar caption ' + postStatus + ': ' + postErrorMessage);
    throw new Error('Instagram API error al actualizar caption ' + postStatus + ': ' + postErrorMessage);
  }

  // Requisito 7.5: Registrar éxito
  logInfo('Caption actualizado exitosamente para mediaObjectId=' + mediaObjectId + ', ID_Producto=' + idProducto);
}

if (typeof module !== 'undefined') {
  module.exports = { obtenerMediaObjectId, obtenerYActualizarCaption, escapeRegex };
}
