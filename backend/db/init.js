const pool = require('./db');
const fs = require('fs');
const path = require('path');

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

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
    process.exit(1);
  }
}

module.exports = { initDb };
