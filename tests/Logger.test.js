/**
 * Tests unitarios para Logger.gs
 * Requisitos: 8.2, 9.1, 9.2, 9.3
 */

const { logInfo, logError, logAdvertencia, logEstadoPasos } = require('../src/Logger.gs');

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── logInfo ────────────────────────────────────────────────────────────────

  describe('logInfo', () => {
    it('llama a console.log con prefijo [INFO]', () => {
      logInfo('Proceso iniciado');
      expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] Proceso iniciado');
    });

    it('incluye el mensaje completo en la salida', () => {
      logInfo('ID_Producto: ABC-001');
      const llamada = consoleSpy.log.mock.calls[0][0];
      expect(llamada).toContain('ABC-001');
    });
  });

  // ─── logError ───────────────────────────────────────────────────────────────

  describe('logError', () => {
    it('llama a console.error con prefijo [ERROR]', () => {
      logError('Algo salió mal');
      expect(consoleSpy.error).toHaveBeenCalled();
      const llamada = consoleSpy.error.mock.calls[0][0];
      expect(llamada).toContain('[ERROR]');
      expect(llamada).toContain('Algo salió mal');
    });

    it('incluye el stack trace cuando se pasa un objeto Error', () => {
      const error = new Error('fallo interno');
      logError('Error en HojaVentas', error);
      const llamada = consoleSpy.error.mock.calls[0][0];
      expect(llamada).toContain('fallo interno');
      expect(llamada).toContain('Stack:');
    });

    it('funciona sin objeto error (segundo argumento omitido)', () => {
      expect(() => logError('Solo mensaje')).not.toThrow();
      const llamada = consoleSpy.error.mock.calls[0][0];
      expect(llamada).toContain('[ERROR] Solo mensaje');
    });

    it('no incluye "Stack:" cuando no se pasa error', () => {
      logError('Sin error');
      const llamada = consoleSpy.error.mock.calls[0][0];
      expect(llamada).not.toContain('Stack:');
    });
  });

  // ─── logAdvertencia ─────────────────────────────────────────────────────────

  describe('logAdvertencia', () => {
    it('llama a console.warn con prefijo [ADVERTENCIA]', () => {
      logAdvertencia('Shortcode vacío');
      expect(consoleSpy.warn).toHaveBeenCalled();
      const llamada = consoleSpy.warn.mock.calls[0][0];
      expect(llamada).toContain('[ADVERTENCIA]');
      expect(llamada).toContain('Shortcode vacío');
    });
  });

  // ─── logEstadoPasos ─────────────────────────────────────────────────────────

  describe('logEstadoPasos', () => {
    it('produce el encabezado correcto con ID_Producto y número de paso', () => {
      const error = new Error('No encontrado');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'ABC-001', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('[ERROR] procesarVenta(ABC-001): Fallo en paso 2 (Hoja_Disponibles).');
    });

    it('marca el paso completado con ✅ y COMPLETADO', () => {
      const error = new Error('fallo');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'XYZ-99', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('✅ Paso 1 (Hoja_Ventas): COMPLETADO');
    });

    it('marca el paso fallido con ❌ y FALLIDO con el mensaje de error', () => {
      const error = new Error('ID no encontrado');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'XYZ-99', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('❌ Paso 2 (Hoja_Disponibles): FALLIDO — ID no encontrado');
    });

    it('marca los pasos no ejecutados con ⏭️ y NO EJECUTADO', () => {
      const error = new Error('fallo');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'XYZ-99', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('⏭️ Paso 3 (Instagram): NO EJECUTADO');
    });

    it('fallo en paso 1: Disponibles e Instagram como NO EJECUTADO (Requisito 9.1)', () => {
      const error = new Error('Hoja_Ventas inaccesible');
      logEstadoPasos(1, [], ['Hoja_Disponibles', 'Instagram'], 'P-001', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('❌ Paso 1 (Hoja_Ventas): FALLIDO');
      expect(salida).toContain('⏭️ Paso 2 (Hoja_Disponibles): NO EJECUTADO');
      expect(salida).toContain('⏭️ Paso 3 (Instagram): NO EJECUTADO');
    });

    it('fallo en paso 2: Ventas COMPLETADO, Instagram NO EJECUTADO (Requisito 9.2)', () => {
      const error = new Error('ID no encontrado en Hoja_Disponibles');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'P-002', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('✅ Paso 1 (Hoja_Ventas): COMPLETADO');
      expect(salida).toContain('❌ Paso 2 (Hoja_Disponibles): FALLIDO');
      expect(salida).toContain('⏭️ Paso 3 (Instagram): NO EJECUTADO');
    });

    it('fallo en paso 3: Ventas y Disponibles COMPLETADOS (Requisito 9.3)', () => {
      const error = new Error('Error HTTP 400 de Instagram');
      logEstadoPasos(3, ['Hoja_Ventas', 'Hoja_Disponibles'], [], 'P-003', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      expect(salida).toContain('✅ Paso 1 (Hoja_Ventas): COMPLETADO');
      expect(salida).toContain('✅ Paso 2 (Hoja_Disponibles): COMPLETADO');
      expect(salida).toContain('❌ Paso 3 (Instagram): FALLIDO');
    });

    it('el formato completo coincide con el ejemplo del diseño (fallo en paso 2)', () => {
      const error = new Error('mensaje de error');
      logEstadoPasos(2, ['Hoja_Ventas'], ['Instagram'], 'ABC-001', error);
      const salida = consoleSpy.error.mock.calls[0][0];
      const lineas = salida.split('\n');
      expect(lineas[0]).toBe('[ERROR] procesarVenta(ABC-001): Fallo en paso 2 (Hoja_Disponibles).');
      expect(lineas[1]).toContain('✅ Paso 1 (Hoja_Ventas): COMPLETADO');
      expect(lineas[2]).toContain('❌ Paso 2 (Hoja_Disponibles): FALLIDO — mensaje de error');
      expect(lineas[3]).toContain('⏭️ Paso 3 (Instagram): NO EJECUTADO');
    });
  });
});
