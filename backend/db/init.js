const pool = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, './schema.sql'), 'utf-8');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Migraciones sobre tablas existentes
    await pool.query(
      "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS preferencia VARCHAR(50) DEFAULT 'cualquiera'"
    );
    await pool.query(
      "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_lb DECIMAL(10, 2) DEFAULT 0"
    );
    await pool.query(
      "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cuenta_activa BOOLEAN DEFAULT FALSE"
    );
    await pool.query(
      "ALTER TABLE canales ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100)"
    );
    await pool.query(
      "ALTER TABLE canales ADD COLUMN IF NOT EXISTS graso BOOLEAN DEFAULT FALSE"
    );
    await pool.query(
      "ALTER TABLE canales ADD COLUMN IF NOT EXISTS papada BOOLEAN DEFAULT FALSE"
    );
    await pool.query(
      "ALTER TABLE canales ADD COLUMN IF NOT EXISTS golpeado BOOLEAN DEFAULT FALSE"
    );
    await pool.query(
      "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100)"
    );

    // Usuario admin inicial si no existe ninguno
    const usuarios = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    if (parseInt(usuarios.rows[0].total) === 0) {
      const hash = await bcrypt.hash('carnes2026', 10);
      await pool.query(
        `INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES ($1, $2, $3, 'admin')`,
        ['Administrador', 'admin', hash]
      );
      console.log('👤 Usuario inicial creado: admin / carnes2026');
    }

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
    process.exit(1);
  }
}

module.exports = { initDb };
