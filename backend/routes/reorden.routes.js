const express = require('express');
const router = express.Router();
const reordenService = require('../services/reorden.service');

router.get('/alerta', async (req, res) => {
  try {
    const hoy = req.query.fecha || new Date().toISOString().split('T')[0];
    const result = await reordenService.calcularNecesidadReorden(hoy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/historial', async (req, res) => {
  try {
    const dias = req.query.dias || 30;
    const result = await reordenService.obtenerHistorialDemanda(dias);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/proyeccion', async (req, res) => {
  try {
    const result = await reordenService.proyectarAgotamiento();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
