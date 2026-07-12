import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { escribirReporteEntrada } from '../reporteEntrada';
import '../styles/EntradaCanales.css';

// Acepta "180.5" o "180,5" (coma decimal de teclados en español)
const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const cargadoresIniciales = () => {
  try {
    const guardados = JSON.parse(localStorage.getItem('cargadores'));
    if (Array.isArray(guardados) && guardados.length === 3) return guardados;
  } catch {
    /* ignorar */
  }
  return [
    { nombre: '', peso: '' },
    { nombre: '', peso: '' },
    { nombre: '', peso: '' },
  ];
};

export function EntradaCanales() {
  const [canales, setCanales] = useState([]);
  const [pesoBruto, setPesoBruto] = useState('');
  const [graso, setGraso] = useState(false);
  const [papada, setPapada] = useState(false);
  const [golpeado, setGolpeado] = useState(false);
  const [riel, setRiel] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [cargaRieles, setCargaRieles] = useState([]);
  const [rielSugerido, setRielSugerido] = useState(null);
  const [rielManual, setRielManual] = useState(false);

  // Cargadores de la jornada (se pesan en la báscula junto con el canal)
  const [cargadores, setCargadores] = useState(cargadoresIniciales);
  const [enBascula, setEnBascula] = useState([true, true, true]);
  const [mostrarCargadores, setMostrarCargadores] = useState(true);

  // Cuando no se sabe/no se quiere asignar riel: solo peso + características
  const [sinRieles, setSinRieles] = useState(() => localStorage.getItem('sinRieles') === '1');

  const pesoInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sinRieles', sinRieles ? '1' : '0');
  }, [sinRieles]);

  useEffect(() => {
    cargarSugerencia();
  }, []);

  useEffect(() => {
    localStorage.setItem('cargadores', JSON.stringify(cargadores));
  }, [cargadores]);

  useEffect(() => {
    if (cargaRieles.length === 0 || rielManual) return;

    const cargas = cargaRieles.map((r) => {
      const pendiente = canales
        .filter((c) => c.ubicacion_riel === r.riel)
        .reduce((sum, c) => sum + c.peso_lbs, 0);
      return { riel: r.riel, peso_total: r.peso_total + pendiente };
    });

    const sugerido = cargas.reduce((min, r) => (r.peso_total < min.peso_total ? r : min));
    setRielSugerido(sugerido.riel);
    setRiel(sugerido.riel);
  }, [cargaRieles, canales, rielManual]);

  const cargarSugerencia = async () => {
    try {
      const res = await api.sugerirRiel();
      setCargaRieles(res.rieles || []);
    } catch (err) {
      console.error('Error cargando sugerencia de riel:', err);
    }
  };

  const setCargador = (idx, campo, valor) => {
    setCargadores((prev) => {
      const nuevo = [...prev];
      nuevo[idx] = { ...nuevo[idx], [campo]: valor };
      return nuevo;
    });
  };

  const toggleEnBascula = (idx) => {
    setEnBascula((prev) => {
      const nuevo = [...prev];
      nuevo[idx] = !nuevo[idx];
      return nuevo;
    });
  };

  // Suma de los cargadores que están sobre la báscula
  const pesoCargadores = cargadores.reduce((sum, c, idx) => {
    const p = parseNum(c.peso);
    return enBascula[idx] && p > 0 ? sum + p : sum;
  }, 0);

  const bruto = parseNum(pesoBruto);
  const pesoNeto = Math.round((bruto - pesoCargadores) * 100) / 100;

  const agregarCanal = () => {
    if (!pesoBruto || bruto <= 0) {
      alert('Ingresa el peso de la báscula');
      return;
    }
    if (pesoNeto <= 0) {
      alert(
        `El peso del canal sale en ${pesoNeto} lbs. Revisa el peso de la báscula o los cargadores marcados.`
      );
      return;
    }

    const nuevoCanal = {
      numero_canal: canales.length + 1,
      peso_lbs: pesoNeto,
      graso,
      papada,
      golpeado,
      ubicacion_riel: sinRieles ? 0 : riel,
    };

    setCanales([...canales, nuevoCanal]);
    setPesoBruto('');
    setGraso(false);
    setPapada(false);
    setGolpeado(false);
    pesoInputRef.current?.focus();
  };

  const guardarCanales = async () => {
    if (canales.length === 0) {
      alert('Agrega al menos 1 canal');
      return;
    }

    // Abrir la ventana del reporte de una vez (evita el bloqueador de popups)
    const ventanaReporte = window.open('', '_blank');

    try {
      setGuardando(true);
      const lista = [...canales];
      await api.registrarEntrada(lista);
      escribirReporteEntrada(lista, ventanaReporte);
      alert(`✅ ${lista.length} canales registrados (${lista.reduce((s, c) => s + c.peso_lbs, 0).toFixed(2)} lbs)`);
      setCanales([]);
      setRielManual(false);
      await cargarSugerencia();
    } catch (err) {
      if (ventanaReporte) ventanaReporte.close();
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

  const hayCargadores = cargadores.some((c) => parseNum(c.peso) > 0);

  return (
    <div className="entrada-container">
      <h2>🚚 Entrada de Canales</h2>

      {/* Cargadores de la jornada */}
      <div className="cargadores-section">
        <div className="cargadores-header" onClick={() => setMostrarCargadores(!mostrarCargadores)}>
          <h3>
            💪 Cargadores de hoy{' '}
            {hayCargadores && (
              <span className="cargadores-resumen-tag">
                (restando {pesoCargadores.toFixed(1)} lbs)
              </span>
            )}
          </h3>
          <span>{mostrarCargadores ? '▲' : '▼'}</span>
        </div>

        {mostrarCargadores && (
          <>
            <p className="cargadores-hint">
              Anota el peso de cada cargador que se sube a la báscula. La app se lo resta al peso
              total y guarda solo el peso del canal.
            </p>
            <div className="cargadores-grid">
              {cargadores.map((c, idx) => (
                <div key={idx} className="cargador-item">
                  <input
                    type="text"
                    placeholder={`Cargador ${idx + 1}`}
                    value={c.nombre}
                    onChange={(e) => setCargador(idx, 'nombre', e.target.value)}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Peso (lbs) ej: 180.5"
                    value={c.peso}
                    onChange={(e) => setCargador(idx, 'peso', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Switch de rieles */}
      <label className="switch-rieles">
        <input
          type="checkbox"
          checked={!sinRieles}
          onChange={(e) => setSinRieles(!e.target.checked)}
        />
        <span>
          📍 Asignar rieles{' '}
          {sinRieles && <em>(desactivado: solo se guardan pesos y características)</em>}
        </span>
      </label>

      {/* Rieles */}
      {!sinRieles && cargaRieles.length > 0 && (
        <div className="rieles-status">
          {cargaRieles.map((r) => {
            const total = r.peso_total + pesoPendientePorRiel(r.riel);
            return (
              <button
                key={r.riel}
                className={`riel-card ${riel === r.riel ? 'seleccionado' : ''} ${
                  rielSugerido === r.riel ? 'sugerido' : ''
                }`}
                onClick={() => {
                  setRiel(r.riel);
                  setRielManual(true);
                }}
              >
                <div className="riel-nombre">Riel {r.riel}</div>
                <div className="riel-peso">{total.toFixed(0)} lbs</div>
                {rielSugerido === r.riel && <div className="riel-tag">sugerido</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Captura rápida */}
      <div className="captura-rapida">
        <label className="captura-label">Peso en báscula (lbs)</label>
        <input
          ref={pesoInputRef}
          type="text"
          inputMode="decimal"
          className="peso-bruto-input"
          value={pesoBruto}
          onChange={(e) => setPesoBruto(e.target.value)}
          placeholder="0.0"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && agregarCanal()}
        />

        {hayCargadores && (
          <>
            <div className="en-bascula">
              <span className="en-bascula-label">¿Quiénes cargaron?</span>
              {cargadores.map((c, idx) =>
                parseNum(c.peso) > 0 ? (
                  <button
                    key={idx}
                    className={`chip cargador-chip ${enBascula[idx] ? 'activo' : ''}`}
                    onClick={() => toggleEnBascula(idx)}
                  >
                    {c.nombre || `Cargador ${idx + 1}`} · {parseNum(c.peso).toFixed(1)} lb
                  </button>
                ) : null
              )}
            </div>

            <div className={`neto-display ${pesoNeto > 0 ? '' : 'invalido'}`}>
              Peso del canal: <strong>{bruto > 0 ? pesoNeto.toFixed(2) : '—'} lbs</strong>
            </div>
          </>
        )}

        <div className="chips-flags">
          <button
            className={`chip flag-chip graso ${graso ? 'activo' : ''}`}
            onClick={() => setGraso(!graso)}
          >
            🥓 Grasa
          </button>
          <button
            className={`chip flag-chip papada ${papada ? 'activo' : ''}`}
            onClick={() => setPapada(!papada)}
          >
            Papada
          </button>
          <button
            className={`chip flag-chip golpeado ${golpeado ? 'activo' : ''}`}
            onClick={() => setGolpeado(!golpeado)}
          >
            ⚠️ Golpe
          </button>
        </div>

        <button onClick={agregarCanal} className="btn-agregar-grande">
          ➕ AGREGAR CANAL{' '}
          {bruto > 0 && pesoNeto > 0
            ? `(${pesoNeto.toFixed(1)} lbs${sinRieles ? '' : ` → Riel ${riel}`})`
            : ''}
        </button>
      </div>

      {/* Lista pendiente */}
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
              <div>{canal.ubicacion_riel > 0 ? `Riel ${canal.ubicacion_riel}` : '—'}</div>
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
            {guardando
              ? 'Guardando...'
              : `✅ Guardar ${canales.length} Canales y Generar Reporte PDF`}
          </button>
        )}
      </div>
    </div>
  );
}
