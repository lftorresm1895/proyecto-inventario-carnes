const { runAsync, getAsync, allAsync } = require('../db/db');

class ClientesService {
  async crearCliente(nombre, telefono, email) {
    const result = await runAsync(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      [nombre, telefono, email]
    );
    return getAsync('SELECT * FROM clientes WHERE id = ?', [result.lastInsertRowid]);
  }

  async obtenerClientes() {
    return allAsync(`
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.email
      FROM clientes c
      ORDER BY c.nombre
    `);
  }

  async obtenerClientePorId(clienteId) {
    return getAsync('SELECT * FROM clientes WHERE id = ?', [clienteId]);
  }

  async crearPedidoAgendado(clienteId, dia, cantidad_canales) {
    const result = await runAsync(
      `INSERT INTO pedidos_agendados (cliente_id, dia, cantidad_canales, activo)
       VALUES (?, ?, ?, TRUE)`,
      [clienteId, dia, cantidad_canales]
    );
    return getAsync('SELECT * FROM pedidos_agendados WHERE id = ?', [result.lastInsertRowid]);
  }

  async obtenerPedidosAgendados() {
    return allAsync(`
      SELECT
        pa.id,
        pa.dia,
        pa.cantidad_canales,
        c.nombre as cliente_nombre,
        c.telefono,
        pa.activo
      FROM pedidos_agendados pa
      JOIN clientes c ON pa.cliente_id = c.id
      ORDER BY
        CASE
          WHEN pa.dia = 'lunes' THEN 1
          WHEN pa.dia = 'miercoles' THEN 3
          WHEN pa.dia = 'viernes' THEN 5
          ELSE 7
        END,
        c.nombre
    `);
  }

  async editarPedidoAgendado(pedidoAgendadoId, cantidad_canales, activo) {
    await runAsync(
      `UPDATE pedidos_agendados SET cantidad_canales = ?, activo = ? WHERE id = ?`,
      [cantidad_canales, activo, pedidoAgendadoId]
    );
    return getAsync('SELECT * FROM pedidos_agendados WHERE id = ?', [pedidoAgendadoId]);
  }

  async eliminarPedidoAgendado(pedidoAgendadoId) {
    await runAsync('DELETE FROM pedidos_agendados WHERE id = ?', [pedidoAgendadoId]);
    return { id: pedidoAgendadoId };
  }
}

module.exports = new ClientesService();
