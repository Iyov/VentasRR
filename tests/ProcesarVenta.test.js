/**
 * Tests unitarios para ProcesarVenta.gs
 * Requisitos: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
 */

const { procesarVenta } = require('../src/ProcesarVenta.gs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Objeto DatosVenta completamente válido para usar en tests. */
function datosVenta(overrides = {}) {
  return Object.assign(
    {
      ID_Producto: '4091',
      User_IG: '@comprador',
      Nombre_Cliente: 'Juan Pérez',
      Metodo_Pago: 'Transferencia',
      Monto_Pagado: 6000,
      Fecha: '15/ene/25',
      Estado_Entrega: 'Pendiente',
    },
    overrides
  );
}

// ─── Setup global mocks ───────────────────────────────────────────────────────

beforeEach(() => {
  // Silenciar console para mantener la salida de tests limpia
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  // Mocks de funciones globales de Apps Script (disponibles como globals en el entorno)
  global.logInfo = jest.fn();
  global.logError = jest.fn();
  global.logAdvertencia = jest.fn();
  global.logEstadoPasos = jest.fn();

  global.validarDatosVenta = jest.fn(); // por defecto no lanza
  global.buscarYActualizarHojaVentas = jest.fn(); // por defecto no lanza
  global.buscarYActualizarHojaDisponibles = jest.fn(() => null); // por defecto retorna null
  global.obtenerCredenciales = jest.fn(() => ({
    accessToken: 'token-test',
    igBusinessAccountId: 'ig-id-test',
  }));
  global.obtenerMediaObjectId = jest.fn(() => 'media-123');
  global.obtenerYActualizarCaption = jest.fn();

  global.Browser = { msgBox: jest.fn() };
});

afterEach(() => {
  jest.restoreAllMocks();
  [
    'logInfo', 'logError', 'logAdvertencia', 'logEstadoPasos',
    'validarDatosVenta', 'buscarYActualizarHojaVentas', 'buscarYActualizarHojaDisponibles',
    'obtenerCredenciales', 'obtenerMediaObjectId', 'obtenerYActualizarCaption',
    'Browser',
  ].forEach((k) => delete global[k]);
});

// ─── Fallo en paso 1 (Hoja_Ventas) ───────────────────────────────────────────

describe('procesarVenta — fallo en paso 1 (Hoja_Ventas)', () => {
  it('llama a logEstadoPasos con paso 1, sin completados, Disponibles e Instagram como no ejecutados', () => {
    const error = new Error('ID no encontrado en Hoja_Ventas');
    global.buscarYActualizarHojaVentas.mockImplementation(() => { throw error; });

    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).toHaveBeenCalledWith(
      1,
      [],
      ['Hoja_Disponibles', 'Instagram'],
      '4091',
      error
    );
  });

  it('no llama a buscarYActualizarHojaDisponibles cuando falla el paso 1', () => {
    global.buscarYActualizarHojaVentas.mockImplementation(() => {
      throw new Error('fallo paso 1');
    });

    procesarVenta(datosVenta());

    expect(global.buscarYActualizarHojaDisponibles).not.toHaveBeenCalled();
  });

  it('no llama a la API de Instagram cuando falla el paso 1', () => {
    global.buscarYActualizarHojaVentas.mockImplementation(() => {
      throw new Error('fallo paso 1');
    });

    procesarVenta(datosVenta());

    expect(global.obtenerMediaObjectId).not.toHaveBeenCalled();
    expect(global.obtenerYActualizarCaption).not.toHaveBeenCalled();
  });

  it('muestra mensaje de error al usuario cuando falla el paso 1', () => {
    global.buscarYActualizarHojaVentas.mockImplementation(() => {
      throw new Error('ID no encontrado en Hoja_Ventas');
    });

    procesarVenta(datosVenta());

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      expect.stringContaining('Error al procesar la venta:')
    );
  });
});

// ─── Fallo en paso 2 (Hoja_Disponibles) ──────────────────────────────────────

