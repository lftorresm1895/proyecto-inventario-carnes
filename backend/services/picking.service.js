const db = require('../db/db');

class PickingService {
  generarPickingList(fecha) {
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
      WHERE pa.dia = ? AND pa.activo = TRUE
    `;

    const pedidosAgendados = db.prepare(queryPedidosAgendados).all(dia_nombre);

    const queryCanalesDisponibles = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        CAST((julianday('now') - julianday(fecha_entrada)) AS INTEGER) as dias_en_frio
      FROM canales
      WHERE estado = 'en_reefer'
      ORDER BY ubicacion_riel, fecha_entrada DESC
    `;

    const canalesDisponibles = db.prepare(queryCanalesDisponibles).all();

    const pickingList = [];
    let canalIndex = 0;

    for (const pedido of pedidosAgendados) {
      const canalesAsignados = [];
      let cantidad = pedido.cantidad_canales;

      while (cantidad > 0 && canalIndex < canalesDisponibles.length) {
        const canal = canalesDisponibles[canalIndex];
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

  confirmarPicking(clienteId, canalesIds, fecha_pedido) {
    try {
      const insertPedido = db.prepare(`
        INSERT INTO pedidos (cliente_id, fecha_pedido, cantidad_canales)
        VALUES (?, ?, ?)
      `);

      const cantidad = canalesIds.length;
      const pedidoResult = insertPedido.run(clienteId, fecha_pedido, cantidad);
      const pedidoId = pedidoResult.lastInsertRowid;

      let pesoTotal = 0;
      const updateCanal = db.prepare(`
        UPDATE canales
        SET estado = 'vendido', fecha_salida = datetime('now'), cliente_id = ?
        WHERE id = ?
      `);

      const insertDetalle = db.prepare(
        'INSERT INTO pedido_detalles (pedido_id, canal_id, peso_lbs) VALUES (?, ?, ?)'
      );

      const getCanal = db.prepare('SELECT peso_lbs FROM canales WHERE id = ?');
      const updatePeso = db.prepare('UPDATE pedidos SET peso_total_lbs = ? WHERE id = ?');

      const confirmMany = db.transaction(() => {
        for (const canalId of canalesIds) {
          updateCanal.run(clienteId, canalId);
          const canal = getCanal.get(canalId);
          pesoTotal += parseFloat(canal.peso_lbs);
          insertDetalle.run(pedidoId, canalId, canal.peso_lbs);
        }
        updatePeso.run(pesoTotal, pedidoId);
      });

      confirmMany();

      return { pedidoId, pesoTotal };
    } catch (error) {
      throw new Error(`Error al confirmar picking: ${error.message}`);
    }
  }

  obtenerDetallePedido(pedidoId) {
    const query = `
      SELECT
        p.id,
        c.nombre as cliente,
        p.fecha_pedido,
        p.cantidad_canales,
        p.peso_total_lbs,
        p.estado,
        json_group_array(
          json_object(
            'canal_id', pd.canal_id,
            'peso_lbs', pd.peso_lbs
          )
        ) as canales
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
      WHERE p.id = ?
      GROUP BY p.id, c.nombre, p.fecha_pedido, p.cantidad_canales, p.peso_total_lbs, p.estado
    `;
    return db.prepare(query).get(pedidoId);
  }
}

module.exports = new PickingService();
