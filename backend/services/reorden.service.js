const db = require('../db/db');

class ReordenService {
  calcularNecesidadReorden(hoy) {
    const fecha = new Date(hoy);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    const diasProximos = [];
    for (let i = 1; i <= 2; i++) {
      const proxima = new Date(fecha);
      proxima.setDate(proxima.getDate() + i);
      diasProximos.push(dias[proxima.getDay()]);
    }

    const queryPedidosAgendados = `
      SELECT
        SUM(pa.cantidad_canales) as total_pedidos
      FROM pedidos_agendados pa
      WHERE pa.dia IN (${diasProximos.map(() => '?').join(',')}) AND pa.activo = TRUE
    `;

    const pedidosResult = db.prepare(queryPedidosAgendados).get(...diasProximos);
    const totalPedidos = pedidosResult?.total_pedidos || 0;

    const inventarioResult = db.prepare(
      'SELECT COUNT(*) as total FROM canales WHERE estado = \'en_reefer\''
    ).get();
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

  obtenerHistorialDemanda(dias = 30) {
    const query = `
      SELECT
        fecha_pedido,
        COUNT(*) as cantidad_pedidos,
        SUM(cantidad_canales) as total_canales,
        ROUND(AVG(cantidad_canales), 2) as promedio_canales
      FROM pedidos
      WHERE fecha_pedido >= date('now', '-${dias} days')
      GROUP BY fecha_pedido
      ORDER BY fecha_pedido DESC
    `;
    return db.prepare(query).all();
  }

  proyectarAgotamiento() {
    const query = `
      SELECT
        COUNT(*) as canales_actuales,
        (SELECT SUM(cantidad_canales)
         FROM pedidos_agendados
         WHERE activo = TRUE) as demanda_semanal_agendada
    `;
    const data = db.prepare(query).get();

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
