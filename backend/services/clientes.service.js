const db = require('../db/db');

class ClientesService {
  crearCliente(nombre, telefono, email) {
    const query = `
      INSERT INTO clientes (nombre, telefono, email)
      VALUES (?, ?, ?)
    `;
    const result = db.prepare(query).run(nombre, telefono, email);
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
  }

  obtenerClientes() {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.email,
        json_group_array(
          CASE WHEN pa.id IS NOT NULL THEN json_object(
            'id', pa.id,
            'dia', pa.dia,
            'cantidad_canales', pa.cantidad_canales,
            'activo', pa.activo
          ) END
        ) as pedidos_agendados
      FROM clientes c
      LEFT JOIN pedidos_agendados pa ON c.id = pa.cliente_id
      GROUP BY c.id, c.nombre, c.telefono, c.email
      ORDER BY c.nombre
    `;
    return db.prepare(query).all();
  }

  obtenerClientePorId(clienteId) {
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
  }

  crearPedidoAgendado(clienteId, dia, cantidad_canales) {
    const query = `
      INSERT INTO pedidos_agendados (cliente_id, dia, cantidad_canales, activo)
      VALUES (?, ?, ?, TRUE)
    `;
    const result = db.prepare(query).run(clienteId, dia, cantidad_canales);
    return db.prepare('SELECT * FROM pedidos_agendados WHERE id = ?').get(result.lastInsertRowid);
  }

  obtenerPedidosAgendados() {
    const query = `
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
    `;
    return db.prepare(query).all();
  }

  editarPedidoAgendado(pedidoAgendadoId, cantidad_canales, activo) {
    const query = `
      UPDATE pedidos_agendados
      SET cantidad_canales = ?, activo = ?
      WHERE id = ?
    `;
    db.prepare(query).run(cantidad_canales, activo, pedidoAgendadoId);
    return db.prepare('SELECT * FROM pedidos_agendados WHERE id = ?').get(pedidoAgendadoId);
  }

  eliminarPedidoAgendado(pedidoAgendadoId) {
    db.prepare('DELETE FROM pedidos_agendados WHERE id = ?').run(pedidoAgendadoId);
    return { id: pedidoAgendadoId };
  }
}

module.exports = new ClientesService();
