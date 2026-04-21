/**
 * Tests unitarios para Menu.gs
 * Requisitos: 2.1, 2.2, 2.3, 2.4, 8.5
 */

const { onOpen, abrirFormularioVenta, verLogs } = require('../src/Menu.gs');

// ─── Helpers / Mocks ─────────────────────────────────────────────────────────

/**
 * Crea un mock de SpreadsheetApp.getUi() con un menu builder encadenable.
 */
function crearMockUi() {
  const menuBuilder = {
    addItem: jest.fn().mockReturnThis(),
    addToUi: jest.fn().mockReturnThis(),
  };
  const ui = {
    createMenu: jest.fn(() => menuBuilder),
    alert: jest.fn(),
    _menuBuilder: menuBuilder,
  };
  return ui;
}

/**
 * Crea un mock de Browser con respuestas configurables.
 * @param {string[]} inputBoxResponses - Respuestas en orden para cada llamada a inputBox.
 */
function crearMockBrowser(inputBoxResponses) {
  let callIndex = 0;
  return {
    inputBox: jest.fn(() => inputBoxResponses[callIndex++] !== undefined
      ? inputBoxResponses[callIndex - 1]
      : ''),
    msgBox: jest.fn(),
    Buttons: { CANCEL: 'cancel' },
  };
}

// ─── onOpen ──────────────────────────────────────────────────────────────────

describe('onOpen', () => {
  let mockUi;

  beforeEach(() => {
    mockUi = crearMockUi();
    global.SpreadsheetApp = { getUi: jest.fn(() => mockUi) };
  });

  afterEach(() => {
    delete global.SpreadsheetApp;
  });

  it('llama a createMenu con el nombre "Ropavejero.Retro" (Requisito 2.1)', () => {
    onOpen();
    expect(mockUi.createMenu).toHaveBeenCalledWith('Ropavejero.Retro');
  });

  it('agrega la opción "Registrar Venta" apuntando a abrirFormularioVenta (Requisito 2.2)', () => {
    onOpen();
    expect(mockUi._menuBuilder.addItem).toHaveBeenCalledWith('Registrar Venta', 'abrirFormularioVenta');
  });

  it('agrega la opción "Configurar Credenciales" apuntando a configurarCredenciales (Requisito 2.2)', () => {
    onOpen();
    expect(mockUi._menuBuilder.addItem).toHaveBeenCalledWith('Configurar Credenciales', 'configurarCredenciales');
  });

  it('agrega la opción "Ver Logs" apuntando a verLogs (Requisito 2.2)', () => {
    onOpen();
    expect(mockUi._menuBuilder.addItem).toHaveBeenCalledWith('Ver Logs', 'verLogs');
  });

  it('llama a addToUi para registrar el menú en la interfaz (Requisito 2.1)', () => {
    onOpen();
    expect(mockUi._menuBuilder.addToUi).toHaveBeenCalled();
  });

  it('agrega exactamente tres ítems al menú (Requisito 2.2)', () => {
    onOpen();
    expect(mockUi._menuBuilder.addItem).toHaveBeenCalledTimes(3);
  });
});

// ─── abrirFormularioVenta ─────────────────────────────────────────────────────

describe('abrirFormularioVenta', () => {
  let mockBrowser;
  let mockUi;
  let mockProcesarVenta;

  beforeEach(() => {
    mockUi = crearMockUi();
    global.SpreadsheetApp = { getUi: jest.fn(() => mockUi) };
    mockProcesarVenta = jest.fn();
    global.procesarVenta = mockProcesarVenta;
  });

  afterEach(() => {
    delete global.SpreadsheetApp;
    delete global.Browser;
    delete global.procesarVenta;
  });

  it('llama a procesarVenta con los datos recopilados cuando todos los campos son válidos (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser([
      '4091',        // ID_Producto
      'user_ig',     // User_IG
      'Juan Pérez',  // Nombre_Cliente
      'Efectivo',    // Metodo_Pago
      '5000',        // Monto_Pagado
      '15/ene/25',   // Fecha
      'Entregado',   // Estado_Entrega
    ]);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).toHaveBeenCalledTimes(1);
    expect(mockProcesarVenta).toHaveBeenCalledWith({
      ID_Producto: '4091',
      User_IG: 'user_ig',
      Nombre_Cliente: 'Juan Pérez',
      Metodo_Pago: 'Efectivo',
      Monto_Pagado: 5000,
      Fecha: '15/ene/25',
      Estado_Entrega: 'Entregado',
    });
  });

  it('convierte Monto_Pagado a número con parseFloat (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser(['4091', '', '', '', '1500.50', '01/feb/25', '']);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).toHaveBeenCalledWith(
      expect.objectContaining({ Monto_Pagado: 1500.50 })
    );
  });

  it('no llama a procesarVenta cuando el usuario cancela ID_Producto (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser(['cancel']); // CANCEL en el primer campo
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).not.toHaveBeenCalled();
  });

  it('muestra alerta de error cuando el usuario cancela ID_Producto (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser(['cancel']);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockUi.alert).toHaveBeenCalledWith(
      expect.stringContaining('ID del Producto')
    );
  });

  it('no llama a procesarVenta cuando ID_Producto es cadena vacía (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser(['']);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).not.toHaveBeenCalled();
  });

  it('no llama a procesarVenta cuando el usuario cancela Monto_Pagado (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser([
      '4091',    // ID_Producto
      '',        // User_IG
      '',        // Nombre_Cliente
      '',        // Metodo_Pago
      'cancel',  // Monto_Pagado — cancelado
    ]);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).not.toHaveBeenCalled();
  });

  it('no llama a procesarVenta cuando el usuario cancela Fecha (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser([
      '4091',    // ID_Producto
      '',        // User_IG
      '',        // Nombre_Cliente
      '',        // Metodo_Pago
      '5000',    // Monto_Pagado
      'cancel',  // Fecha — cancelada
    ]);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).not.toHaveBeenCalled();
  });

  it('trata el cancel en campos opcionales como cadena vacía y continúa (Requisito 2.3)', () => {
    mockBrowser = crearMockBrowser([
      '4091',    // ID_Producto
      'cancel',  // User_IG — cancelado (opcional)
      'cancel',  // Nombre_Cliente — cancelado (opcional)
      'cancel',  // Metodo_Pago — cancelado (opcional)
      '5000',    // Monto_Pagado
      '15/ene/25', // Fecha
      'cancel',  // Estado_Entrega — cancelado (opcional)
    ]);
    global.Browser = mockBrowser;

    abrirFormularioVenta();

    expect(mockProcesarVenta).toHaveBeenCalledWith(
      expect.objectContaining({
        ID_Producto: '4091',
        User_IG: '',
        Nombre_Cliente: '',
        Metodo_Pago: '',
        Estado_Entrega: '',
      })
    );
  });
});

// ─── verLogs ─────────────────────────────────────────────────────────────────

describe('verLogs', () => {
  let mockUi;

  beforeEach(() => {
    mockUi = crearMockUi();
    global.SpreadsheetApp = { getUi: jest.fn(() => mockUi) };
  });

  afterEach(() => {
    delete global.SpreadsheetApp;
  });

  it('llama a SpreadsheetApp.getUi().alert con un mensaje informativo (Requisito 2.4, 8.5)', () => {
    verLogs();
    expect(mockUi.alert).toHaveBeenCalledTimes(1);
    expect(mockUi.alert).toHaveBeenCalledWith(
      'Ver Logs: Abra el editor de Apps Script y vaya a Ver > Registros para ver los logs detallados.'
    );
  });
});
