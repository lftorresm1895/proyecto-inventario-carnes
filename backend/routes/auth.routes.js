const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');
const { authMiddleware, adminOnly, JWT_SECRET } = require('../middleware/auth');

// POST: Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE',
      [username.toLowerCase().trim()]
    );
    const usuario = result.rows[0];

    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear usuario (solo admin)
router.post('/usuarios', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nombre, username, password, rol } = req.body;
    if (!nombre || !username || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, username, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, username, rol, activo`,
      [nombre, username.toLowerCase().trim(), hash, rol === 'admin' ? 'admin' : 'socio']
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (error) {
    if (error.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar usuarios (solo admin)
router.get('/usuarios', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, username, rol, activo, createdAt FROM usuarios ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Cambiar mi contraseña
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    const usuario = result.rows[0];

    if (!(await bcrypt.compare(password_actual, usuario.password_hash))) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = await bcrypt.hash(password_nueva, 10);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, req.usuario.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Activar/desactivar usuario (solo admin)
router.put('/usuarios/:id/activo', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { activo } = req.body;
    const result = await pool.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, nombre, username, rol, activo',
      [activo, req.params.id]
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
