import { useState, useEffect } from 'react';
import { api } from '../api';
import { escribirReporteEntrada } from '../reporteEntrada';
import '../styles/Dashboard.css';

const num = (v) => parseFloat(v) || 0;

export function InventoryDashboard() {
  const [resumen, setResumen] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [proyeccion, setProyeccion] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 60000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [r, a, p, e] = await Promise.all([
        api.obtenerResumen(),
        api.obtenerAlertaReorden(),
        api.obtenerProyeccion(),
        api.obtenerEntradas(),
      ]);
      setResumen(r);
      setAlerta(a);
      setProyeccion(p);
      setEntradas(Array.isArray(e) ? e : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('No se pudo cargar el dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verReporteDescarga = async (fecha) => {
    // Abrir la ventana de una vez para que el navegador no la bloquee
    const ventana = window.open('', '_blank');
    try {
      const canales = await api.obtenerCanalesEntrada(fecha);
      const [y, m, d] = fecha.split('-');
      const label = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      escribirReporteEntrada(canales, ventana, label);
    } catch (err) {
      if (ventana) ventana.close();
      alert('Error generando reporte: ' + err.message);
    }
  };

  const fmtFecha = (fecha) => {
    const [y, m, d] = fecha.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-EC', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="dashboard">
      <h2>📊 Estado del Inventario</h2>

      {error && <div className="error">{error}</div>}

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Canales</h3>
          <p className="metric-value">{resumen?.total_canales || 0}</p>
        </div>

        <div className="metric-card">
          <h3>Peso Total</h3>
          <p className="metric-value">{num(resumen?.peso_total_lbs).toFixed(0)} lbs</p>
        </div>

        <div className="metric-card">
          <h3>Light</h3>
          <p className="metric-value" style={{ color: '#a5ffbe' }}>
            {resumen?.canales_light || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>Normal</h3>
          <p className="metric-value">{resumen?.canales_normal || 0}</p>
        </div>

        <div className="metric-card">
          <h3>🥓 Con Grasa</h3>
          <p className="metric-value" style={{ color: '#ffe082' }}>
            {resumen?.canales_grasos || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>Con Papada</h3>
          <p className="metric-value" style={{ color: '#ffab91' }}>
            {resumen?.canales_papada || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>⚠️ Golpeados</h3>
          <p className="metric-value" style={{ color: '#ef9a9a' }}>
            {resumen?.canales_golpeados || 0}
          </p>
        </div>
      </div>

      {alerta?.alerta && (
        <div className="alert-box warning">
          <h3>⚠️ {alerta.mensaje}</h3>
          <p>Canales a pedir: {alerta.canales_a_pedir}</p>
          <p>Capacidad disponible: {alerta.capacidad_disponible}</p>
        </div>
      )}

      {alerta && !alerta.alerta && (
        <div className="alert-box info">
          <h3>✓ {alerta.mensaje}</h3>
        </div>
      )}

      <div className="proyeccion">
        <h3>Proyección</h3>
        <p>Demanda semanal agendada: {proyeccion?.demanda_semanal || 0} canales</p>
        <p>Días hasta agotamiento: {proyeccion?.dias_hasta_agotamiento ?? 'N/A'}</p>
      </div>

      <div className="descargas-section">
        <h3>📄 Reportes de Descargas</h3>
        {entradas.length === 0 ? (
          <p className="sin-descargas">Aún no hay descargas registradas</p>
        ) : (
          <div className="descargas-lista">
            {entradas.map((e) => (
              <div key={e.fecha} className="descarga-item">
                <div className="descarga-info">
                  <strong>{fmtFecha(e.fecha)}</strong>
                  <span>
                    {e.total_canales} canales · {num(e.peso_total).toFixed(2)} lbs
                  </span>
                  <small>
                    Light: {e.light} · Grasa: {e.grasos} · Papada: {e.con_papada} · Golpes:{' '}
                    {e.golpeados}
                  </small>
                </div>
                <button className="btn-reporte" onClick={() => verReporteDescarga(e.fecha)}>
                  📄 Ver Reporte
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={cargarDatos} className="btn-refresh">
        🔄 Refrescar Ahora
      </button>
    </div>
  );
}
