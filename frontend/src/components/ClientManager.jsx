import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/ClientManager.css';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const diasVacios = () =>
  DIAS.reduce((acc, d) => ({ ...acc, [d]: '' }), {});

export function ClientManager() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario (crear o editar)
  const [editandoId, setEditandoId] = useState(null); // null = creando
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [preferencia, setPreferencia] = useState('cualquiera');
  const [precioLb, setPrecioLb] = useState('');
  const [cuentaActiva, setCuentaActiva] = useState(false);
  const [diasPedido, setDiasPedido] = useState(diasVacios());
  const [guardando, setGuardando] = useState(false);

  // Cuenta expandida
  const [cuentaAbierta, setCuentaAbierta] = useState(null);
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

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setPreferencia('cualquiera');
    setPrecioLb('');
    setCuentaActiva(false);
    setDiasPedido(diasVacios());
  };

  const empezarEdicion = (cliente) => {
    setEditandoId(cliente.id);
    setNombre(cliente.nombre || '');
    setTelefono(cliente.telefono || '');
    setEmail(cliente.email || '');
    setPreferencia(cliente.preferencia || 'cualquiera');
    setPrecioLb(cliente.precio_lb > 0 ? String(cliente.precio_lb) : '');
    setCuentaActiva(!!cliente.cuenta_activa);

    const dias = diasVacios();
    (cliente.pedidos_agendados || [])
      .filter((p) => p && p.activo !== false)
      .forEach((p) => {
        if (dias[p.dia] !== undefined) dias[p.dia] = String(p.cantidad_canales);
      });
    setDiasPedido(dias);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!nombre) {
      alert('Ingresa nombre del cliente');
      return;
    }

    const pedidos_agendados = DIAS
      .filter((d) => diasPedido[d] && parseInt(diasPedido[d]) > 0)
      .map((d) => ({ dia: d, cantidad_canales: parseInt(diasPedido[d]) }));

    const datos = {
      nombre,
      telefono,
      email,
      preferencia,
      precio_lb: precioLb,
      cuenta_activa: cuentaActiva,
      pedidos_agendados,
    };

    try {
      setGuardando(true);
      const res = editandoId
        ? await api.editarCliente(editandoId, datos)
        : await api.crearCliente(datos);

      if (res.success) {
        limpiarFormulario();
        await cargarClientes();
        alert(editandoId ? '✅ Cliente actualizado' : '✅ Cliente creado');
      } else {
        alert('Error: ' + (res.error || 'desconocido'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const setCantidadDia = (dia, valor) => {
    setDiasPedido((prev) => ({ ...prev, [dia]: valor }));
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
  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="client-manager">
      <div className="form-section">
        <h2>{editandoId ? '✏️ Editando Cliente' : '➕ Nuevo Cliente'}</h2>
        <form onSubmit={guardarCliente}>
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
            <option value="light">Preferencia: Solo Light (sin grasa/papada)</option>
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

          <div className="dias-grid-section">
            <label className="dias-titulo">📅 Días de pedido (canales por día):</label>
            <div className="dias-grid">
              {DIAS.map((dia) => (
                <div key={dia} className="dia-item">
                  <span>{capitalizar(dia)}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={diasPedido[dia]}
                    onChange={(e) => setCantidadDia(dia, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <small className="flag-hint">Deja en blanco los días que no pide</small>
          </div>

          <div className="form-acciones">
            <button type="submit" disabled={guardando}>
              {guardando
                ? 'Guardando...'
                : editandoId
                ? '💾 Guardar Cambios'
                : 'Crear Cliente'}
            </button>
            {editandoId && (
              <button type="button" className="btn-cancelar" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="clientes-section">
        <h2>👥 Clientes & Pedidos</h2>
        {clientes.length === 0 ? (
          <p>No hay clientes</p>
        ) : (
          <div className="clientes-grid">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="cliente-item">
                <div className="cliente-top">
                  <h3>{cliente.nombre}</h3>
                  <button className="btn-editar" onClick={() => empezarEdicion(cliente)}>
                    ✏️ Editar
                  </button>
                </div>
                <p>{cliente.telefono}</p>

                {cliente.preferencia && cliente.preferencia !== 'cualquiera' && (
                  <span className={`pref-tag ${cliente.preferencia}`}>
                    {cliente.preferencia === 'light' ? '🥓 Solo Light' : 'Solo Normal'}
                  </span>
                )}

                {parseFloat(cliente.precio_lb) > 0 && (
                  <p className="precio-linea">💵 {fmtMonto(cliente.precio_lb)}/lb</p>
                )}

                {cliente.pedidos_agendados && cliente.pedidos_agendados.filter((p) => p).length > 0 ? (
                  <div className="pedidos">
                    {cliente.pedidos_agendados
                      .filter((p) => p)
                      .map((p, i) => (
                        <span key={i} className="pedido-tag">
                          {capitalizar(p.dia || '')}: {p.cantidad_canales}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="sin-pedidos">Sin días de pedido — edita para agregar</p>
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
