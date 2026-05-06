import React, { useState, useEffect } from 'react';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Companies from './components/Companies';
import Pipeline from './components/Pipeline';
import Leads from './components/Leads';
import Login from './components/Login';
import { Logs } from './components/Logs';
import { getCurrentUser, setCurrentUser, getUsers, ensureMasterUser } from './store';
import type { User } from './store';
import { LayoutDashboard, Building2, Kanban, Users, Settings as SettingsIcon, FileText } from 'lucide-react';
import './index.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [crmName, setCrmName] = useState('CRM B2B');
  const [currentView, setCurrentView] = useState<'dashboard' | 'companies' | 'pipeline' | 'leads' | 'settings' | 'logs'>('dashboard');
  const [editOppId, setEditOppId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    ensureMasterUser()
      .then(() => getUsers())
      .then(users => {
        const master = users.find(u => u.role === 'master');
        if (master?.companyName) setCrmName(master.companyName);
        setUser(getCurrentUser());
      })
      .finally(() => setBooting(false));
  }, []);

  const handleLoginSuccess = () => {
    const loggedUser = getCurrentUser();
    setUser(loggedUser);
    getUsers().then(users => {
      const master = users.find(u => u.role === 'master');
      if (master?.companyName) setCrmName(master.companyName);
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const handleProfileUpdate = () => {
    const updated = getCurrentUser();
    setUser(updated);
    getUsers().then(users => {
      const master = users.find(u => u.role === 'master');
      if (master?.companyName) setCrmName(master.companyName);
    });
  };

  if (booting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem', color: '#6B7280' }}>
        <Building2 size={40} color="#4F46E5" />
        <span style={{ fontSize: '1rem', fontWeight: 500 }}>Iniciando CRM...</span>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Building2 size={24} />
          <span>{crmName}</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href="#" className={`nav-item ${currentView === 'companies' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('companies'); }}>
            <Building2 size={20} /> Empresas
          </a>
          <a href="#" className={`nav-item ${currentView === 'pipeline' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('pipeline'); }}>
            <Kanban size={20} /> Pipeline
          </a>
          <a href="#" className={`nav-item ${currentView === 'leads' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('leads'); }}>
            <Users size={20} /> Leads
          </a>
          <a href="#" className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('settings'); }}>
            <SettingsIcon size={20} /> Configurações
          </a>
          {user.role === 'master' && (
            <a href="#" className={`nav-item ${currentView === 'logs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('logs'); }}>
              <FileText size={20} /> Logs (Auditoria)
            </a>
          )}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Olá, <strong>{user.name.split(' ')[0]}</strong>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', width: '100%', borderRadius: '0.5rem', color: 'var(--danger-color)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <Users size={16} style={{ transform: 'rotate(180deg)' }} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'companies' && <Companies />}
        {currentView === 'pipeline' && <Pipeline initialEditOppId={editOppId} onClearEdit={() => setEditOppId(null)} />}
        {currentView === 'leads' && <Leads onNavigateToPipeline={(oppId) => { setEditOppId(oppId); setCurrentView('pipeline'); }} />}
        {currentView === 'settings' && <Settings onProfileUpdate={handleProfileUpdate} />}
        {currentView === 'logs' && <Logs />}
      </main>
    </div>
  );
}

export default App;
