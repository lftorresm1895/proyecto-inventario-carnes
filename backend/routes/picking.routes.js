const express = require('express');
const router = express.Router();
const pickingService = require('../services/picking.service');

router.get('/lista', async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const result = await pickingService.generarPickingList(fecha);
    res.json({ fecha, picking_list: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirmar', async (req, res) => {
  try {
    const { cliente_id, canales_ids, fecha_pedido } = req.body;
    if (!cliente_id || !canales_ids || !Array.isArray(canales_ids)) {
      return res.status(400).json({ error: 'Faltan cliente_id o canales_ids' });
    }
    const result = await pickingService.confirmarPicking(cliente_id, canales_ids, fecha_pedido);
    res.json({ success: true, pedido: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pedido/:pedidoId', async (req, res) => {
  try {
    const result = await pickingService.obtenerDetallePedido(req.params.pedidoId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