describe('procesarVenta — fallo en paso 2 (Hoja_Disponibles)', () => {
  it('llama a logEstadoPasos con paso 2, Ventas como completado, Instagram como no ejecutado', () => {
    const error = new Error('ID no encontrado en Hoja_Disponibles');
    global.buscarYActualizarHojaDisponibles.mockImplementation(() => { throw error; });

    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).toHaveBeenCalledWith(
      2,
      ['Hoja_Ventas'],
      ['Instagram'],
      '4091',
      error
    );
  });

  it('no llama a la API de Instagram cuando falla el paso 2', () => {
    global.buscarYActualizarHojaDisponibles.mockImplementation(() => {
      throw new Error('fallo paso 2');
    });

    procesarVenta(datosVenta());

    expect(global.obtenerMediaObjectId).not.toHaveBeenCalled();
    expect(global.obtenerYActualizarCaption).not.toHaveBeenCalled();
  });

  it('muestra mensaje de error al usuario cuando falla el paso 2', () => {
    global.buscarYActualizarHojaDisponibles.mockImplementation(() => {
      throw new Error('ID no encontrado en Hoja_Disponibles');
    });

    procesarVenta(datosVenta());

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      expect.stringContaining('Error al procesar la venta:')
    );
  });
});

// ─── Fallo en paso 3 (Instagram) ─────────────────────────────────────────────

describe('procesarVenta — fallo en paso 3 (Instagram)', () => {
  it('llama a logEstadoPasos con paso 3, Ventas y Disponibles como completados', () => {
    const error = new Error('Instagram API error 400');
    global.buscarYActualizarHojaDisponibles.mockReturnValue('ABC123');
    global.obtenerYActualizarCaption.mockImplementation(() => { throw error; });

    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).toHaveBeenCalledWith(
      3,
      ['Hoja_Ventas', 'Hoja_Disponibles'],
      [],
      '4091',
      error
    );
  });

  it('muestra mensaje de error al usuario cuando falla el paso 3', () => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue('ABC123');
    global.obtenerYActualizarCaption.mockImplementation(() => {
      throw new Error('Instagram API error 400');
    });

    procesarVenta(datosVenta());

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      expect.stringContaining('Error al procesar la venta:')
    );
  });

  it('llama a logEstadoPasos con paso 3 cuando falla obtenerMediaObjectId lanzando error', () => {
    const error = new Error('Error de red en Instagram');
    global.buscarYActualizarHojaDisponibles.mockReturnValue('ABC123');
    global.obtenerMediaObjectId.mockImplementation(() => { throw error; });

    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).toHaveBeenCalledWith(
      3,
      ['Hoja_Ventas', 'Hoja_Disponibles'],
      [],
      '4091',
      error
    );
  });
});

// ─── Shortcode null — flujo sin Instagram ────────────────────────────────────

describe('procesarVenta — shortcode null', () => {
  it('no llama a obtenerMediaObjectId cuando el shortcode es null', () => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue(null);

    procesarVenta(datosVenta());

    expect(global.obtenerMediaObjectId).not.toHaveBeenCalled();
  });

  it('no llama a obtenerYActualizarCaption cuando el shortcode es null', () => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue(null);

    procesarVenta(datosVenta());

    expect(global.obtenerYActualizarCaption).not.toHaveBeenCalled();
  });

  it('muestra mensaje de confirmación al usuario cuando shortcode es null', () => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue(null);

    procesarVenta(datosVenta());

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      'Venta registrada exitosamente. ID_Producto: 4091'
    );
  });

  it('no llama a logEstadoPasos cuando el flujo termina exitosamente con shortcode null', () => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue(null);

    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).not.toHaveBeenCalled();
  });
});

// ─── Flujo exitoso con shortcode ─────────────────────────────────────────────

