const { runAsync, getAsync, allAsync } = require('../db/db');

class PickingService {
  async generarPickingList(fecha) {
    const fecha_date = new Date(fecha);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia_nombre = dias[fecha_date.getDay()];

    const pedidosAgendados = await allAsync(
      `SELECT
        c.id as cliente_id,
        c.nombre,
        c.telefono,
        pa.cantidad_canales
      FROM pedidos_agendados pa
      JOIN clientes c ON pa.cliente_id = c.id
      WHERE pa.dia = ? AND pa.activo = TRUE`,
      [dia_nombre]
    );

    const canalesDisponibles = await allAsync(`
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
    `);

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
      const pedidoResult = await runAsync(
        `INSERT INTO pedidos (cliente_id, fecha_pedido, cantidad_canales)
         VALUES (?, ?, ?)`,
        [clienteId, fecha_pedido, canalesIds.length]
      );

      const pedidoId = pedidoResult.lastInsertRowid;
      let pesoTotal = 0;

      for (const canalId of canalesIds) {
        await runAsync(
          `UPDATE canales
           SET estado = 'vendido', fecha_salida = datetime('now'), cliente_id = ?
           WHERE id = ?`,
          [clienteId, canalId]
        );

        const canal = await getAsync('SELECT peso_lbs FROM canales WHERE id = ?', [canalId]);
        pesoTotal += parseFloat(canal.peso_lbs);

        await runAsync(
          'INSERT INTO pedido_detalles (pedido_id, canal_id, peso_lbs) VALUES (?, ?, ?)',
          [pedidoId, canalId, canal.peso_lbs]
        );
      }

      await runAsync('UPDATE pedidos SET peso_total_lbs = ? WHERE id = ?', [pesoTotal, pedidoId]);

      return { pedidoId, pesoTotal };
    } catch (error) {
      throw new Error(`Error al confirmar picking: ${error.message}`);
    }
  }

  async obtenerDetallePedido(pedidoId) {
    return getAsync(
      `SELECT
        p.id,
        c.nombre as cliente,
        p.fecha_pedido,
        p.cantidad_canales,
        p.peso_total_lbs,
        p.estado
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?`,
      [pedidoId]
    );
  }
}

module.exports = new PickingService();
