const db = require('../db/db');

class InventarioService {
  registrarEntrada(canales) {
    const stmt = db.prepare(`
      INSERT INTO canales (numero_canal, peso_lbs, clasificacion, ubicacion_riel, estado)
      VALUES (?, ?, ?, ?, 'en_reefer')
    `);

    const results = [];
    const insertMany = db.transaction((items) => {
      for (const canal of items) {
        const result = stmt.run(
          canal.numero_canal,
          canal.peso_lbs,
          canal.clasificacion || 'normal',
          canal.ubicacion_riel
        );
        results.push({ id: result.lastInsertRowid, ...canal });
      }
    });

    insertMany(canales);
    return results;
  }

  obtenerInventarioActual() {
    const query = `
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
    `;
    return db.prepare(query).all();
  }

  obtenerCanalPorRiel(riel) {
    const query = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        CAST((julianday('now') - julianday(fecha_entrada)) AS INTEGER) as dias_en_frio
      FROM canales
      WHERE ubicacion_riel = ? AND estado = 'en_reefer'
      ORDER BY fecha_entrada ASC
    `;
    return db.prepare(query).all(riel);
  }

  obtenerResumenInventario() {
    const query = `
      SELECT
        COUNT(*) as total_canales,
        ROUND(SUM(peso_lbs), 2) as peso_total_lbs,
        COUNT(CASE WHEN clasificacion = 'light' THEN 1 END) as canales_light,
        COUNT(CASE WHEN clasificacion = 'normal' THEN 1 END) as canales_normal
      FROM canales
      WHERE estado = 'en_reefer'
    `;
    return db.prepare(query).get();
  }

  marcarComoVendido(canalId, clienteId) {
    const query = `
      UPDATE canales
      SET estado = 'vendido', fecha_salida = datetime('now'), cliente_id = ?
      WHERE id = ?
    `;
    db.prepare(query).run(clienteId, canalId);
    return db.prepare('SELECT * FROM canales WHERE id = ?').get(canalId);
  }

  registrarSubproducto(tipo, cantidad, peso_lbs, ubicacion) {
    const query = `
      INSERT INTO subproductos (tipo, cantidad, peso_lbs, ubicacion, estado)
      VALUES (?, ?, ?, ?, 'disponible')
    `;
    const result = db.prepare(query).run(tipo, cantidad, peso_lbs, ubicacion);
    return db.prepare('SELECT * FROM subproductos WHERE id = ?').get(result.lastInsertRowid);
  }

  obtenerSubproductosDisponibles() {
    const query = `
      SELECT *
      FROM subproductos
      WHERE estado = 'disponible'
      ORDER BY tipo, fecha_entrada ASC
    `;
    return db.prepare(query).all();
  }
}

module.exports = new InventarioService();