describe('procesarVenta — flujo exitoso con shortcode', () => {
  beforeEach(() => {
    global.buscarYActualizarHojaDisponibles.mockReturnValue('ABC123shortcode');
    global.obtenerMediaObjectId.mockReturnValue('media-object-456');
  });

  it('llama a los 3 pasos en orden', () => {
    const callOrder = [];
    global.buscarYActualizarHojaVentas.mockImplementation(() => callOrder.push('ventas'));
    global.buscarYActualizarHojaDisponibles.mockImplementation(() => {
      callOrder.push('disponibles');
      return 'ABC123shortcode';
    });
    global.obtenerYActualizarCaption.mockImplementation(() => callOrder.push('instagram'));

    procesarVenta(datosVenta());

    expect(callOrder).toEqual(['ventas', 'disponibles', 'instagram']);
  });

  it('llama a obtenerMediaObjectId con el shortcode correcto', () => {
    procesarVenta(datosVenta());

    expect(global.obtenerMediaObjectId).toHaveBeenCalledWith(
      'ABC123shortcode',
      'ig-id-test',
      'token-test'
    );
  });

  it('llama a obtenerYActualizarCaption con el mediaObjectId y ID_Producto correctos', () => {
    procesarVenta(datosVenta());

    expect(global.obtenerYActualizarCaption).toHaveBeenCalledWith(
      'media-object-456',
      '4091',
      'token-test'
    );
  });

  it('muestra mensaje de confirmación al usuario (Requisito 9.4)', () => {
    procesarVenta(datosVenta());

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      'Venta registrada exitosamente. ID_Producto: 4091'
    );
  });

  it('no llama a logEstadoPasos en un flujo exitoso', () => {
    procesarVenta(datosVenta());

    expect(global.logEstadoPasos).not.toHaveBeenCalled();
  });

  it('registra inicio y fin de ejecución en el log', () => {
    procesarVenta(datosVenta());

    expect(global.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('procesarVenta iniciado')
    );
    expect(global.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('procesarVenta completado exitosamente')
    );
  });

  it('no llama a obtenerYActualizarCaption cuando obtenerMediaObjectId retorna null', () => {
    global.obtenerMediaObjectId.mockReturnValue(null);

    procesarVenta(datosVenta());

    expect(global.obtenerYActualizarCaption).not.toHaveBeenCalled();
    // Aun así muestra confirmación porque no hubo error
    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      'Venta registrada exitosamente. ID_Producto: 4091'
    );
  });
});

// ─── Error de validación ──────────────────────────────────────────────────────

describe('procesarVenta — error de validación', () => {
  it('muestra mensaje de error al usuario cuando la validación falla', () => {
    global.validarDatosVenta.mockImplementation(() => {
      throw new Error('ID_Producto es obligatorio');
    });

    procesarVenta(datosVenta({ ID_Producto: '' }));

    expect(global.Browser.msgBox).toHaveBeenCalledWith(
      'Error al procesar la venta: ID_Producto es obligatorio'
    );
  });

  it('no llama a buscarYActualizarHojaVentas cuando la validación falla', () => {
    global.validarDatosVenta.mockImplementation(() => {
      throw new Error('ID_Producto es obligatorio');
    });

    procesarVenta(datosVenta({ ID_Producto: '' }));

    expect(global.buscarYActualizarHojaVentas).not.toHaveBeenCalled();
  });

  it('registra el error con console.error cuando la validación falla', () => {
    global.validarDatosVenta.mockImplementation(() => {
      throw new Error('Fecha debe tener formato dd/mmm/aa');
    });

    procesarVenta(datosVenta({ Fecha: 'fecha-invalida' }));

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Fecha debe tener formato dd/mmm/aa')
    );
  });

  it('no llama a logEstadoPasos cuando la validación falla (no es un fallo de paso)', () => {
    global.validarDatosVenta.mockImplementation(() => {
      throw new Error('ID_Producto es obligatorio');
    });

    procesarVenta(datosVenta({ ID_Producto: '' }));

    expect(global.logEstadoPasos).not.toHaveBeenCalled();
  });
});
