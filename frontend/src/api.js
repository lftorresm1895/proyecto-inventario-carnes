const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  // Inventario
  registrarEntrada: async (canales) => {
    const res = await fetch(`${API_URL}/inventario/entrada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canales }),
    });
    return res.json();
  },

  obtenerInventario: async () => {
    const res = await fetch(`${API_URL}/inventario/actual`);
    return res.json();
  },

  obtenerResumen: async () => {
    const res = await fetch(`${API_URL}/inventario/resumen`);
    return res.json();
  },

  sugerirRiel: async () => {
    const res = await fetch(`${API_URL}/inventario/sugerir-riel`);
    return res.json();
  },

  // Picking
  obtenerPickingList: async (fecha) => {
    const res = await fetch(`${API_URL}/picking/lista?fecha=${fecha}`);
    return res.json();
  },

  confirmarPicking: async (clienteId, canalesIds, fechaPedido) => {
    const res = await fetch(`${API_URL}/picking/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: clienteId,
        canales_ids: canalesIds,
        fecha_pedido: fechaPedido,
      }),
    });
    return res.json();
  },

  // Clientes
  obtenerClientes: async () => {
    const res = await fetch(`${API_URL}/clientes`);
    return res.json();
  },

  crearCliente: async (nombre, telefono, email, preferencia) => {
    const res = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, email, preferencia }),
    });
    return res.json();
  },

  crearPedidoAgendado: async (clienteId, dia, cantidad) => {
    const res = await fetch(`${API_URL}/clientes/${clienteId}/pedidos-agendados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia, cantidad_canales: cantidad }),
    });
    return res.json();
  },

  obtenerPedidosAgendados: async () => {
    const res = await fetch(`${API_URL}/clientes/agendados/lista`);
    return res.json();
  },

  // Reorden
  obtenerAlertaReorden: async () => {
    const res = await fetch(`${API_URL}/reorden/alerta`);
    return res.json();
  },

  obtenerProyeccion: async () => {
    const res = await fetch(`${API_URL}/reorden/proyeccion`);
    return res.json();
  },
};
