/**
 * Tests unitarios para InstagramAPI.gs — obtenerMediaObjectId y obtenerYActualizarCaption
 * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

const { obtenerMediaObjectId, obtenerYActualizarCaption, escapeRegex } = require('../src/InstagramAPI.gs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFetchMock(responses) {
  let callIndex = 0;
  return {
    fetch: jest.fn(() => {
      const resp = responses[callIndex] || responses[responses.length - 1];
      callIndex++;
      return {
        getResponseCode: jest.fn(() => resp.status),
        getContentText: jest.fn(() => JSON.stringify(resp.body)),
      };
    }),
  };
}

function pageResponse(items, nextUrl = null) {
  const body = { data: items };
  if (nextUrl) body.paging = { next: nextUrl };
  return { status: 200, body };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

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
  delete global.UrlFetchApp;
});

// ─── escapeRegex ──────────────────────────────────────────────────────────────

describe('escapeRegex', () => {
  it('escapa puntos', () => {
    expect(escapeRegex('4089.5')).toBe('4089\\.5');
  });
  it('escapa corchetes', () => {
    expect(escapeRegex('[Xbox]')).toBe('\\[Xbox\\]');
  });
  it('no modifica strings sin caracteres especiales', () => {
    expect(escapeRegex('4089')).toBe('4089');
  });
});

// ─── obtenerMediaObjectId — accessToken ──────────────────────────────────────

describe('obtenerMediaObjectId — accessToken', () => {
  it('retorna null y llama a logError cuando accessToken es null', () => {
    const result = obtenerMediaObjectId('abc123', 'userId', null);
    expect(result).toBeNull();
    expect(global.logError).toHaveBeenCalledWith('Access_Token no configurado. Ejecute configurarCredenciales()');
  });

  it('retorna null y llama a logError cuando accessToken es string vacío', () => {
    const result = obtenerMediaObjectId('abc123', 'userId', '');
    expect(result).toBeNull();
    expect(global.logError).toHaveBeenCalledWith('Access_Token no configurado. Ejecute configurarCredenciales()');
  });

  it('no llama a UrlFetchApp cuando accessToken es null', () => {
    global.UrlFetchApp = { fetch: jest.fn() };
    obtenerMediaObjectId('abc123', 'userId', null);
    expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
  });
});

// ─── obtenerMediaObjectId — errores HTTP ─────────────────────────────────────

describe('obtenerMediaObjectId — errores HTTP', () => {
  it('retorna null cuando la API retorna HTTP 400', () => {
    global.UrlFetchApp = buildFetchMock([{ status: 400, body: { error: { message: 'Bad Request' } } }]);
    expect(obtenerMediaObjectId('abc', 'uid', 'tok')).toBeNull();
  });

  it('llama a logError con código y mensaje en HTTP 400', () => {
    global.UrlFetchApp = buildFetchMock([{ status: 400, body: { error: { message: 'Invalid token' } } }]);
    obtenerMediaObjectId('abc', 'uid', 'tok');
    expect(global.logError).toHaveBeenCalledWith(expect.stringContaining('400'));
    expect(global.logError).toHaveBeenCalledWith(expect.stringContaining('Invalid token'));
  });

  it('retorna null cuando la API retorna HTTP 500', () => {
    global.UrlFetchApp = buildFetchMock([{ status: 500, body: { error: { message: 'Server Error' } } }]);
    expect(obtenerMediaObjectId('abc', 'uid', 'tok')).toBeNull();
  });
});

// ─── obtenerMediaObjectId — shortcode encontrado ─────────────────────────────

describe('obtenerMediaObjectId — shortcode encontrado', () => {
  it('retorna el id cuando el shortcode está en la primera página', () => {
    global.UrlFetchApp = buildFetchMock([pageResponse([{ id: '111', shortcode: 'abc123' }])]);
    expect(obtenerMediaObjectId('abc123', 'uid', 'tok')).toBe('111');
  });

  it('retorna el id correcto entre múltiples items', () => {
    global.UrlFetchApp = buildFetchMock([pageResponse([
      { id: '111', shortcode: 'aaa' },
      { id: '222', shortcode: 'bbb' },
      { id: '333', shortcode: 'ccc' },
    ])]);
    expect(obtenerMediaObjectId('bbb', 'uid', 'tok')).toBe('222');
  });

  it('retorna el id cuando el shortcode está en la segunda página', () => {
    global.UrlFetchApp = buildFetchMock([
      pageResponse([{ id: '111', shortcode: 'p1' }], 'https://next.page'),
      pageResponse([{ id: '999', shortcode: 'p2' }]),
    ]);
    expect(obtenerMediaObjectId('p2', 'uid', 'tok')).toBe('999');
  });

  it('realiza 2 llamadas HTTP cuando el shortcode está en la segunda página', () => {
    global.UrlFetchApp = buildFetchMock([
      pageResponse([{ id: '111', shortcode: 'p1' }], 'https://next.page'),
      pageResponse([{ id: '999', shortcode: 'p2' }]),
    ]);
    obtenerMediaObjectId('p2', 'uid', 'tok');
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
  });
});

// ─── obtenerMediaObjectId — shortcode no encontrado ──────────────────────────

describe('obtenerMediaObjectId — shortcode no encontrado', () => {
  it('retorna null cuando el shortcode no está en ninguna página', () => {
    global.UrlFetchApp = buildFetchMock([pageResponse([{ id: '111', shortcode: 'abc' }])]);
    expect(obtenerMediaObjectId('notexists', 'uid', 'tok')).toBeNull();
  });

  it('llama a logAdvertencia con el shortcode cuando no se encuentra', () => {
    global.UrlFetchApp = buildFetchMock([pageResponse([{ id: '111', shortcode: 'abc' }])]);
    obtenerMediaObjectId('notexists', 'uid', 'tok');
    expect(global.logAdvertencia).toHaveBeenCalledWith(expect.stringContaining('notexists'));
  });

  it('no realiza más de 50 llamadas HTTP', () => {
    const infinitePage = pageResponse([{ id: '111', shortcode: 'other' }], 'https://next.page');
    global.UrlFetchApp = buildFetchMock(Array(60).fill(infinitePage));
    obtenerMediaObjectId('notfound', 'uid', 'tok');
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(50);
  });
});

// ─── obtenerYActualizarCaption ────────────────────────────────────────────────

describe('obtenerYActualizarCaption — errores HTTP en GET', () => {
  it('lanza error cuando el GET retorna HTTP 400', () => {
    global.UrlFetchApp = buildFetchMock([{ status: 400, body: { error: { message: 'Bad Request' } } }]);
    expect(() => obtenerYActualizarCaption('mediaId', '4089', 'tok')).toThrow();
  });

  it('llama a logError cuando el GET retorna HTTP 4xx', () => {
    global.UrlFetchApp = buildFetchMock([{ status: 401, body: { error: { message: 'Unauthorized' } } }]);
    try { obtenerYActualizarCaption('mediaId', '4089', 'tok'); } catch (_) {}
    expect(global.logError).toHaveBeenCalled();
  });
});

describe('obtenerYActualizarCaption — línea de disponibilidad no encontrada', () => {
  it('no realiza POST cuando la línea [✅] no está en el caption', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[❌] 4089 Fifa 16 [X360] $6K\n[❌] 4090 NBA 2K13 [X360] $5K' } },
    ]);
    obtenerYActualizarCaption('mediaId', '4091', 'tok');
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(1);
  });

  it('llama a logAdvertencia cuando la línea no se encuentra', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[❌] 4089 Fifa 16 [X360] $6K' } },
    ]);
    obtenerYActualizarCaption('mediaId', '4091', 'tok');
    expect(global.logAdvertencia).toHaveBeenCalledWith(expect.stringContaining('4091'));
  });
});

describe('obtenerYActualizarCaption — actualización exitosa', () => {
  it('realiza POST cuando la línea [✅] está en el caption', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[✅] 4089 Fifa 16 [X360] $6K\n[❌] 4090 NBA 2K13 [X360] $5K' } },
      { status: 200, body: { id: 'mediaId' } },
    ]);
    obtenerYActualizarCaption('mediaId', '4089', 'tok');
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
  });

  it('llama a logInfo cuando el POST es exitoso', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[✅] 4089 Fifa 16 [X360] $6K' } },
      { status: 200, body: { id: 'mediaId' } },
    ]);
    obtenerYActualizarCaption('mediaId', '4089', 'tok');
    expect(global.logInfo).toHaveBeenCalledWith(expect.stringContaining('4089'));
  });
});

describe('obtenerYActualizarCaption — error en POST', () => {
  it('lanza error cuando el POST retorna HTTP 400', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[✅] 4089 Fifa 16 [X360] $6K' } },
      { status: 400, body: { error: { message: 'Bad Request' } } },
    ]);
    expect(() => obtenerYActualizarCaption('mediaId', '4089', 'tok')).toThrow();
  });

  it('llama a logError cuando el POST retorna HTTP 4xx', () => {
    global.UrlFetchApp = buildFetchMock([
      { status: 200, body: { caption: '[✅] 4089 Fifa 16 [X360] $6K' } },
      { status: 500, body: { error: { message: 'Server Error' } } },
    ]);
    try { obtenerYActualizarCaption('mediaId', '4089', 'tok'); } catch (_) {}
    expect(global.logError).toHaveBeenCalled();
  });
});
