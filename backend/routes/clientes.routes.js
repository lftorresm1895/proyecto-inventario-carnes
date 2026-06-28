const express = require('express');
const router = express.Router();
const clientesService = require('../services/clientes.service');

router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const result = await clientesService.crearCliente(nombre, telefono, email);
    res.json({ success: true, cliente: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await clientesService.obtenerClientes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:clienteId', async (req, res) => {
  try {
    const result = await clientesService.obtenerClientePorId(req.params.clienteId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:clienteId/pedidos-agendados', async (req, res) => {
  try {
    const { dia, cantidad_canales } = req.body;
    if (!dia || !cantidad_canales) {
      return res.status(400).json({ error: 'Faltan dia o cantidad_canales' });
    }
    const result = await clientesService.crearPedidoAgendado(
      req.params.clienteId,
      dia,
      cantidad_canales
    );
    res.json({ success: true, pedido_agendado: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agendados/lista', async (req, res) => {
  try {
    const result = await clientesService.obtenerPedidosAgendados();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/agendados/:pedidoAgendadoId', async (req, res) => {
  try {
    const { cantidad_canales, activo } = req.body;
    const result = await clientesService.editarPedidoAgendado(
      req.params.pedidoAgendadoId,
      cantidad_canales,
      activo
    );
    res.json({ success: true, pedido_agendado: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/agendados/:pedidoAgendadoId', async (req, res) => {
  try {
    const result = await clientesService.eliminarPedidoAgendado(req.params.pedidoAgendadoId);
    res.json({ success: true, resultado: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
