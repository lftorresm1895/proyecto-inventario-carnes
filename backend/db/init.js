const { execAsync } = require('./db');
const fs = require('fs');
const path = require('path');

async function initDb() {
  try {
    // Crear carpeta data si no existe
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Leer schema
    const schema = fs.readFileSync(path.join(__dirname, './schema.sql'), 'utf-8');

    // Ejecutar schema
    await execAsync(schema);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
    process.exit(1);
  }
}

module.exports = { initDb };
