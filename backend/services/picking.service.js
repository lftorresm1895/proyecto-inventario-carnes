const pool = require('../db/db');

class PickingService {
  // Genera lista de picking para el día (basada en pedidos agendados + ad-hoc)
  async generarPickingList(fecha) {
    // Obtener qué día de la semana es (lunes=0, domingo=6)
    const fecha_date = new Date(fecha);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia_nombre = dias[fecha_date.getDay()];

    // Pedidos agendados para hoy
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

    const pedidosAgendados = await pool.query(queryPedidosAgendados, [dia_nombre]);

    // Obtener canales disponibles ordenados por LIFO (más recientes primero dentro de cada riel)
    const queryCanalesDisponibles = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        EXTRACT(DAY FROM (NOW() - fecha_entrada)) as dias_en_frio
      FROM canales
      WHERE estado = 'en_reefer'
      ORDER BY ubicacion_riel, fecha_entrada DESC
    `;

    const canalesDisponibles = await pool.query(queryCanalesDisponibles);

    // Armar picking list: asignar canales a cada cliente
    const pickingList = [];
    let canalIndex = 0;

    for (const pedido of pedidosAgendados.rows) {
      const canalesAsignados = [];
      let cantidad = pedido.cantidad_canales;

      while (cantidad > 0 && canalIndex < canalesDisponibles.rows.length) {
        const canal = canalesDisponibles.rows[canalIndex];
        canalesAsignados.push(canal);
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

  // Confirmar picking: crear pedido y marcar canales como vendidos
  async confirmarPicking(clienteId, canalesIds, fecha_pedido) {
    try {
      // Insertar pedido
      const queryPedido = `
        INSERT INTO pedidos (cliente_id, fecha_pedido, cantidad_canales)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const cantidad = canalesIds.length;
      const pedidoResult = await pool.query(queryPedido, [clienteId, fecha_pedido, cantidad]);
      const pedidoId = pedidoResult.rows[0].id;

      // Marcar canales como vendidos y asociar al pedido
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

        // Insertar en detalles de pedido
        await pool.query(
          'INSERT INTO pedido_detalles (pedido_id, canal_id, peso_lbs) VALUES ($1, $2, $3)',
          [pedidoId, canalId, canalResult.rows[0].peso_lbs]
        );
      }

      // Actualizar peso total del pedido
      await pool.query(
        'UPDATE pedidos SET peso_total_lbs = $1 WHERE id = $2',
        [pesoTotal, pedidoId]
      );

      return { pedidoId, pesoTotal };
    } catch (error) {
      throw new Error(`Error al confirmar picking: ${error.message}`);
    }
  }

  // Obtener detalle de un pedido
  async obtenerDetallePedido(pedidoId) {
    const query = `
      SELECT
        p.id,
        c.nombre as cliente,
        p.fecha_pedido,
        p.cantidad_canales,
        p.peso_total_lbs,
        p.estado,
        json_agg(
          json_build_object(
            'canal_id', pd.canal_id,
            'peso_lbs', pd.peso_lbs
          )
        ) as canales
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
      WHERE p.id = $1
      GROUP BY p.id, c.nombre, p.fecha_pedido, p.cantidad_canales, p.peso_total_lbs, p.estado
    `;
    const result = await pool.query(query, [pedidoId]);
    return result.rows[0];
  }
}

module.exports = new PickingService();
