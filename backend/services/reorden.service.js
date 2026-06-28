const { getAsync, allAsync } = require('../db/db');

class ReordenService {
  async calcularNecesidadReorden(hoy) {
    const fecha = new Date(hoy);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    const diasProximos = [];
    for (let i = 1; i <= 2; i++) {
      const proxima = new Date(fecha);
      proxima.setDate(proxima.getDate() + i);
      diasProximos.push(dias[proxima.getDay()]);
    }

    const placeholders = diasProximos.map(() => '?').join(',');
    const pedidosResult = await getAsync(
      `SELECT SUM(pa.cantidad_canales) as total_pedidos
       FROM pedidos_agendados pa
       WHERE pa.dia IN (${placeholders}) AND pa.activo = TRUE`,
      diasProximos
    );

    const totalPedidos = pedidosResult?.total_pedidos || 0;

    const inventarioResult = await getAsync(
      'SELECT COUNT(*) as total FROM canales WHERE estado = \'en_reefer\''
    );
    const totalInventario = inventarioResult.total;

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

  async obtenerHistorialDemanda(dias = 30) {
    return allAsync(
      `SELECT
        fecha_pedido,
        COUNT(*) as cantidad_pedidos,
        SUM(cantidad_canales) as total_canales,
        ROUND(AVG(cantidad_canales), 2) as promedio_canales
      FROM pedidos
      WHERE fecha_pedido >= date('now', '-${dias} days')
      GROUP BY fecha_pedido
      ORDER BY fecha_pedido DESC`
    );
  }

  async proyectarAgotamiento() {
    const data = await getAsync(`
      SELECT
        COUNT(*) as canales_actuales,
        (SELECT SUM(cantidad_canales)
         FROM pedidos_agendados
         WHERE activo = TRUE) as demanda_semanal_agendada
    `);

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
