import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/Dashboard.css';

export function InventoryDashboard() {
  const [resumen, setResumen] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [proyeccion, setProyeccion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Refrescar cada 30s
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [r, a, p] = await Promise.all([
        api.obtenerResumen(),
        api.obtenerAlertaReorden(),
        api.obtenerProyeccion(),
      ]);
      setResumen(r);
      setAlerta(a);
      setProyeccion(p);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="dashboard">
      <h2>📊 Estado del Inventario</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Canales</h3>
          <p className="metric-value">{resumen?.total_canales || 0}</p>
        </div>

        <div className="metric-card">
          <h3>Peso Total</h3>
          <p className="metric-value">
            {resumen?.peso_total_lbs?.toFixed(0) || 0} lbs
          </p>
        </div>

        <div className="metric-card">
          <h3>Light</h3>
          <p className="metric-value" style={{ color: '#4CAF50' }}>
            {resumen?.canales_light || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>Normal</h3>
          <p className="metric-value" style={{ color: '#2196F3' }}>
            {resumen?.canales_normal || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>🥓 Con Grasa</h3>
          <p className="metric-value" style={{ color: '#FFC107' }}>
            {resumen?.canales_grasos || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>Con Papada</h3>
          <p className="metric-value" style={{ color: '#FF7043' }}>
            {resumen?.canales_papada || 0}
          </p>
        </div>

        <div className="metric-card">
          <h3>⚠️ Golpeados</h3>
          <p className="metric-value" style={{ color: '#EF5350' }}>
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

      {!alerta?.alerta && (
        <div className="alert-box info">
          <h3>✓ {alerta?.mensaje}</h3>
        </div>
      )}

      <div className="proyeccion">
        <h3>Proyección</h3>
        <p>Demanda semanal: {proyeccion?.demanda_semanal || 0} canales</p>
        <p>Días hasta agotamiento: {proyeccion?.dias_hasta_agotamiento}</p>
      </div>

      <button onClick={cargarDatos} className="btn-refresh">
        🔄 Refrescar Ahora
      </button>
    </div>
  );
}
