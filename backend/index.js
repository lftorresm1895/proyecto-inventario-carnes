require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/db');

const inventarioRoutes = require('./routes/inventario.routes');
const pickingRoutes = require('./routes/picking.routes');
const reordenRoutes = require('./routes/reorden.routes');
const clientesRoutes = require('./routes/clientes.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Routes
app.use('/api/inventario', inventarioRoutes);
app.use('/api/picking', pickingRoutes);
app.use('/api/reorden', reordenRoutes);
app.use('/api/clientes', clientesRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal' });
});

// DB connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'connected', time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL || 'local'}`);
});
