import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/ClientManager.css';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('socio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.obtenerUsuarios();
      if (Array.isArray(res)) setUsuarios(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!nombre || !username || !password) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const res = await api.crearUsuario(nombre, username, password, rol);
      if (res.success) {
        setNombre('');
        setUsername('');
        setPassword('');
        setRol('socio');
        await cargarUsuarios();
        alert('✅ Usuario creado');
      } else {
        alert('Error: ' + (res.error || 'desconocido'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="client-manager">
      <div className="form-section">
        <h2>➕ Nuevo Usuario</h2>
        <form onSubmit={crearUsuario}>
          <input
            type="text"
            placeholder="Nombre completo (ej: Luis Torres)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="text"
            placeholder="Usuario para entrar (ej: luis)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="socio">Socio (usa la app)</option>
            <option value="admin">Admin (además crea usuarios)</option>
          </select>
          <button type="submit">Crear Usuario</button>
        </form>
      </div>

      <div className="clientes-section">
        <h2>👤 Usuarios</h2>
        <div className="clientes-grid">
          {usuarios.map((u) => (
            <div key={u.id} className="cliente-item">
              <h3>{u.nombre}</h3>
              <p>@{u.username}</p>
              <span className={`pedido-tag ${u.rol === 'admin' ? '' : ''}`}>
                {u.rol === 'admin' ? '🔑 Admin' : 'Socio'}
              </span>
              {!u.activo && <span className="pref-tag normal">Inactivo</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
