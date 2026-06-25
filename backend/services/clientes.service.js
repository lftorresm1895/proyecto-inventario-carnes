const pool = require('../db/db');

class ClientesService {
  // Crear cliente
  async crearCliente(nombre, telefono, email) {
    const query = `
      INSERT INTO clientes (nombre, telefono, email)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, telefono, email]);
    return result.rows[0];
  }

  // Obtener todos los clientes
  async obtenerClientes() {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.email,
        json_agg(
          json_build_object(
            'dia', pa.dia,
            'cantidad_canales', pa.cantidad_canales,
            'activo', pa.activo
          )
        ) FILTER (WHERE pa.id IS NOT NULL) as pedidos_agendados
      FROM clientes c
      LEFT JOIN pedidos_agendados pa ON c.id = pa.cliente_id
      GROUP BY c.id, c.nombre, c.telefono, c.email
      ORDER BY c.nombre
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener cliente por ID
  async obtenerClientePorId(clienteId) {
    const query = `
      SELECT *
      FROM clientes
      WHERE id = $1
    `;
    const result = await pool.query(query, [clienteId]);
    return result.rows[0];
  }

  // Crear pedido agendado
  async crearPedidoAgendado(clienteId, dia, cantidad_canales) {
    const query = `
      INSERT INTO pedidos_agendados (cliente_id, dia, cantidad_canales, activo)
      VALUES ($1, $2, $3, TRUE)
      RETURNING *
    `;
    const result = await pool.query(query, [clienteId, dia, cantidad_canales]);
    return result.rows[0];
  }

  // Obtener pedidos agendados
  async obtenerPedidosAgendados() {
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
    const result = await pool.query(query);
    return result.rows;
  }

  // Editar pedido agendado
  async editarPedidoAgendado(pedidoAgendadoId, cantidad_canales, activo) {
    const query = `
      UPDATE pedidos_agendados
      SET cantidad_canales = $2, activo = $3
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [pedidoAgendadoId, cantidad_canales, activo]);
    return result.rows[0];
  }

  // Eliminar pedido agendado
  async eliminarPedidoAgendado(pedidoAgendadoId) {
    const query = 'DELETE FROM pedidos_agendados WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [pedidoAgendadoId]);
    return result.rows[0];
  }
}

module.exports = new ClientesService();
