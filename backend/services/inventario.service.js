const { runAsync, getAsync, allAsync } = require('../db/db');

class InventarioService {
  async registrarEntrada(canales) {
    const results = [];

    for (const canal of canales) {
      const result = await runAsync(
        `INSERT INTO canales (numero_canal, peso_lbs, clasificacion, ubicacion_riel, estado)
         VALUES (?, ?, ?, ?, 'en_reefer')`,
        [canal.numero_canal, canal.peso_lbs, canal.clasificacion || 'normal', canal.ubicacion_riel]
      );
      results.push({ id: result.lastInsertRowid, ...canal });
    }

    return results;
  }

  async obtenerInventarioActual() {
    return allAsync(`
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        CAST((julianday('now') - julianday(fecha_entrada)) AS INTEGER) as dias_en_frio,
        estado
      FROM canales
      WHERE estado = 'en_reefer'
      ORDER BY ubicacion_riel, fecha_entrada ASC
    `);
  }

  async obtenerCanalPorRiel(riel) {
    return allAsync(
      `SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        CAST((julianday('now') - julianday(fecha_entrada)) AS INTEGER) as dias_en_frio
      FROM canales
      WHERE ubicacion_riel = ? AND estado = 'en_reefer'
      ORDER BY fecha_entrada ASC`,
      [riel]
    );
  }

  async obtenerResumenInventario() {
    return getAsync(`
      SELECT
        COUNT(*) as total_canales,
        ROUND(SUM(peso_lbs), 2) as peso_total_lbs,
        COUNT(CASE WHEN clasificacion = 'light' THEN 1 END) as canales_light,
        COUNT(CASE WHEN clasificacion = 'normal' THEN 1 END) as canales_normal
      FROM canales
      WHERE estado = 'en_reefer'
    `);
  }

  async marcarComoVendido(canalId, clienteId) {
    await runAsync(
      `UPDATE canales
       SET estado = 'vendido', fecha_salida = datetime('now'), cliente_id = ?
       WHERE id = ?`,
      [clienteId, canalId]
    );
    return getAsync('SELECT * FROM canales WHERE id = ?', [canalId]);
  }

  async registrarSubproducto(tipo, cantidad, peso_lbs, ubicacion) {
    const result = await runAsync(
      `INSERT INTO subproductos (tipo, cantidad, peso_lbs, ubicacion, estado)
       VALUES (?, ?, ?, ?, 'disponible')`,
      [tipo, cantidad, peso_lbs, ubicacion]
    );
    return getAsync('SELECT * FROM subproductos WHERE id = ?', [result.lastInsertRowid]);
  }

  async obtenerSubproductosDisponibles() {
    return allAsync(`
      SELECT *
      FROM subproductos
      WHERE estado = 'disponible'
      ORDER BY tipo, fecha_entrada ASC
    `);
  }
}

module.exports = new InventarioService();
