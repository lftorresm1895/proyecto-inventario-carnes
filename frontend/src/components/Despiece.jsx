import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/Despiece.css';

export function Despiece() {
  const [inventario, setInventario] = useState([]);
  const [selectedCanal, setSelectedCanal] = useState(null);
  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const res = await api.obtenerInventario();
      setInventario(res);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const iniciarDespiece = (canal) => {
    setSelectedCanal(canal);
    // Distribución automática de cortes
    const pesoBase = canal.peso_lbs;
    setCortes([
      { tipo: 'Lomo', peso: parseFloat((pesoBase * 0.267).toFixed(2)) },
      { tipo: 'Costillas', peso: parseFloat((pesoBase * 0.172).toFixed(2)) },
      { tipo: 'Jamón', peso: parseFloat((pesoBase * 0.305).toFixed(2)) },
      { tipo: 'Espaldilla', peso: parseFloat((pesoBase * 0.143).toFixed(2)) },
      { tipo: 'Untos', peso: parseFloat((pesoBase * 0.067).toFixed(2)) },
      { tipo: 'Descarte', peso: parseFloat((pesoBase * 0.046).toFixed(2)) },
    ]);
  };

  const actualizarCorte = (idx, peso) => {
    const nuevosCortes = [...cortes];
    nuevosCortes[idx].peso = parseFloat(peso) || 0;
    setCortes(nuevosCortes);
  };

  const confirmarDespiece = async () => {
    if (!selectedCanal) return;

    const pesoTotal = cortes.reduce((sum, c) => sum + c.peso, 0);
    if (Math.abs(pesoTotal - selectedCanal.peso_lbs) > 0.5) {
      alert(
        `❌ Error: Peso no coincide. Esperado: ${selectedCanal.peso_lbs}, Obtenido: ${pesoTotal.toFixed(2)}`
      );
      return;
    }

    alert(`✅ Despiece confirmado\n\n${cortes.map((c) => `${c.tipo}: ${c.peso} lbs`).join('\n')}`);
    setSelectedCanal(null);
    setCortes([]);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="despiece-container">
      <h2>🔪 Despiece de Canales</h2>

      {!selectedCanal ? (
        <div className="inventario-section">
          <h3>Selecciona canal a despiece:</h3>
          <div className="canales-grid">
            {inventario.length === 0 ? (
              <p>No hay canales disponibles</p>
            ) : (
              inventario.map((canal) => (
                <div key={canal.id} className="canal-option" onClick={() => iniciarDespiece(canal)}>
                  <div className="canal-peso">{canal.peso_lbs} lbs</div>
                  <div className="canal-info">
                    Riel {canal.ubicacion_riel} • {canal.dias_en_frio}d
                  </div>
                  <div className="canal-class">{canal.clasificacion}</div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="despiece-form">
          <div className="canal-header">
            <h3>Canal #{selectedCanal.numero_canal}</h3>
            <span className="peso-total">Total: {selectedCanal.peso_lbs} lbs</span>
            <button onClick={() => setSelectedCanal(null)} className="btn-close">
              ✕
            </button>
          </div>

          <div className="cortes-table">
            {cortes.map((corte, idx) => {
              const pesoActual = cortes.reduce((sum, c) => sum + c.peso, 0);
              const pesoRestante = selectedCanal.peso_lbs - pesoActual + corte.peso;

              return (
                <div key={idx} className="corte-row">
                  <div className="corte-nombre">{corte.tipo}</div>
                  <input
                    type="number"
                    value={corte.peso}
                    onChange={(e) => actualizarCorte(idx, e.target.value)}
                    step="0.1"
                    className="corte-peso"
                  />
                  <div className="corte-lbs">lbs</div>
                </div>
              );
            })}
          </div>

          <div className="cortes-total">
            <span>Total: {cortes.reduce((sum, c) => sum + c.peso, 0).toFixed(2)} lbs</span>
            <span
              className={
                Math.abs(cortes.reduce((sum, c) => sum + c.peso, 0) - selectedCanal.peso_lbs) < 0.5
                  ? 'ok'
                  : 'error'
              }
            >
              {Math.abs(cortes.reduce((sum, c) => sum + c.peso, 0) - selectedCanal.peso_lbs) < 0.5
                ? '✓ Correcto'
                : '❌ Revisar'}
            </span>
          </div>

          <button
            onClick={confirmarDespiece}
            className="btn-confirmar"
            disabled={
              Math.abs(cortes.reduce((sum, c) => sum + c.peso, 0) - selectedCanal.peso_lbs) > 0.5
            }
          >
            ✓ Confirmar Despiece
          </button>
        </div>
      )}
    </div>
  );
}
