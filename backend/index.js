require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/init');

const inventarioRoutes = require('./routes/inventario.routes');
const pickingRoutes = require('./routes/picking.routes');
const reordenRoutes = require('./routes/reorden.routes');
const clientesRoutes = require('./routes/clientes.routes');
const authRoutes = require('./routes/auth.routes');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar DB
(async () => {
  await initDb();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/inventario', authMiddleware, inventarioRoutes);
  app.use('/api/picking', authMiddleware, pickingRoutes);
  app.use('/api/reorden', authMiddleware, reordenRoutes);
  app.use('/api/clientes', authMiddleware, clientesRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal' });
  });

  // DB connection test
  app.get('/api/db-test', (req, res) => {
    try {
      res.json({ status: 'connected', database: 'SQLite (inventario.db)' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📁 Database: data/inventario.db`);
  });
})();
