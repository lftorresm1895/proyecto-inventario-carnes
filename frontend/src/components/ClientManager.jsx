import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/ClientManager.css';

export function ClientManager() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [preferencia, setPreferencia] = useState('cualquiera');
  const [precioLb, setPrecioLb] = useState('');
  const [cuentaActiva, setCuentaActiva] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [dia, setDia] = useState('lunes');
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(true);

  // Cuenta expandida
  const [cuentaAbierta, setCuentaAbierta] = useState(null); // cliente id
  const [cuentaData, setCuentaData] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [descAbono, setDescAbono] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await api.obtenerClientes();
      if (Array.isArray(res)) setClientes(res);
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
      await api.crearCliente(nombre, telefono, email, preferencia, precioLb, cuentaActiva);
      setNombre('');
      setTelefono('');
      setEmail('');
      setPreferencia('cualquiera');
      setPrecioLb('');
      setCuentaActiva(false);
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

  const verCuenta = async (clienteId) => {
    if (cuentaAbierta === clienteId) {
      setCuentaAbierta(null);
      setCuentaData(null);
      return;
    }
    setCuentaAbierta(clienteId);
    setCuentaData(null);
    try {
      const res = await api.obtenerCuenta(clienteId);
      setCuentaData(res);
    } catch (err) {
      alert('Error cargando cuenta: ' + err.message);
    }
  };

  const abonar = async (clienteId) => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }
    try {
      await api.registrarAbono(clienteId, parseFloat(montoAbono), descAbono);
      setMontoAbono('');
      setDescAbono('');
      const res = await api.obtenerCuenta(clienteId);
      setCuentaData(res);
      await cargarClientes();
      alert('✅ Abono registrado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const fmtMonto = (m) => `$${parseFloat(m).toFixed(2)}`;

  if (loading) return <div className="loading">Cargando...</div>;

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
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select value={preferencia} onChange={(e) => setPreferencia(e.target.value)}>
            <option value="cualquiera">Preferencia: Cualquiera</option>
            <option value="light">Preferencia: Solo Light (sin papada)</option>
            <option value="normal">Preferencia: Solo Normal</option>
          </select>
          <input
            type="number"
            placeholder="Precio por libra (ej: 1.35)"
            value={precioLb}
            onChange={(e) => setPrecioLb(e.target.value)}
            step="0.01"
            min="0"
          />
          <label className="check-line">
            <input
              type="checkbox"
              checked={cuentaActiva}
              onChange={(e) => setCuentaActiva(e.target.checked)}
            />
            Llevar cuenta corriente (cargos automáticos al confirmar pedidos)
          </label>
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
            <option value="lunes">Lunes</option>
            <option value="martes">Martes</option>
            <option value="miercoles">Miércoles</option>
            <option value="jueves">Jueves</option>
            <option value="viernes">Viernes</option>
            <option value="sabado">Sábado</option>
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

                {parseFloat(cliente.precio_lb) > 0 && (
                  <p className="precio-linea">💵 {fmtMonto(cliente.precio_lb)}/lb</p>
                )}

                {cliente.pedidos_agendados && cliente.pedidos_agendados.length > 0 && (
                  <div className="pedidos">
                    {cliente.pedidos_agendados
                      .filter((p) => p)
                      .map((p, i) => (
                        <span key={i} className="pedido-tag">
                          {p.dia?.charAt(0).toUpperCase() + p.dia?.slice(1)}: {p.cantidad_canales}
                        </span>
                      ))}
                  </div>
                )}

                {cliente.cuenta_activa && (
                  <div className="cuenta-resumen">
                    <span className={parseFloat(cliente.saldo) > 0 ? 'saldo debe' : 'saldo'}>
                      Saldo: {fmtMonto(cliente.saldo)}
                    </span>
                    <button className="btn-cuenta" onClick={() => verCuenta(cliente.id)}>
                      {cuentaAbierta === cliente.id ? 'Cerrar' : 'Ver cuenta'}
                    </button>
                  </div>
                )}

                {cuentaAbierta === cliente.id && (
                  <div className="cuenta-detalle">
                    {!cuentaData ? (
                      <p>Cargando...</p>
                    ) : (
                      <>
                        <div className="abono-form">
                          <input
                            type="number"
                            placeholder="Monto abono"
                            value={montoAbono}
                            onChange={(e) => setMontoAbono(e.target.value)}
                            step="0.01"
                          />
                          <input
                            type="text"
                            placeholder="Nota (opcional)"
                            value={descAbono}
                            onChange={(e) => setDescAbono(e.target.value)}
                          />
                          <button onClick={() => abonar(cliente.id)}>💰 Abonar</button>
                        </div>

                        <div className="movimientos">
                          {cuentaData.movimientos.length === 0 && <p>Sin movimientos aún</p>}
                          {cuentaData.movimientos.map((m) => (
                            <div key={m.id} className={`mov ${m.tipo}`}>
                              <div className="mov-desc">
                                {m.descripcion}
                                <small>
                                  {new Date(m.fecha).toLocaleDateString()} ·{' '}
                                  {m.creado_por || 'sistema'}
                                </small>
                              </div>
                              <div className="mov-monto">
                                {m.tipo === 'cargo' ? '+' : '−'}
                                {fmtMonto(m.monto)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
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
