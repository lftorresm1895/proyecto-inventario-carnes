const db = require('./db');
const fs = require('fs');
const path = require('path');

function initDb() {
  try {
    // Crear carpeta data si no existe
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Leer schema
    const schema = fs.readFileSync(path.join(__dirname, './schema.sql'), 'utf-8');

    // Ejecutar statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        db.exec(stmt);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
    process.exit(1);
  }
}

module.exports = { initDb };
