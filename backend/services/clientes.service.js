const pool = require('../db/db');

class ClientesService {
  async crearCliente(nombre, telefono, email, preferencia = 'cualquiera', precio_lb = 0, cuenta_activa = false) {
    const query = `
      INSERT INTO clientes (nombre, telefono, email, preferencia, precio_lb, cuenta_activa)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, telefono, email, preferencia, precio_lb, cuenta_activa]);
    return result.rows[0];
  }

  async obtenerCuenta(clienteId) {
    const movimientos = await pool.query(
      `SELECT id, tipo, monto, descripcion, pedido_id, creado_por, fecha
       FROM cuenta_movimientos
       WHERE cliente_id = $1
       ORDER BY fecha DESC`,
      [clienteId]
    );

    const saldoResult = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN tipo = 'cargo' THEN monto ELSE -monto END), 0) as saldo
       FROM cuenta_movimientos
       WHERE cliente_id = $1`,
      [clienteId]
    );

    return {
      saldo: parseFloat(saldoResult.rows[0].saldo),
      movimientos: movimientos.rows,
    };
  }

  async registrarAbono(clienteId, monto, descripcion, usuario = null) {
    const result = await pool.query(
      `INSERT INTO cuenta_movimientos (cliente_id, tipo, monto, descripcion, creado_por)
       VALUES ($1, 'abono', $2, $3, $4)
       RETURNING *`,
      [clienteId, monto, descripcion || 'Abono', usuario]
    );
    return result.rows[0];
  }

  async obtenerClientes() {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.email,
        c.preferencia,
        c.precio_lb,
        c.cuenta_activa,
        COALESCE((
          SELECT SUM(CASE WHEN m.tipo = 'cargo' THEN m.monto ELSE -m.monto END)
          FROM cuenta_movimientos m
          WHERE m.cliente_id = c.id
        ), 0) as saldo,
        json_agg(
          json_build_object(
            'id', pa.id,
            'dia', pa.dia,
            'cantidad_canales', pa.cantidad_canales,
            'activo', pa.activo
          )
        ) FILTER (WHERE pa.id IS NOT NULL) as pedidos_agendados
      FROM clientes c
      LEFT JOIN pedidos_agendados pa ON c.id = pa.cliente_id
      GROUP BY c.id, c.nombre, c.telefono, c.email, c.preferencia, c.precio_lb, c.cuenta_activa
      ORDER BY c.nombre
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async obtenerClientePorId(clienteId) {
    const query = `
      SELECT *
      FROM clientes
      WHERE id = $1
    `;
    const result = await pool.query(query, [clienteId]);
    return result.rows[0];
  }

  async crearPedidoAgendado(clienteId, dia, cantidad_canales) {
    const query = `
      INSERT INTO pedidos_agendados (cliente_id, dia, cantidad_canales, activo)
      VALUES ($1, $2, $3, TRUE)
      RETURNING *
    `;
    const result = await pool.query(query, [clienteId, dia, cantidad_canales]);
    return result.rows[0];
  }

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

  async eliminarPedidoAgendado(pedidoAgendadoId) {
    await pool.query('DELETE FROM pedidos_agendados WHERE id = $1', [pedidoAgendadoId]);
    return { id: pedidoAgendadoId };
  }
}

module.exports = new ClientesService();
