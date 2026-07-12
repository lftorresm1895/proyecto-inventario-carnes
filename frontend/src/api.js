const API_URL = 'https://inventario-carnes-backend.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.reload();
}

async function authFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  crearUsuario: (nombre, username, password, rol) =>
    authFetch('/auth/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nombre, username, password, rol }),
    }),

  obtenerUsuarios: () => authFetch('/auth/usuarios'),

  cambiarPassword: (password_actual, password_nueva) =>
    authFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ password_actual, password_nueva }),
    }),

  // Inventario
  registrarEntrada: (canales) =>
    authFetch('/inventario/entrada', {
      method: 'POST',
      body: JSON.stringify({ canales }),
    }),

  obtenerInventario: () => authFetch('/inventario/actual'),
  obtenerResumen: () => authFetch('/inventario/resumen'),
  sugerirRiel: () => authFetch('/inventario/sugerir-riel'),
  obtenerEntradas: () => authFetch('/inventario/entradas'),
  obtenerCanalesEntrada: (fecha) => authFetch(`/inventario/entradas/${fecha}`),

  // Picking
  obtenerPickingList: (fecha) => authFetch(`/picking/lista?fecha=${fecha}`),

  confirmarPicking: (clienteId, canalesIds, fechaPedido) =>
    authFetch('/picking/confirmar', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: clienteId,
        canales_ids: canalesIds,
        fecha_pedido: fechaPedido,
      }),
    }),

  // Clientes
  obtenerClientes: () => authFetch('/clientes'),

  crearCliente: (datos) =>
    authFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  editarCliente: (clienteId, datos) =>
    authFetch(`/clientes/${clienteId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  crearPedidoAgendado: (clienteId, dia, cantidad) =>
    authFetch(`/clientes/${clienteId}/pedidos-agendados`, {
      method: 'POST',
      body: JSON.stringify({ dia, cantidad_canales: cantidad }),
    }),

  obtenerPedidosAgendados: () => authFetch('/clientes/agendados/lista'),

  obtenerCuenta: (clienteId) => authFetch(`/clientes/${clienteId}/cuenta`),

  registrarAbono: (clienteId, monto, descripcion) =>
    authFetch(`/clientes/${clienteId}/abono`, {
      method: 'POST',
      body: JSON.stringify({ monto, descripcion }),
    }),

  // Reorden
  obtenerAlertaReorden: () => authFetch('/reorden/alerta'),
  obtenerProyeccion: () => authFetch('/reorden/proyeccion'),
};
