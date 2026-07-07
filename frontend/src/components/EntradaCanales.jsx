import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/EntradaCanales.css';

export function EntradaCanales() {
  const [canales, setCanales] = useState([]);
  const [peso, setPeso] = useState('');
  const [graso, setGraso] = useState(false);
  const [papada, setPapada] = useState(false);
  const [golpeado, setGolpeado] = useState(false);
  const [riel, setRiel] = useState('1');
  const [guardando, setGuardando] = useState(false);
  const [cargaRieles, setCargaRieles] = useState([]);
  const [rielSugerido, setRielSugerido] = useState(null);

  useEffect(() => {
    cargarSugerencia();
  }, []);

  // Recalcula la sugerencia sumando lo que ya está en el reefer + lo pendiente por guardar
  useEffect(() => {
    if (cargaRieles.length === 0) return;

    const cargas = cargaRieles.map((r) => {
      const pendiente = canales
        .filter((c) => c.ubicacion_riel === r.riel)
        .reduce((sum, c) => sum + c.peso_lbs, 0);
      return { riel: r.riel, peso_total: r.peso_total + pendiente };
    });

    const sugerido = cargas.reduce((min, r) => (r.peso_total < min.peso_total ? r : min));
    setRielSugerido(sugerido.riel);
    setRiel(String(sugerido.riel));
  }, [cargaRieles, canales]);

  const cargarSugerencia = async () => {
    try {
      const res = await api.sugerirRiel();
      setCargaRieles(res.rieles || []);
    } catch (err) {
      console.error('Error cargando sugerencia de riel:', err);
    }
  };

  const agregarCanal = () => {
    if (!peso || peso <= 0) {
      alert('Ingresa peso válido');
      return;
    }

    const nuevoCanal = {
      numero_canal: canales.length + 1,
      peso_lbs: parseFloat(peso),
      graso,
      papada,
      golpeado,
      ubicacion_riel: parseInt(riel),
    };

    setCanales([...canales, nuevoCanal]);
    setPeso('');
    setGraso(false);
    setPapada(false);
    setGolpeado(false);
  };

  const guardarCanales = async () => {
    if (canales.length === 0) {
      alert('Agrega al menos 1 canal');
      return;
    }

    try {
      setGuardando(true);
      await api.registrarEntrada(canales);
      alert(`✅ ${canales.length} canales registrados`);
      setCanales([]);
      await cargarSugerencia();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCanal = (idx) => {
    setCanales(canales.filter((_, i) => i !== idx));
  };

  const pesoTotal = canales.reduce((sum, c) => sum + c.peso_lbs, 0);

  const pesoPendientePorRiel = (numRiel) =>
    canales
      .filter((c) => c.ubicacion_riel === numRiel)
      .reduce((sum, c) => sum + c.peso_lbs, 0);

  return (
    <div className="entrada-container">
      <h2>🚚 Entrada de Canales</h2>

      {cargaRieles.length > 0 && (
        <div className="rieles-status">
          {cargaRieles.map((r) => {
            const total = r.peso_total + pesoPendientePorRiel(r.riel);
            return (
              <div
                key={r.riel}
                className={`riel-card ${rielSugerido === r.riel ? 'sugerido' : ''}`}
              >
                <div className="riel-nombre">Riel {r.riel}</div>
                <div className="riel-peso">{total.toFixed(0)} lbs</div>
                {rielSugerido === r.riel && <div className="riel-tag">⬅ Cuelga aquí</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="entrada-form">
        <div className="form-group">
          <label>Peso (lbs)</label>
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="ej: 105"
            step="0.5"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && agregarCanal()}
          />
        </div>

        <div className="form-group flags-group">
          <label>Características (marca lo que veas)</label>
          <label className="flag-check">
            <input type="checkbox" checked={graso} onChange={(e) => setGraso(e.target.checked)} />
            🥓 Mucha grasa
          </label>
          <label className="flag-check">
            <input type="checkbox" checked={papada} onChange={(e) => setPapada(e.target.checked)} />
            Papada
          </label>
          <label className="flag-check">
            <input type="checkbox" checked={golpeado} onChange={(e) => setGolpeado(e.target.checked)} />
            ⚠️ Golpeado / moretón
          </label>
          <small className="flag-hint">
            Sin grasa y sin papada = cuenta como Light
          </small>
        </div>

        <div className="form-group">
          <label>Riel {rielSugerido && `(sugerido: ${rielSugerido})`}</label>
          <select value={riel} onChange={(e) => setRiel(e.target.value)}>
            <option value="1">Riel 1</option>
            <option value="2">Riel 2</option>
            <option value="3">Riel 3</option>
            <option value="4">Riel 4</option>
          </select>
        </div>

        <button onClick={agregarCanal} className="btn-agregar">
          ➕ Agregar
        </button>
      </div>

      <div className="canales-preview">
        <h3>Canales a Ingresar ({canales.length})</h3>
        <div className="resumen">
          <span>Total: {pesoTotal.toFixed(2)} lbs</span>
          <span>Light: {canales.filter((c) => !c.graso && !c.papada).length}</span>
          <span>🥓 Grasa: {canales.filter((c) => c.graso).length}</span>
          <span>Papada: {canales.filter((c) => c.papada).length}</span>
          <span>⚠️ Golpes: {canales.filter((c) => c.golpeado).length}</span>
        </div>

        <div className="canales-table">
          <div className="table-header">
            <div>#</div>
            <div>Peso</div>
            <div>Características</div>
            <div>Riel</div>
            <div>Acción</div>
          </div>

          {canales.map((canal, idx) => (
            <div key={idx} className="table-row">
              <div>{idx + 1}</div>
              <div>{canal.peso_lbs} lbs</div>
              <div className="flags-cell">
                {!canal.graso && !canal.papada && <span className="badge light">Light</span>}
                {canal.graso && <span className="badge graso">🥓 Grasa</span>}
                {canal.papada && <span className="badge papada">Papada</span>}
                {canal.golpeado && <span className="badge golpeado">⚠️ Golpe</span>}
              </div>
              <div>Riel {canal.ubicacion_riel}</div>
              <div>
                <button onClick={() => eliminarCanal(idx)} className="btn-delete">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {canales.length > 0 && (
          <button onClick={guardarCanales} className="btn-guardar" disabled={guardando}>
            {guardando ? 'Guardando...' : '✅ Guardar Canales'}
          </button>
        )}
      </div>
    </div>
  );
}
