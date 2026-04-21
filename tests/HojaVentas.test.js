/**
 * Tests unitarios para HojaVentas.gs
 * Requisitos: 4.1, 4.2, 4.3, 4.4
 */

const { buscarYActualizarHojaVentas } = require('../src/HojaVentas.gs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construye un mock de SpreadsheetApp que simula una hoja con filas de datos.
 * @param {Array<Array<any>>} columnBValues - Valores de la columna B (sin encabezado).
 * @returns {{ spreadsheetApp: object, setCellMock: jest.fn, getValuesMock: jest.fn }}
 */
function buildSpreadsheetMock(columnBValues) {
  const setCellMock = jest.fn();

  // getRange devuelve un objeto con getValues() o setValue()
  const getRangeMock = jest.fn((row, col, numRows, numCols) => {
    // Llamada para obtener columna B completa: getRange(1, 2, lastRow, 1)
    if (col === 2 && numRows !== undefined) {
      return {
        getValues: jest.fn(() => columnBValues.map((v) => [v])),
      };
    }
    // Llamada para actualizar una celda individual: getRange(row, col)
    return {
      setValue: setCellMock,
    };
  });

  const sheetMock = {
    getLastRow: jest.fn(() => columnBValues.length),
    getRange: getRangeMock,
  };

  const spreadsheetMock = {
    getSheetByName: jest.fn(() => sheetMock),
  };

  const spreadsheetApp = {
    openByUrl: jest.fn(() => spreadsheetMock),
  };

  return { spreadsheetApp, setCellMock, sheetMock };
}

/** Objeto DatosVenta completamente válido para usar en tests. */
function datosVenta(overrides = {}) {
  return Object.assign(
    {
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

  // Mock de logInfo y logError como globales (disponibles en Apps Script)
  global.logInfo = jest.fn();
  global.logError = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.logInfo;
  delete global.logError;
  delete global.SpreadsheetApp;
});

// ─── ID_Producto no encontrado ────────────────────────────────────────────────

describe('buscarYActualizarHojaVentas — ID_Producto no encontrado', () => {
  it('llama a logError con el mensaje correcto cuando el ID no existe', () => {
    const { spreadsheetApp } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaVentas('9999', datosVenta())).toThrow();

    expect(global.logError).toHaveBeenCalledWith(
      expect.stringContaining('9999')
    );
    expect(global.logError).toHaveBeenCalledWith(
      expect.stringContaining('no encontrado en Hoja_Ventas')
    );
  });

  it('lanza un Error cuando el ID_Producto no está en columna B', () => {
    const { spreadsheetApp } = buildSpreadsheetMock(['4089', '4090']);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaVentas('0000', datosVenta())).toThrow(
      /0000.*no encontrado en Hoja_Ventas/
    );
  });

  it('lanza error cuando la hoja está vacía', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaVentas('4089', datosVenta())).toThrow(
      /no encontrado en Hoja_Ventas/
    );
  });

  it('no actualiza ninguna celda cuando el ID no se encuentra', () => {
    const { spreadsheetApp, setCellMock } = buildSpreadsheetMock(['4089', '4090']);
    global.SpreadsheetApp = spreadsheetApp;

    try {
      buscarYActualizarHojaVentas('9999', datosVenta());
    } catch (_) {
      // esperado
    }

    expect(setCellMock).not.toHaveBeenCalled();
  });
});

// ─── Valores escritos en columnas I–P ────────────────────────────────────────

describe('buscarYActualizarHojaVentas — actualización de columnas I–P', () => {
  it('escribe el valor 1 en columna I (Sold)', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    const setValueCalls = [];
    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090'], ['4091']]) };
      }
      return { setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })) };
    });

    buscarYActualizarHojaVentas('4090', datosVenta());

    const colI = setValueCalls.find((c) => c.col === 9);
    expect(colI).toBeDefined();
    expect(colI.value).toBe(1);
  });

  it('escribe el valor 1 en columna M (Test)', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    const setValueCalls = [];
    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090'], ['4091']]) };
      }
      return { setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })) };
    });

    buscarYActualizarHojaVentas('4090', datosVenta());

    const colM = setValueCalls.find((c) => c.col === 13);
    expect(colM).toBeDefined();
    expect(colM.value).toBe(1);
  });

  it('escribe todos los valores de DatosVenta en las columnas correctas', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    const setValueCalls = [];
    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090'], ['4091']]) };
      }
      return { setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })) };
    });

    const datos = datosVenta({
      User_IG: '@usuario_test',
      Nombre_Cliente: 'María García',
      Metodo_Pago: 'Efectivo',
      Monto_Pagado: 5000,
      Fecha: '20/feb/25',
      Estado_Entrega: 'Entregado',
    });

    buscarYActualizarHojaVentas('4091', datos);

    const byCol = (col) => setValueCalls.find((c) => c.col === col);

    expect(byCol(9).value).toBe(1);                    // I: Sold
    expect(byCol(10).value).toBe('@usuario_test');      // J: User_IG
    expect(byCol(11).value).toBe('María García');       // K: Nombre_Cliente
    expect(byCol(12).value).toBe('Efectivo');           // L: Metodo_Pago
    expect(byCol(13).value).toBe(1);                   // M: Test
    expect(byCol(14).value).toBe('20/feb/25');          // N: Fecha
    expect(byCol(15).value).toBe('Entregado');          // O: Estado_Entrega
    expect(byCol(16).value).toBe(5000);                 // P: Monto_Pagado
  });

  it('actualiza exactamente 8 celdas (columnas I a P)', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090']);
    global.SpreadsheetApp = spreadsheetApp;

    const setValueCalls = [];
    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090']]) };
      }
      return { setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })) };
    });

    buscarYActualizarHojaVentas('4089', datosVenta());

    expect(setValueCalls).toHaveLength(8);
    const cols = setValueCalls.map((c) => c.col).sort((a, b) => a - b);
    expect(cols).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('actualiza la fila correcta cuando hay múltiples productos', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    const setValueCalls = [];
    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090'], ['4091']]) };
      }
      return { setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })) };
    });

    // Buscar '4090' que está en la fila 2 (índice 1 → rowIndex = 2)
    buscarYActualizarHojaVentas('4090', datosVenta());

    // Todas las actualizaciones deben ser en la fila 2
    setValueCalls.forEach((c) => {
      expect(c.row).toBe(2);
    });
  });
});

// ─── Log de éxito ─────────────────────────────────────────────────────────────

describe('buscarYActualizarHojaVentas — log de éxito', () => {
  it('llama a logInfo con la fila actualizada y el ID_Producto', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089', '4090', '4091']);
    global.SpreadsheetApp = spreadsheetApp;

    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089'], ['4090'], ['4091']]) };
      }
      return { setValue: jest.fn() };
    });

    buscarYActualizarHojaVentas('4091', datosVenta());

    expect(global.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('4091')
    );
    // La fila de '4091' es la 3 (índice 2 → rowIndex = 3)
    expect(global.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('3')
    );
  });

  it('no llama a logError cuando la actualización es exitosa', () => {
    const { spreadsheetApp, sheetMock } = buildSpreadsheetMock(['4089']);
    global.SpreadsheetApp = spreadsheetApp;

    sheetMock.getRange.mockImplementation((row, col, numRows) => {
      if (col === 2 && numRows !== undefined) {
        return { getValues: jest.fn(() => [['4089']]) };
      }
      return { setValue: jest.fn() };
    });

    buscarYActualizarHojaVentas('4089', datosVenta());

    expect(global.logError).not.toHaveBeenCalled();
  });
});
