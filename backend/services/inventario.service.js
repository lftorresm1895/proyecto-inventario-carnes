const pool = require('../db/db');

class InventarioService {
  async registrarEntrada(canales) {
    const query = `
      INSERT INTO canales (numero_canal, peso_lbs, clasificacion, ubicacion_riel, estado)
      VALUES ($1, $2, $3, $4, 'en_reefer')
      RETURNING *
    `;

    const results = [];
    for (const canal of canales) {
      const result = await pool.query(query, [
        canal.numero_canal,
        canal.peso_lbs,
        canal.clasificacion || 'normal',
        canal.ubicacion_riel,
      ]);
      results.push(result.rows[0]);
    }
    return results;
  }

  async obtenerInventarioActual() {
    const query = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        EXTRACT(DAY FROM (NOW() - fecha_entrada))::INTEGER as dias_en_frio,
        estado
      FROM canales
      WHERE estado = 'en_reefer'
      ORDER BY ubicacion_riel, fecha_entrada ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async obtenerCanalPorRiel(riel) {
    const query = `
      SELECT
        id,
        numero_canal,
        peso_lbs,
        clasificacion,
        ubicacion_riel,
        fecha_entrada,
        EXTRACT(DAY FROM (NOW() - fecha_entrada))::INTEGER as dias_en_frio
      FROM canales
      WHERE ubicacion_riel = $1 AND estado = 'en_reefer'
      ORDER BY fecha_entrada ASC
    `;
    const result = await pool.query(query, [riel]);
    return result.rows;
  }

  async obtenerResumenInventario() {
    const query = `
      SELECT
        COUNT(*) as total_canales,
        ROUND(SUM(peso_lbs)::numeric, 2) as peso_total_lbs,
        COUNT(CASE WHEN clasificacion = 'light' THEN 1 END) as canales_light,
        COUNT(CASE WHEN clasificacion = 'normal' THEN 1 END) as canales_normal
      FROM canales
      WHERE estado = 'en_reefer'
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  async marcarComoVendido(canalId, clienteId) {
    const query = `
      UPDATE canales
      SET estado = 'vendido', fecha_salida = NOW(), cliente_id = $2
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [canalId, clienteId]);
    return result.rows[0];
  }

  async registrarSubproducto(tipo, cantidad, peso_lbs, ubicacion) {
    const query = `
      INSERT INTO subproductos (tipo, cantidad, peso_lbs, ubicacion, estado)
      VALUES ($1, $2, $3, $4, 'disponible')
      RETURNING *
    `;
    const result = await pool.query(query, [tipo, cantidad, peso_lbs, ubicacion]);
    return result.rows[0];
  }

  // Sugerir riel: devuelve la carga de cada riel para colgar donde haya menos peso
  async sugerirRiel() {
    const query = `
      SELECT
        r.riel,
        COUNT(c.id)::INTEGER as total_canales,
        COALESCE(ROUND(SUM(c.peso_lbs)::numeric, 2), 0) as peso_total
      FROM (SELECT 1 as riel UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) r
      LEFT JOIN canales c ON c.ubicacion_riel = r.riel AND c.estado = 'en_reefer'
      GROUP BY r.riel
      ORDER BY r.riel
    `;
    const result = await pool.query(query);
    const rieles = result.rows.map((r) => ({
      riel: r.riel,
      total_canales: r.total_canales,
      peso_total: parseFloat(r.peso_total),
    }));

    const sugerido = rieles.reduce((min, r) =>
      r.peso_total < min.peso_total ? r : min
    );

    return { rieles, riel_sugerido: sugerido.riel };
  }

  async obtenerSubproductosDisponibles() {
    const query = `
      SELECT *
      FROM subproductos
      WHERE estado = 'disponible'
      ORDER BY tipo, fecha_entrada ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new InventarioService();
