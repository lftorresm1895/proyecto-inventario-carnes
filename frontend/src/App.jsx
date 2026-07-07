import { useState } from 'react';
import { PickingList } from './components/PickingList';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ClientManager } from './components/ClientManager';
import { EntradaCanales } from './components/EntradaCanales';
import { Despiece } from './components/Despiece';
import { Usuarios } from './components/Usuarios';
import { Login } from './components/Login';
import { getUsuario, logout } from './api';
import './App.css';

function App() {
  const [view, setView] = useState('picking');
  const [usuario, setUsuario] = useState(getUsuario());

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>🥩 Inventario de Carnes</h1>
        <div className="nav-buttons">
          <button
            className={view === 'picking' ? 'active' : ''}
            onClick={() => setView('picking')}
          >
            📋 Picking
          </button>
          <button
            className={view === 'entrada' ? 'active' : ''}
            onClick={() => setView('entrada')}
          >
            🚚 Entrada
          </button>
          <button
            className={view === 'clientes' ? 'active' : ''}
            onClick={() => setView('clientes')}
          >
            👥 Clientes
          </button>
          <button
            className={view === 'despiece' ? 'active' : ''}
            onClick={() => setView('despiece')}
          >
            🔪 Despiece
          </button>
          <button
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            📊 Dashboard
          </button>
          {usuario.rol === 'admin' && (
            <button
              className={view === 'usuarios' ? 'active' : ''}
              onClick={() => setView('usuarios')}
            >
              👤 Usuarios
            </button>
          )}
        </div>
        <div className="user-info">
          <span>👤 {usuario.nombre}</span>
          <button className="btn-logout" onClick={logout}>
            Salir
          </button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'picking' && <PickingList />}
        {view === 'entrada' && <EntradaCanales />}
        {view === 'clientes' && <ClientManager />}
        {view === 'despiece' && <Despiece />}
        {view === 'dashboard' && <InventoryDashboard />}
        {view === 'usuarios' && usuario.rol === 'admin' && <Usuarios />}
      </main>
    </div>
  );
}

export default App;
