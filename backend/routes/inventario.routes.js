const express = require('express');
const router = express.Router();
const inventarioService = require('../services/inventario.service');

// POST: Registrar entrada de canales
router.post('/entrada', async (req, res) => {
  try {
    const { canales } = req.body;
    if (!canales || !Array.isArray(canales)) {
      return res.status(400).json({ error: 'Se requiere array de canales' });
    }
    const result = await inventarioService.registrarEntrada(canales);
    res.json({ success: true, canales: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener inventario actual
router.get('/actual', async (req, res) => {
  try {
    const result = await inventarioService.obtenerInventarioActual();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Resumen de inventario
router.get('/resumen', async (req, res) => {
  try {
    const result = await inventarioService.obtenerResumenInventario();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Canales por riel
router.get('/riel/:riel', async (req, res) => {
  try {
    const result = await inventarioService.obtenerCanalPorRiel(req.params.riel);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Subproductos
router.post('/subproductos', async (req, res) => {
  try {
    const { tipo, cantidad, peso_lbs, ubicacion } = req.body;
    const result = await inventarioService.registrarSubproducto(tipo, cantidad, peso_lbs, ubicacion);
    res.json({ success: true, subproducto: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Subproductos disponibles
router.get('/subproductos', async (req, res) => {
  try {
    const result = await inventarioService.obtenerSubproductosDisponibles();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
