/**
 * Tests unitarios para HojaDisponibles.gs
 * Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const { buscarYActualizarHojaDisponibles } = require('../src/HojaDisponibles.gs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construye un mock de SpreadsheetApp que simula la hoja "Disponibles".
 *
 * @param {Array<{ id: string, shortcode: string }>} rows - Filas de datos (columna A = id, columna G = shortcode).
 * @returns {{ spreadsheetApp: object, setValueCalls: Array, getRangeMock: jest.fn }}
 */
function buildSpreadsheetMock(rows) {
  const setValueCalls = [];

  // Valores de columna A para la búsqueda
  const columnAValues = rows.map((r) => [r.id]);

  const getRangeMock = jest.fn((row, col, numRows, numCols) => {
    // Llamada para obtener columna A completa: getRange(1, 1, lastRow, 1)
    if (col === 1 && numRows !== undefined) {
      return {
        getValues: jest.fn(() => columnAValues),
      };
    }

    // Llamada para escribir en columna H: getRange(rowIndex, 8)
    if (col === 8) {
      return {
        setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })),
      };
    }

    // Llamada para leer columna G: getRange(rowIndex, 7)
    if (col === 7) {
      const rowData = rows[row - 1]; // row es 1-based
      const shortcode = rowData ? rowData.shortcode : '';
      return {
        getValue: jest.fn(() => shortcode),
      };
    }

    // Fallback genérico
    return {
      setValue: jest.fn((v) => setValueCalls.push({ row, col, value: v })),
      getValue: jest.fn(() => ''),
    };
  });

  const sheetMock = {
    getLastRow: jest.fn(() => rows.length),
    getRange: getRangeMock,
  };

  const spreadsheetMock = {
    getSheetByName: jest.fn(() => sheetMock),
  };

  const spreadsheetApp = {
    openByUrl: jest.fn(() => spreadsheetMock),
  };

  return { spreadsheetApp, setValueCalls, sheetMock, getRangeMock };
}

// ─── Setup global mocks ───────────────────────────────────────────────────────

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  global.logInfo = jest.fn();
  global.logError = jest.fn();
  global.logAdvertencia = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.logInfo;
  delete global.logError;
  delete global.logAdvertencia;
  delete global.SpreadsheetApp;
});

// ─── ID_Producto no encontrado ────────────────────────────────────────────────

describe('buscarYActualizarHojaDisponibles — ID_Producto no encontrado', () => {
  it('llama a logError con el mensaje correcto cuando el ID no existe', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
      { id: '4090', shortcode: 'def456' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaDisponibles('9999')).toThrow();

    expect(global.logError).toHaveBeenCalledWith(
      expect.stringContaining('9999')
    );
    expect(global.logError).toHaveBeenCalledWith(
      expect.stringContaining('no encontrado en Hoja_Disponibles')
    );
  });

  it('lanza un Error cuando el ID_Producto no está en columna A', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaDisponibles('0000')).toThrow(
      /0000.*no encontrado en Hoja_Disponibles/
    );
  });

  it('lanza error cuando la hoja está vacía', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaDisponibles('4089')).toThrow(
      /no encontrado en Hoja_Disponibles/
    );
  });

  it('no escribe en columna H cuando el ID no se encuentra', () => {
    const { spreadsheetApp, setValueCalls } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    try {
      buscarYActualizarHojaDisponibles('9999');
    } catch (_) {
      // esperado
    }

    const colHWrites = setValueCalls.filter((c) => c.col === 8);
    expect(colHWrites).toHaveLength(0);
  });
});

// ─── Escritura en columna H ───────────────────────────────────────────────────

describe('buscarYActualizarHojaDisponibles — escritura de 1 en columna H', () => {
  it('escribe el valor 1 en columna H cuando el ID es encontrado', () => {
    const { spreadsheetApp, setValueCalls } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
      { id: '4090', shortcode: 'def456' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    buscarYActualizarHojaDisponibles('4089');

    const colH = setValueCalls.find((c) => c.col === 8);
    expect(colH).toBeDefined();
    expect(colH.value).toBe(1);
  });

  it('escribe en la fila correcta cuando hay múltiples productos', () => {
    const { spreadsheetApp, setValueCalls } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
      { id: '4090', shortcode: 'def456' },
      { id: '4091', shortcode: 'ghi789' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    // '4090' está en la fila 2 (índice 1 → rowIndex = 2)
    buscarYActualizarHojaDisponibles('4090');

    const colH = setValueCalls.find((c) => c.col === 8);
    expect(colH).toBeDefined();
    expect(colH.row).toBe(2);
    expect(colH.value).toBe(1);
  });

  it('escribe exactamente una vez en columna H', () => {
    const { spreadsheetApp, setValueCalls } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    buscarYActualizarHojaDisponibles('4089');

    const colHWrites = setValueCalls.filter((c) => c.col === 8);
    expect(colHWrites).toHaveLength(1);
  });
});

// ─── Retorno del shortcode ────────────────────────────────────────────────────

describe('buscarYActualizarHojaDisponibles — retorno del shortcode de columna G', () => {
  it('retorna el shortcode cuando columna G tiene un valor', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'CwXyZ123' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    const result = buscarYActualizarHojaDisponibles('4089');

    expect(result).toBe('CwXyZ123');
  });

  it('retorna el shortcode correcto cuando hay múltiples productos', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'shortcode_A' },
      { id: '4090', shortcode: 'shortcode_B' },
      { id: '4091', shortcode: 'shortcode_C' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(buscarYActualizarHojaDisponibles('4090')).toBe('shortcode_B');
    expect(buscarYActualizarHojaDisponibles('4091')).toBe('shortcode_C');
  });

  it('no llama a logError cuando la operación es exitosa', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: 'abc123' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    buscarYActualizarHojaDisponibles('4089');

    expect(global.logError).not.toHaveBeenCalled();
  });
});

// ─── Columna G vacía ──────────────────────────────────────────────────────────

describe('buscarYActualizarHojaDisponibles — columna G vacía o nula', () => {
  it('retorna null cuando columna G está vacía', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: '' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    const result = buscarYActualizarHojaDisponibles('4089');

    expect(result).toBeNull();
  });

  it('llama a logAdvertencia cuando columna G está vacía', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: '' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    buscarYActualizarHojaDisponibles('4089');

    expect(global.logAdvertencia).toHaveBeenCalledWith(
      expect.stringContaining('4089')
    );
  });

  it('no lanza error cuando columna G está vacía (proceso continúa)', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: '' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    expect(() => buscarYActualizarHojaDisponibles('4089')).not.toThrow();
  });

  it('aún escribe 1 en columna H aunque columna G esté vacía', () => {
    const { spreadsheetApp, setValueCalls } = buildSpreadsheetMock([
      { id: '4089', shortcode: '' },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    buscarYActualizarHojaDisponibles('4089');

    const colH = setValueCalls.find((c) => c.col === 8);
    expect(colH).toBeDefined();
    expect(colH.value).toBe(1);
  });

  it('retorna null cuando columna G contiene null', () => {
    const { spreadsheetApp } = buildSpreadsheetMock([
      { id: '4089', shortcode: null },
    ]);
    global.SpreadsheetApp = spreadsheetApp;

    const result = buscarYActualizarHojaDisponibles('4089');

    expect(result).toBeNull();
  });
});
