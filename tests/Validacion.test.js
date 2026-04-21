/**
 * Tests unitarios para Validacion.gs
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5
 */

const { validarDatosVenta } = require('../src/Validacion.gs');

// Helper: objeto DatosVenta completamente válido
function datosValidos(overrides = {}) {
  return Object.assign(
    {
      ID_Producto: 'ABC-001',
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

// ─── ID_Producto ─────────────────────────────────────────────────────────────

describe('validarDatosVenta — ID_Producto', () => {
  it('lanza error cuando ID_Producto es una cadena vacía (Requisito 3.1, 3.3)', () => {
    expect(() => validarDatosVenta(datosValidos({ ID_Producto: '' }))).toThrow(
      'ID_Producto es obligatorio'
    );
  });

  it('lanza error cuando ID_Producto es solo espacios en blanco', () => {
    expect(() => validarDatosVenta(datosValidos({ ID_Producto: '   ' }))).toThrow(
      'ID_Producto es obligatorio'
    );
  });

  it('lanza error cuando ID_Producto es null', () => {
    expect(() => validarDatosVenta(datosValidos({ ID_Producto: null }))).toThrow(
      'ID_Producto es obligatorio'
    );
  });

  it('lanza error cuando ID_Producto es undefined', () => {
    expect(() => validarDatosVenta(datosValidos({ ID_Producto: undefined }))).toThrow(
      'ID_Producto es obligatorio'
    );
  });

  it('no lanza error cuando ID_Producto es una cadena no vacía', () => {
    expect(() => validarDatosVenta(datosValidos({ ID_Producto: '4089' }))).not.toThrow();
  });
});

// ─── Fecha ───────────────────────────────────────────────────────────────────

describe('validarDatosVenta — Fecha (Requisito 3.2, 3.4)', () => {
  // Formatos inválidos
  const formatosInvalidos = [
    '15-ene-25',       // separadores incorrectos
    '15/enero/25',     // mes completo
    '5/ene/25',        // día sin cero
    '15/ene/2025',     // año de 4 dígitos
    '15/xyz/25',       // mes inválido
    '',                // vacío
    '15/ene/',         // año faltante
    '/ene/25',         // día faltante
    '15//25',          // mes faltante
    '2025-01-15',      // formato ISO
    'ene/15/25',       // orden incorrecto
  ];

  formatosInvalidos.forEach((fecha) => {
    it(`lanza error para fecha inválida: "${fecha}"`, () => {
      expect(() => validarDatosVenta(datosValidos({ Fecha: fecha }))).toThrow(
        'Fecha debe tener formato dd/mmm/aa'
      );
    });
  });

  // Los 12 meses válidos
  const mesesValidos = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];

  mesesValidos.forEach((mes) => {
    it(`acepta fecha válida con mes "${mes}"`, () => {
      expect(() => validarDatosVenta(datosValidos({ Fecha: `15/${mes}/25` }))).not.toThrow();
    });
  });

  it('acepta fecha válida con mes en mayúsculas (flag /i)', () => {
    expect(() => validarDatosVenta(datosValidos({ Fecha: '15/ENE/25' }))).not.toThrow();
  });

  it('acepta fecha válida con mes en capitalización mixta', () => {
    expect(() => validarDatosVenta(datosValidos({ Fecha: '15/Ene/25' }))).not.toThrow();
  });

  it('acepta fecha con día 01 y año 00', () => {
    expect(() => validarDatosVenta(datosValidos({ Fecha: '01/dic/00' }))).not.toThrow();
  });
});

// ─── Monto_Pagado ─────────────────────────────────────────────────────────────

describe('validarDatosVenta — Monto_Pagado (Requisito 3.5)', () => {
  it('lanza error cuando Monto_Pagado es null', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: null }))).toThrow(
      'Monto_Pagado debe ser un valor numérico'
    );
  });

  it('lanza error cuando Monto_Pagado es undefined', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: undefined }))).toThrow(
      'Monto_Pagado debe ser un valor numérico'
    );
  });

  it('lanza error cuando Monto_Pagado es una cadena numérica', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: '6000' }))).toThrow(
      'Monto_Pagado debe ser un valor numérico'
    );
  });

  it('lanza error cuando Monto_Pagado es una cadena no numérica', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: 'seis mil' }))).toThrow(
      'Monto_Pagado debe ser un valor numérico'
    );
  });

  it('lanza error cuando Monto_Pagado es NaN', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: NaN }))).toThrow(
      'Monto_Pagado debe ser un valor numérico'
    );
  });

  it('no lanza error cuando Monto_Pagado es un entero positivo', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: 6000 }))).not.toThrow();
  });

  it('no lanza error cuando Monto_Pagado es un número decimal', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: 5999.99 }))).not.toThrow();
  });

  it('no lanza error cuando Monto_Pagado es cero', () => {
    expect(() => validarDatosVenta(datosValidos({ Monto_Pagado: 0 }))).not.toThrow();
  });
});

// ─── Objeto DatosVenta completo y válido ─────────────────────────────────────

describe('validarDatosVenta — objeto completo válido', () => {
  it('no lanza error con un objeto DatosVenta completamente válido', () => {
    expect(() =>
      validarDatosVenta({
        ID_Producto: '4089',
        User_IG: '@comprador_ig',
        Nombre_Cliente: 'María García',
        Metodo_Pago: 'Efectivo',
        Monto_Pagado: 6000,
        Fecha: '15/ene/25',
        Estado_Entrega: 'Entregado',
      })
    ).not.toThrow();
  });

  it('no lanza error con campos opcionales vacíos (solo valida los obligatorios)', () => {
    expect(() =>
      validarDatosVenta({
        ID_Producto: 'XYZ-99',
        User_IG: '',
        Nombre_Cliente: '',
        Metodo_Pago: '',
        Monto_Pagado: 1500,
        Fecha: '01/mar/25',
        Estado_Entrega: '',
      })
    ).not.toThrow();
  });
});
