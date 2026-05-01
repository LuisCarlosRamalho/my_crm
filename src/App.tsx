import React, { useState } from 'react';
import { LayoutDashboard, Building2, Kanban } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Companies from './components/Companies';
import Pipeline from './components/Pipeline';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'companies' | 'pipeline'>('dashboard');

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Building2 size={24} />
          <span>CRM B2B</span>
        </div>
        <nav className="sidebar-nav">
          <a
            href="#"
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a
            href="#"
            className={`nav-item ${currentView === 'companies' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentView('companies'); }}
          >
            <Building2 size={20} />
            Empresas
          </a>
          <a
            href="#"
            className={`nav-item ${currentView === 'pipeline' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentView('pipeline'); }}
          >
            <Kanban size={20} />
            Pipeline
          </a>
        </nav>
      </aside>

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'companies' && <Companies />}
        {currentView === 'pipeline' && <Pipeline />}
      </main>
    </div>
  );
}

export default App;
