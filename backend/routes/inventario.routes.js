const express = require('express');
const router = express.Router();
const inventarioService = require('../services/inventario.service');

router.post('/entrada', async (req, res) => {
  try {
    const { canales } = req.body;
    if (!canales || !Array.isArray(canales)) {
      return res.status(400).json({ error: 'Se requiere array de canales' });
    }
    const result = await inventarioService.registrarEntrada(canales, req.usuario?.username);
    res.json({ success: true, canales: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/actual', async (req, res) => {
  try {
    const result = await inventarioService.obtenerInventarioActual();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resumen', async (req, res) => {
  try {
    const result = await inventarioService.obtenerResumenInventario();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/riel/:riel', async (req, res) => {
  try {
    const result = await inventarioService.obtenerCanalPorRiel(req.params.riel);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/entradas', async (req, res) => {
  try {
    const result = await inventarioService.obtenerEntradasPorFecha();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/entradas/:fecha', async (req, res) => {
  try {
    const result = await inventarioService.obtenerCanalesPorFecha(req.params.fecha);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sugerir-riel', async (req, res) => {
  try {
    const result = await inventarioService.sugerirRiel();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subproductos', async (req, res) => {
  try {
    const { tipo, cantidad, peso_lbs, ubicacion } = req.body;
    const result = await inventarioService.registrarSubproducto(tipo, cantidad, peso_lbs, ubicacion);
    res.json({ success: true, subproducto: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subproductos', async (req, res) => {
  try {
    const result = await inventarioService.obtenerSubproductosDisponibles();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
