import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Briefcase, Building2, Lock, Shield, Trash2, Edit2 } from 'lucide-react';
import { getUsers, saveUsers, getCurrentUser, setCurrentUser } from '../store';
import type { User } from '../store';
import CryptoJS from 'crypto-js';

interface SettingsProps {
  onProfileUpdate?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onProfileUpdate }) => {
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  
  // Profile Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Admin User Edit
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
      setName(user.name || '');
      setPhone(user.phone || '');
      setRoleTitle(user.roleTitle || '');
      setCompanyName(user.companyName || '');
    }
    setUsers(getUsers());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      name,
      phone,
      roleTitle,
      companyName
    };
    
    updateUserInDB(updatedUser);
    setCurrentUser(updatedUser);
    setLocalCurrentUser(updatedUser);
    if (onProfileUpdate) onProfileUpdate();
    showMessage('Perfil atualizado com sucesso!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (CryptoJS.SHA256(currentPassword).toString() !== currentUser.passwordHash) {
      alert('Senha atual incorreta.');
      return;
    }
    
    const passError = validatePassword(newPassword);
    if (passError) {
      alert(passError);
      return;
    }
    
    const updatedUser = {
      ...currentUser,
      passwordHash: CryptoJS.SHA256(newPassword).toString()
    };
    
    updateUserInDB(updatedUser);
    setCurrentUser(updatedUser);
    setLocalCurrentUser(updatedUser);
    setCurrentPassword('');
    setNewPassword('');
    showMessage('Senha atualizada com sucesso!');
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta aqui.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      const updatedList = users.filter(u => u.id !== id);
      setUsers(updatedList);
      saveUsers(updatedList);
      showMessage('Usuário excluído.');
    }
  };

  const handleRoleChange = (id: string, newRole: 'master' | 'user') => {
    if (id === currentUser?.id) {
      alert('Você não pode alterar seu próprio nível de acesso aqui.');
      return;
    }
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return;
    const updatedUser: User = { ...userToUpdate, role: newRole };
    updateUserInDB(updatedUser);
    showMessage(`Nível de acesso de ${updatedUser.name} atualizado para ${newRole === 'master' ? 'Master' : 'Basic'}.`);
  };

  const handleSaveAdminPassword = () => {
    if (!editingUser) return;
    const passError = validatePassword(adminNewPassword);
    if (passError) {
      alert(passError);
      return;
    }
    
    const updatedUser = {
      ...editingUser,
      passwordHash: CryptoJS.SHA256(adminNewPassword).toString()
    };
    
    updateUserInDB(updatedUser);
    setEditingUser(null);
    setAdminNewPassword('');
    showMessage(`Senha de ${editingUser.name} alterada.`);
  };

  const updateUserInDB = (userToUpdate: User) => {
    const allUsers = getUsers();
    const updatedList = allUsers.map(u => u.id === userToUpdate.id ? userToUpdate : u);
    setUsers(updatedList);
    saveUsers(updatedList);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'A senha deve conter pelo menos uma letra maiúscula.';
    if (!/[0-9]/.test(pass)) return 'A senha deve conter pelo menos um número.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'A senha deve conter pelo menos um caractere especial.';
    return null;
  };

  if (!currentUser) return null;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Configurações</h1>
        {message && (
          <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {message}
          </div>
        )}
      </header>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Seção Meu Perfil */}
          <div style={{ gridColumn: 'span 6', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <UserIcon size={20} /> Meu Perfil
            </h2>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group mb-0">
                <label className="form-label">Nome Completo</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Telefone de Contato</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: '2.25rem' }} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group mb-0 flex-1">
                  <label className="form-label">Cargo</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} style={{ paddingLeft: '2.25rem' }} placeholder="Ex: Diretor Comercial" />
                  </div>
                </div>
                <div className="form-group mb-0 flex-1">
                  <label className="form-label">Nome da Empresa</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      style={{ paddingLeft: '2.25rem', backgroundColor: currentUser.role !== 'master' ? '#F1F5F9' : 'var(--surface-color)', cursor: currentUser.role !== 'master' ? 'not-allowed' : 'text' }} 
                      placeholder="Sua Empresa" 
                      disabled={currentUser.role !== 'master'}
                      title={currentUser.role !== 'master' ? "Apenas usuários Master podem alterar o nome da empresa." : ""}
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-2">Salvar Perfil</button>
            </form>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Lock size={18} /> Alterar Senha
            </h3>
            
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group mb-0">
                <label className="form-label">Senha Atual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial" />
              </div>
              <button type="submit" className="btn btn-secondary mt-2">Atualizar Senha</button>
            </form>
          </div>

          {/* Seção Admin (Apenas Master) */}
          {currentUser.role === 'master' && (
            <div style={{ gridColumn: 'span 6', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: '#4338CA' }}>
                <Shield size={20} /> Painel Master - Gerenciar Usuários
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.name}
                        {u.id === currentUser.id ? (
                          <span className="badge" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '0.65rem' }}>Master</span>
                        ) : (
                          <select 
                            value={u.role || 'user'} 
                            onChange={(e) => handleRoleChange(u.id, e.target.value as 'master' | 'user')}
                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', backgroundColor: u.role === 'master' ? '#FEF08A' : '#E2E8F0', color: u.role === 'master' ? '#854D0E' : '#475569', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            <option value="user">Basic</option>
                            <option value="master">Master</option>
                          </select>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setEditingUser(u)}
                        title="Alterar Senha"
                      >
                        <Edit2 size={14} /> Senha
                      </button>
                      {u.id !== currentUser.id && (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Excluir Usuário"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Alterar senha de {editingUser.name}</h2>
              <button onClick={() => setEditingUser(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input 
                  type="text" 
                  value={adminNewPassword} 
                  onChange={e => setAdminNewPassword(e.target.value)} 
                  placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveAdminPassword}>Salvar Nova Senha</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
