const pool = require('../db/db');

class ReordenService {
  // Calcula si hay que pedir canales hoy (lead time 2 días)
  async calcularNecesidadReorden(hoy) {
    const fecha = new Date(hoy);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    // Determinar qué días necesitan inventario en los próximos 2 días
    const diasProximos = [];
    for (let i = 1; i <= 2; i++) {
      const proxima = new Date(fecha);
      proxima.setDate(proxima.getDate() + i);
      diasProximos.push(dias[proxima.getDay()]);
    }

    // Obtener pedidos agendados para los próximos 2 días
    const query = `
      SELECT
        SUM(pa.cantidad_canales) as total_pedidos
      FROM pedidos_agendados pa
      WHERE pa.dia = ANY($1::text[]) AND pa.activo = TRUE
    `;

    const pedidosResult = await pool.query(query, [diasProximos]);
    const totalPedidos = pedidosResult.rows[0]?.total_pedidos || 0;

    // Obtener inventario actual
    const inventarioResult = await pool.query(
      'SELECT COUNT(*) as total FROM canales WHERE estado = \'en_reefer\''
    );
    const totalInventario = parseInt(inventarioResult.rows[0].total);

    const limiteCapacidad = 180;
    const disponible = limiteCapacidad - totalInventario;
    const necesario = Math.max(0, totalPedidos - totalInventario);

    return {
      total_pedidos_proximos_2_dias: totalPedidos,
      inventario_actual: totalInventario,
      capacidad_disponible: disponible,
      canales_a_pedir: necesario > 0 ? necesario : 0,
      alerta: necesario > 0,
      mensaje: necesario > 0
        ? `⚠️ PEDIR HOY: ${necesario} canales para los próximos 2 días (lead time 2 días)`
        : '✓ Inventario suficiente',
    };
  }

  // Obtener historial de pedidos para estimar demanda
  async obtenerHistorialDemanda(dias = 30) {
    const query = `
      SELECT
        fecha_pedido,
        COUNT(*) as cantidad_pedidos,
        SUM(cantidad_canales) as total_canales,
        AVG(cantidad_canales) as promedio_canales
      FROM pedidos
      WHERE fecha_pedido >= NOW() - INTERVAL '1 day' * $1
      GROUP BY fecha_pedido
      ORDER BY fecha_pedido DESC
    `;
    const result = await pool.query(query, [dias]);
    return result.rows;
  }

  // Proyección de agotamiento de inventario
  async proyectarAgotamiento() {
    const query = `
      SELECT
        COUNT(*) as canales_actuales,
        (SELECT SUM(cantidad_canales)
         FROM pedidos_agendados
         WHERE activo = TRUE) as demanda_semanal_agendada
    `;
    const result = await pool.query(query);
    const data = result.rows[0];

    const demandaSemanal = data.demanda_semanal_agendada || 0;
    const diasParaAgotamiento = demandaSemanal > 0
      ? Math.ceil((data.canales_actuales / demandaSemanal) * 7)
      : 'N/A';

    return {
      canales_actuales: data.canales_actuales,
      demanda_semanal: demandaSemanal,
      dias_hasta_agotamiento: diasParaAgotamiento,
    };
  }
}

module.exports = new ReordenService();
