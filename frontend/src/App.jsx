import { useState } from 'react';
import { PickingList } from './components/PickingList';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ClientManager } from './components/ClientManager';
import { EntradaCanales } from './components/EntradaCanales';
import { Despiece } from './components/Despiece';
import './App.css';

function App() {
  const [view, setView] = useState('picking');

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
        </div>
      </nav>

      <main className="main-content">
        {view === 'picking' && <PickingList />}
        {view === 'entrada' && <EntradaCanales />}
        {view === 'clientes' && <ClientManager />}
        {view === 'despiece' && <Despiece />}
        {view === 'dashboard' && <InventoryDashboard />}
      </main>
    </div>
  );
}

export default App;
