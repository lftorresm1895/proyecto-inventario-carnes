import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/PickingList.css';

export function PickingList() {
  const [pickingList, setPickingList] = useState([]);
  const [selectedCanales, setSelectedCanales] = useState({});
  const [completedClientes, setCompletedClientes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarPickingList();
  }, [fecha]);

  const cargarPickingList = async () => {
    try {
      setLoading(true);
      const res = await api.obtenerPickingList(fecha);
      setPickingList(res.picking_list || []);
      setError(null);
    } catch (err) {
      setError('Error cargando picking list: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCanal = (clienteId, canalId) => {
    const key = `${clienteId}-${canalId}`;
    setSelectedCanales((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const confirmarPedido = async (cliente) => {
    const canalIds = cliente.canales
      .map((c) => `${cliente.cliente_id}-${c.id}`)
      .filter((key) => selectedCanales[key])
      .map((key) => {
        const canalId = key.split('-')[1];
        return parseInt(canalId);
      });

    if (canalIds.length === 0) {
      alert('Selecciona al menos 1 canal');
      return;
    }

    try {
      await api.confirmarPicking(cliente.cliente_id, canalIds, fecha);
      setCompletedClientes((prev) => ({
        ...prev,
        [cliente.cliente_id]: true,
      }));
      alert(`✅ Pedido de ${cliente.cliente_nombre} confirmado`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="picking-container">
      <h1>📋 PICKING LIST - {fecha}</h1>

      <div className="fecha-selector">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <button onClick={cargarPickingList}>Refrescar</button>
      </div>

      {error && <div className="error">{error}</div>}

      {pickingList.length === 0 ? (
        <div className="empty">No hay pedidos agendados para hoy</div>
      ) : (
        <div className="clientes-list">
          {pickingList.map((cliente) => (
            <div
              key={cliente.cliente_id}
              className={`cliente-card ${
                completedClientes[cliente.cliente_id] ? 'completed' : ''
              }`}
            >
              <div className="cliente-header">
                <h2>{cliente.cliente_nombre}</h2>
                <span className="telefono">{cliente.telefono}</span>
              </div>

              <div className="pedido-info">
                <span>Pedidos: {cliente.cantidad_pedida} canales</span>
                <span>Peso total: {cliente.peso_total.toFixed(2)} lbs</span>
              </div>

              <div className="canales-selection">
                <h3>Selecciona canales:</h3>
                {cliente.canales.map((canal, idx) => (
                  <label key={canal.id} className="canal-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        selectedCanales[`${cliente.cliente_id}-${canal.id}`] ||
                        false
                      }
                      onChange={() =>
                        toggleCanal(cliente.cliente_id, canal.id)
                      }
                      disabled={completedClientes[cliente.cliente_id]}
                    />
                    <span className="canal-info">
                      Riel {canal.ubicacion_riel} | {canal.peso_lbs} lbs | {canal.dias_en_frio}d
                      {canal.clasificacion === 'light' && ' (Light)'}
                    </span>
                  </label>
                ))}
              </div>

              {!completedClientes[cliente.cliente_id] && (
                <button
                  className="btn-confirmar"
                  onClick={() => confirmarPedido(cliente)}
                >
                  ✓ Confirmar Pedido
                </button>
              )}
              {completedClientes[cliente.cliente_id] && (
                <div className="completado">✅ Pedido completado</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
