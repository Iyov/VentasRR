/**
 * Tests unitarios para Credenciales.gs
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 6.5
 */

const { configurarCredenciales, obtenerCredenciales } = require('../src/Credenciales.gs');

// ─── Helpers / Mocks ─────────────────────────────────────────────────────────

/**
 * Crea un mock de PropertiesService con almacenamiento en memoria.
 * Siempre retorna la misma instancia de scriptProperties para que los spies sean consistentes.
 */
function crearMockPropertiesService() {
  const store = {};
  const scriptProperties = {
    setProperty: jest.fn((key, value) => { store[key] = value; }),
    getProperty: jest.fn((key) => store[key] || null),
    _store: store,
  };
  return {
    getScriptProperties: jest.fn(() => scriptProperties),
    _scriptProperties: scriptProperties,
  };
}

/**
 * Crea un mock de Browser con respuestas configurables.
 * @param {string[]} inputBoxResponses - Respuestas en orden para cada llamada a inputBox.
 */
function crearMockBrowser(inputBoxResponses) {
  let callIndex = 0;
  return {
    inputBox: jest.fn(() => inputBoxResponses[callIndex++] || ''),
    msgBox: jest.fn(),
    Buttons: { CANCEL: 'cancel' },
  };
}

// ─── configurarCredenciales ──────────────────────────────────────────────────

describe('configurarCredenciales', () => {
  let mockBrowser;
  let mockPropertiesService;
  let mockScriptProps;

  beforeEach(() => {
    // Resetear mocks antes de cada test
    mockBrowser = crearMockBrowser([]);
    mockPropertiesService = crearMockPropertiesService();
    mockScriptProps = mockPropertiesService._scriptProperties;

    // Inyectar globales mockeados
    global.Browser = mockBrowser;
    global.PropertiesService = mockPropertiesService;
  });

  afterEach(() => {
    delete global.Browser;
    delete global.PropertiesService;
  });

  // ─── Flujo exitoso ──────────────────────────────────────────────────────────

  it('guarda ACCESS_TOKEN e IG_BUSINESS_ACCOUNT_ID cuando ambos son válidos (Requisito 1.2)', () => {
    mockBrowser = crearMockBrowser(['mi-token-valido', '123456789']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockScriptProps.setProperty).toHaveBeenCalledWith('ACCESS_TOKEN', 'mi-token-valido');
    expect(mockScriptProps.setProperty).toHaveBeenCalledWith('IG_BUSINESS_ACCOUNT_ID', '123456789');
  });

  it('muestra mensaje de confirmación cuando el guardado es exitoso (Requisito 1.5)', () => {
    mockBrowser = crearMockBrowser(['token-ok', 'id-ok']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Credenciales guardadas exitosamente.');
  });

  it('solicita ACCESS_TOKEN con el prompt correcto (Requisito 1.1)', () => {
    mockBrowser = crearMockBrowser(['token', 'id']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.inputBox).toHaveBeenNthCalledWith(
      1,
      'Ingrese el Access Token de Instagram Graph API:'
    );
  });

  it('solicita IG_BUSINESS_ACCOUNT_ID con el prompt correcto (Requisito 1.1)', () => {
    mockBrowser = crearMockBrowser(['token', 'id']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.inputBox).toHaveBeenNthCalledWith(
      2,
      'Ingrese el IG Business Account ID:'
    );
  });

  // ─── ACCESS_TOKEN vacío o cancelado (Requisito 1.3) ─────────────────────────

  it('muestra error y no guarda cuando ACCESS_TOKEN es cadena vacía (Requisito 1.3)', () => {
    mockBrowser = crearMockBrowser(['', '123456789']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El Access Token es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('muestra error y no guarda cuando ACCESS_TOKEN es solo espacios (Requisito 1.3)', () => {
    mockBrowser = crearMockBrowser(['   ', '123456789']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El Access Token es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('muestra error y no guarda cuando el usuario cancela el ACCESS_TOKEN (Requisito 1.3)', () => {
    mockBrowser = crearMockBrowser([mockBrowser.Buttons.CANCEL, '123456789']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El Access Token es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('no solicita IG_BUSINESS_ACCOUNT_ID si ACCESS_TOKEN es inválido (Requisito 1.3)', () => {
    mockBrowser = crearMockBrowser(['', '123456789']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.inputBox).toHaveBeenCalledTimes(1);
  });

  // ─── IG_BUSINESS_ACCOUNT_ID vacío o cancelado (Requisito 1.4) ───────────────

  it('muestra error y no guarda cuando IG_BUSINESS_ACCOUNT_ID es cadena vacía (Requisito 1.4)', () => {
    mockBrowser = crearMockBrowser(['token-valido', '']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El IG Business Account ID es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('muestra error y no guarda cuando IG_BUSINESS_ACCOUNT_ID es solo espacios (Requisito 1.4)', () => {
    mockBrowser = crearMockBrowser(['token-valido', '   ']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El IG Business Account ID es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('muestra error y no guarda cuando el usuario cancela el IG_BUSINESS_ACCOUNT_ID (Requisito 1.4)', () => {
    // Necesitamos acceder al valor de CANCEL después de crear el mock
    const cancelValue = 'cancel';
    mockBrowser = crearMockBrowser(['token-valido', cancelValue]);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).toHaveBeenCalledWith('Error: El IG Business Account ID es obligatorio.');
    expect(mockScriptProps.setProperty).not.toHaveBeenCalled();
  });

  it('no muestra confirmación de éxito cuando IG_BUSINESS_ACCOUNT_ID es inválido (Requisito 1.4)', () => {
    mockBrowser = crearMockBrowser(['token-valido', '']);
    global.Browser = mockBrowser;

    configurarCredenciales();

    expect(mockBrowser.msgBox).not.toHaveBeenCalledWith('Credenciales guardadas exitosamente.');
  });
});

// ─── obtenerCredenciales ─────────────────────────────────────────────────────

describe('obtenerCredenciales', () => {
  let mockPropertiesService;

  beforeEach(() => {
    mockPropertiesService = crearMockPropertiesService();
    global.PropertiesService = mockPropertiesService;
  });

  afterEach(() => {
    delete global.PropertiesService;
  });

  it('retorna null para accessToken cuando no hay valor guardado (Requisito 6.5)', () => {
    const credenciales = obtenerCredenciales();
    expect(credenciales.accessToken).toBeNull();
  });

  it('retorna null para igBusinessAccountId cuando no hay valor guardado (Requisito 6.5)', () => {
    const credenciales = obtenerCredenciales();
    expect(credenciales.igBusinessAccountId).toBeNull();
  });

  it('retorna los valores guardados cuando existen', () => {
    // Guardar valores primero
    global.Browser = crearMockBrowser(['mi-token', 'mi-id']);
    configurarCredenciales();

    const credenciales = obtenerCredenciales();
    expect(credenciales.accessToken).toBe('mi-token');
    expect(credenciales.igBusinessAccountId).toBe('mi-id');
  });
});
