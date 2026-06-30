const pool = require('../db/db');

class PickingService {
  async generarPickingList(fecha) {
    const fecha_date = new Date(fecha);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia_nombre = dias[fecha_date.getDay()];

    const queryPedidosAgendados = `
      SELECT
        c.id as cliente_id,
        c.nombre,
        c.telefono,
        pa.cantidad_canales
      FROM pedidos_agendados pa
      JOIN clientes c ON pa.cliente_id = c.id
      WHERE pa.dia = $1 AND pa.activo = TRUE
    `;

    const pedidosResult = await pool.query(queryPedidosAgendados, [dia_nombre]);
    const pedidosAgendados = pedidosResult.rows;

    const queryCanalesDisponibles = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        EXTRACT(DAY FROM (NOW() - fecha_entrada))::INTEGER as dias_en_frio
      FROM canales
      WHERE estado = 'en_reefer'
      ORDER BY ubicacion_riel, fecha_entrada DESC
    `;

    const canalesResult = await pool.query(queryCanalesDisponibles);
    const canalesDisponibles = canalesResult.rows;

    const pickingList = [];
    let canalIndex = 0;

    for (const pedido of pedidosAgendados) {
      const canalesAsignados = [];
      let cantidad = pedido.cantidad_canales;

      while (cantidad > 0 && canalIndex < canalesDisponibles.length) {
        canalesAsignados.push(canalesDisponibles[canalIndex]);
        canalIndex++;
        cantidad--;
      }

      pickingList.push({
        cliente_id: pedido.cliente_id,
        cliente_nombre: pedido.nombre,
        telefono: pedido.telefono,
        cantidad_pedida: pedido.cantidad_canales,
        canales: canalesAsignados,
        peso_total: canalesAsignados.reduce((sum, c) => sum + parseFloat(c.peso_lbs), 0),
      });
    }

    return pickingList;
  }

  async confirmarPicking(clienteId, canalesIds, fecha_pedido) {
    try {
      const queryPedido = `
        INSERT INTO pedidos (cliente_id, fecha_pedido, cantidad_canales)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const cantidad = canalesIds.length;
      const pedidoResult = await pool.query(queryPedido, [clienteId, fecha_pedido, cantidad]);
      const pedidoId = pedidoResult.rows[0].id;

      let pesoTotal = 0;
      for (const canalId of canalesIds) {
        const queryActualizar = `
          UPDATE canales
          SET estado = 'vendido', fecha_salida = NOW(), cliente_id = $2
          WHERE id = $1
          RETURNING peso_lbs
        `;
        const canalResult = await pool.query(queryActualizar, [canalId, clienteId]);
        pesoTotal += parseFloat(canalResult.rows[0].peso_lbs);

        await pool.query(
          'INSERT INTO pedido_detalles (pedido_id, canal_id, peso_lbs) VALUES ($1, $2, $3)',
          [pedidoId, canalId, canalResult.rows[0].peso_lbs]
        );
      }

      await pool.query(
        'UPDATE pedidos SET peso_total_lbs = $1 WHERE id = $2',
        [pesoTotal, pedidoId]
      );

      return { pedidoId, pesoTotal };
    } catch (error) {
      throw new Error(`Error al confirmar picking: ${error.message}`);
    }
  }

  async obtenerDetallePedido(pedidoId) {
    const query = `
      SELECT
        p.id,
        c.nombre as cliente,
        p.fecha_pedido,
        p.cantidad_canales,
        p.peso_total_lbs,
        p.estado
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [pedidoId]);
    return result.rows[0];
  }
}

module.exports = new PickingService();
