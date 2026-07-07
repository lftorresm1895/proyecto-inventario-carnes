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
        c.preferencia,
        pa.cantidad_canales
      FROM pedidos_agendados pa
      JOIN clientes c ON pa.cliente_id = c.id
      WHERE pa.dia = $1 AND pa.activo = TRUE
    `;

    const pedidosResult = await pool.query(queryPedidosAgendados, [dia_nombre]);
    const pedidosAgendados = pedidosResult.rows;

    // Los clientes con preferencia estricta (light/normal) escogen primero,
    // para que los de "cualquiera" no les quiten los canales que necesitan
    pedidosAgendados.sort((a, b) => {
      const rank = (p) => (p === 'cualquiera' || !p ? 1 : 0);
      return rank(a.preferencia) - rank(b.preferencia);
    });

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
      ORDER BY fecha_entrada DESC, ubicacion_riel
    `;

    const canalesResult = await pool.query(queryCanalesDisponibles);
    let disponibles = canalesResult.rows;

    const pickingList = [];

    for (const pedido of pedidosAgendados) {
      const pref = pedido.preferencia || 'cualquiera';
      const cumplePreferencia = (canal) =>
        pref === 'cualquiera' || canal.clasificacion === pref;

      const canalesAsignados = [];
      const restantes = [];

      for (const canal of disponibles) {
        if (canalesAsignados.length < pedido.cantidad_canales && cumplePreferencia(canal)) {
          canalesAsignados.push(canal);
        } else {
          restantes.push(canal);
        }
      }
      disponibles = restantes;

      const faltantes = pedido.cantidad_canales - canalesAsignados.length;

      pickingList.push({
        cliente_id: pedido.cliente_id,
        cliente_nombre: pedido.nombre,
        telefono: pedido.telefono,
        preferencia: pref,
        cantidad_pedida: pedido.cantidad_canales,
        faltantes: faltantes > 0 ? faltantes : 0,
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
