import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/ClientManager.css';

export function ClientManager() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [preferencia, setPreferencia] = useState('cualquiera');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [dia, setDia] = useState('lunes');
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await api.obtenerClientes();
      setClientes(res);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearCliente = async (e) => {
    e.preventDefault();
    if (!nombre) {
      alert('Ingresa nombre del cliente');
      return;
    }

    try {
      await api.crearCliente(nombre, telefono, email, preferencia);
      setNombre('');
      setTelefono('');
      setEmail('');
      setPreferencia('cualquiera');
      await cargarClientes();
      alert('✅ Cliente creado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const crearPedidoAgendado = async () => {
    if (!selectedCliente || !cantidad) {
      alert('Selecciona cliente y cantidad');
      return;
    }

    try {
      await api.crearPedidoAgendado(selectedCliente, dia, parseInt(cantidad));
      setCantidad('');
      await cargarClientes();
      alert('✅ Pedido agendado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="client-manager">
      <div className="form-section">
        <h2>➕ Nuevo Cliente</h2>
        <form onSubmit={crearCliente}>
          <input
            type="text"
            placeholder="Nombre cliente"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select value={preferencia} onChange={(e) => setPreferencia(e.target.value)}>
            <option value="cualquiera">Preferencia: Cualquiera</option>
            <option value="light">Preferencia: Solo Light (sin papada)</option>
            <option value="normal">Preferencia: Solo Normal</option>
          </select>
          <button type="submit">Crear Cliente</button>
        </form>
      </div>

      <div className="form-section">
        <h2>📅 Pedido Agendado</h2>
        <div className="form-group">
          <select value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)}>
            <option value="">Selecciona cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select value={dia} onChange={(e) => setDia(e.target.value)}>
            <option>lunes</option>
            <option>miercoles</option>
            <option>viernes</option>
          </select>

          <input
            type="number"
            placeholder="Canales"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
          />

          <button onClick={crearPedidoAgendado}>Agendar</button>
        </div>
      </div>

      <div className="clientes-section">
        <h2>👥 Clientes & Pedidos</h2>
        {clientes.length === 0 ? (
          <p>No hay clientes</p>
        ) : (
          <div className="clientes-grid">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="cliente-item">
                <h3>{cliente.nombre}</h3>
                <p>{cliente.telefono}</p>
                {cliente.preferencia && cliente.preferencia !== 'cualquiera' && (
                  <span className={`pref-tag ${cliente.preferencia}`}>
                    {cliente.preferencia === 'light' ? '🥓 Solo Light' : 'Solo Normal'}
                  </span>
                )}
                {cliente.pedidos_agendados && cliente.pedidos_agendados.length > 0 && (
                  <div className="pedidos">
                    {cliente.pedidos_agendados.map((p) => (
                      <span key={p.id} className="pedido-tag">
                        {p.dia.charAt(0).toUpperCase() + p.dia.slice(1)}: {p.cantidad_canales}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
