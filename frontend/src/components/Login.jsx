import { useState } from 'react';
import { api } from '../api';
import '../styles/Login.css';

export function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      setCargando(true);
      setError(null);
      const res = await api.login(username, password);

      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        onLogin(res.usuario);
      } else {
        setError(res.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('No se pudo conectar al servidor. Intenta de nuevo (el servidor puede tardar ~1 min en despertar).');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>🥩 Inventario de Carnes</h1>
        <p className="login-sub">Inicia sesión para continuar</p>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoCapitalize="none"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
