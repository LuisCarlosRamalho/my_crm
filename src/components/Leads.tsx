import React, { useState, useEffect } from 'react';
import { getCompanies, getOpportunities, saveCompanies, getCurrentUser } from '../store';
import type { Company, Opportunity, Contact, ContactProfile, Activity as StoreActivity, ActivityType } from '../store';
import { Building2, Globe, Phone, Mail, User, Briefcase, ExternalLink, Activity as ActivityIcon, UserPlus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface LeadsProps {
  onNavigateToPipeline?: (oppId: string) => void;
}

const getLocalDatetime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const Leads: React.FC<LeadsProps> = ({ onNavigateToPipeline }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOppForSummary, setSelectedOppForSummary] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<StoreActivity[]>([]);
  const [editingActivities, setEditingActivities] = useState<Record<string, boolean>>({});
  const [newActivity, setNewActivity] = useState<Partial<StoreActivity>>({
    type: 'Telefone',
    notes: '',
    date: getLocalDatetime()
  });

  useEffect(() => {
    setCompanies(getCompanies());
    setOpportunities(getOpportunities());
  }, []);

  const getOpenOpportunities = (companyId: string) => {
    return opportunities.filter(o => o.companyId === companyId && !o.isLost && o.status !== 'Fechamento');
  };

  const openEdit = (company?: Company) => {
    if (company) {
      setFormData(company);
      setContacts(company.contacts);
      setActivities(company.activities || []);
    } else {
      setFormData({});
      setContacts([]);
      setActivities([]);
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.fantasyName) {
      alert("Por favor, preencha o Nome Fantasia.");
      return;
    }
    
    const updatedCompany: Company = {
      id: formData.id || uuidv4(),
      fantasyName: formData.fantasyName,
      corporateName: formData.corporateName || '',
      cnpj: formData.cnpj || '',
      segment: formData.segment || '',
      website: formData.website || '',
      address: formData.address || '',
      city: formData.city || '',
      neighborhood: formData.neighborhood || '',
      zipCode: formData.zipCode || '',
      phone: formData.phone || '',
      contacts: contacts,
      activities: activities
    };

    let updated;
    if (formData.id) {
      updated = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
    } else {
      updated = [...companies, updatedCompany];
    }
    
    setCompanies(updated);
    saveCompanies(updated);
    setShowModal(false);
  };

  const addContact = () => {
    setContacts([...contacts, { id: uuidv4(), name: '', email: '', whatsapp: '', profile: 'Contato Operacional' }]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddActivity = () => {
    if (!newActivity.notes) {
      alert("Por favor, preencha as notas do atendimento.");
      return;
    }
    const user = getCurrentUser();
    const activityToAdd: StoreActivity = {
      id: uuidv4(),
      type: newActivity.type as ActivityType || 'Telefone',
      notes: newActivity.notes,
      date: newActivity.date || getLocalDatetime(),
      author: user ? user.name : 'Usuário'
    };
    
    const updatedActivities = [activityToAdd, ...activities];
    setActivities(updatedActivities);
    
    if (formData.id) {
      const updatedCompany = { ...formData, activities: updatedActivities } as Company;
      const updatedList = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      setCompanies(updatedList);
      saveCompanies(updatedList);
    }
    
    setNewActivity({ type: 'Telefone', notes: '', date: getLocalDatetime() });
  };

  const getActivityColor = (type: ActivityType) => {
    switch(type) {
      case 'WhatsApp': return { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' };
      case 'E-mail': return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' };
      case 'Telefone': return { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8' };
      case 'Visita': return { bg: '#FEFCE8', border: '#FEF08A', text: '#854D0E' };
      case 'Reunião': return { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' };
      case 'Vídeochamada': return { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' };
      default: return { bg: '#F9FAFB', border: '#E5E7EB', text: '#374151' };
    }
  };

  const updateActivity = (id: string, field: keyof StoreActivity, value: string) => {
    const updatedActivities = activities.map(a => a.id === id ? { ...a, [field]: value } : a);
    setActivities(updatedActivities);
    if (formData.id) {
      const updatedCompany = { ...formData, activities: updatedActivities } as Company;
      const updatedList = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      setCompanies(updatedList);
      saveCompanies(updatedList);
    }
  };

  const deleteActivity = (id: string) => {
    const updatedActivities = activities.filter(a => a.id !== id);
    setActivities(updatedActivities);
    if (formData.id) {
      const updatedCompany = { ...formData, activities: updatedActivities } as Company;
      const updatedList = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      setCompanies(updatedList);
      saveCompanies(updatedList);
    }
  };

  const toggleEditActivity = (id: string) => {
    setEditingActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentUser = getCurrentUser();
  const isEdit = !!formData.id;
  const canEdit = currentUser?.role === 'master' || !isEdit;

  if (showModal) {
    return (
      <>
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Voltar</button>
            <h1 className="page-title">{formData.id ? `Dados do Lead: ${formData.fantasyName}` : 'Novo Lead'}</h1>
          </div>
          {canEdit && <button className="btn btn-primary" onClick={handleSave}>Salvar Alterações</button>}
        </header>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Coluna 1: Informações de Cadastro */}
            <div style={{ gridColumn: 'span 6', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} /> Informações de Cadastro
              </h2>
              
              <div className="form-group">
                <label className="form-label">Nome Fantasia</label>
                <input 
                  value={formData.fantasyName || ''} 
                  onChange={e => setFormData({...formData, fantasyName: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Razão Social</label>
                <input 
                  value={formData.corporateName || ''} 
                  onChange={e => setFormData({...formData, corporateName: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">CNPJ</label>
                  <input 
                    value={formData.cnpj || ''} 
                    onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Segmento</label>
                  <input 
                    value={formData.segment || ''} 
                    onChange={e => setFormData({...formData, segment: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-[2]">
                  <label className="form-label">Site da Empresa (Website)</label>
                  <input 
                    value={formData.website || ''} 
                    onChange={e => setFormData({...formData, website: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Telefone (Empresa)</label>
                  <input 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <h3 className="font-medium mt-4 mb-2 border-b pb-1 text-muted">Localização</h3>
              <div className="flex gap-4">
                <div className="form-group flex-[2]">
                  <label className="form-label">Endereço (Rua, Número, Complemento)</label>
                  <input 
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">CEP</label>
                  <input 
                    value={formData.zipCode || ''} 
                    onChange={e => setFormData({...formData, zipCode: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Bairro</label>
                  <input 
                    value={formData.neighborhood || ''} 
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Cidade / UF</label>
                  <input 
                    value={formData.city || ''} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
              </div>
              <div className="mt-8 mb-4">
                <div className="flex justify-between items-center mb-4 border-b pb-1">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Contatos
                  </h2>
                  {canEdit && (
                    <button className="btn btn-secondary btn-sm" onClick={addContact}>
                      <UserPlus size={14} /> Adicionar Contato
                    </button>
                  )}
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {contacts.map((contact, index) => (
                    <div key={contact.id} style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: '#F8FAFC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">Contato {index + 1}</span>
                        {canEdit && <button className="text-danger" onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}>&times;</button>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nome</label>
                        <input value={contact.name} onChange={e => updateContact(contact.id, 'name', e.target.value)} />
                      </div>
                      <div className="flex gap-4">
                        <div className="form-group flex-1">
                          <label className="form-label">Perfil</label>
                          <select value={contact.profile} onChange={e => updateContact(contact.id, 'profile', e.target.value as ContactProfile)}>
                            <option value="Sócio">Sócio</option>
                            <option value="Influenciador">Influenciador</option>
                            <option value="Contato Operacional">Contato Operacional</option>
                          </select>
                        </div>
                        <div className="form-group flex-1">
                          <label className="form-label">WhatsApp</label>
                          <input value={contact.whatsapp} onChange={e => updateContact(contact.id, 'whatsapp', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">E-mail</label>
                        <input type="email" value={contact.email} onChange={e => updateContact(contact.id, 'email', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && <p className="text-sm text-muted">Nenhum contato adicionado.</p>}
                  {!canEdit && <p className="text-xs text-muted italic mt-2">Apenas usuários Master podem editar os dados da empresa.</p>}
                </div>
              </div>

            </div>

            {/* Coluna 2: Registros e Contatos */}
            <div style={{ gridColumn: 'span 6', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>

              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <ActivityIcon size={20} /> Atendimento / Follow-up
                </h2>
                
                {/* Form to add new activity */}
                <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginBottom: '1.5rem', backgroundColor: '#F8FAFC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 className="font-medium text-sm mb-3">Registrar Novo Atendimento</h3>
                  <div className="flex gap-4">
                    <div className="form-group flex-1">
                      <label className="form-label">Canal</label>
                      <select 
                        value={newActivity.type} 
                        onChange={e => setNewActivity({...newActivity, type: e.target.value as ActivityType})}
                      >
                        <option value="Telefone">Telefone</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Visita">Visita</option>
                        <option value="Reunião">Reunião</option>
                        <option value="Vídeochamada">Vídeochamada</option>
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">Data e Hora</label>
                      <input 
                        type="datetime-local" 
                        value={newActivity.date} 
                        onChange={e => setNewActivity({...newActivity, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <textarea 
                      value={newActivity.notes} 
                      onChange={e => setNewActivity({...newActivity, notes: e.target.value})} 
                      rows={3}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                      placeholder="Detalhes da conversa..."
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddActivity}>
                    Salvar Atendimento
                  </button>
                </div>
                
                {/* History List */}
                <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {activities.map((activity) => {
                    const colors = getActivityColor(activity.type);
                    const isMaster = getCurrentUser()?.role === 'master';
                    return (
                      <div 
                        key={activity.id} 
                        style={{ 
                          backgroundColor: colors.bg, 
                          border: `1px solid ${colors.border}`,
                          padding: '1.25rem 1.5rem',
                          marginBottom: '1.25rem',
                          borderRadius: '0.75rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: colors.text, fontSize: '0.95rem' }}>{activity.type}</span>
                            <span style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.8 }}>
                              Por: <strong>{activity.author || 'Usuário'}</strong> • {new Date(activity.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          {isMaster && (
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              <button 
                                onClick={() => toggleEditActivity(activity.id)}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: '0.35rem', 
                                  padding: '0.25rem 0.5rem', 
                                  fontSize: '0.7rem', 
                                  fontWeight: 600, 
                                  color: editingActivities[activity.id] ? '#047857' : '#64748B', 
                                  backgroundColor: editingActivities[activity.id] ? '#D1FAE5' : 'rgba(255,255,255,0.5)',
                                  borderRadius: '1rem',
                                  border: `1px solid ${editingActivities[activity.id] ? '#A7F3D0' : 'transparent'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                className="hover:opacity-80"
                                title={editingActivities[activity.id] ? "Concluir Edição" : "Editar"}
                              >
                                <Edit2 size={10} /> {editingActivities[activity.id] ? 'Concluir' : 'Editar'}
                              </button>
                              <button 
                                onClick={() => deleteActivity(activity.id)}
                                style={{ 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  padding: '0.35rem', 
                                  color: '#EF4444', 
                                  backgroundColor: 'transparent',
                                  borderRadius: '50%',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: 0.7
                                }}
                                className="hover:opacity-100 hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        {isMaster && editingActivities[activity.id] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <select 
                                value={activity.type} 
                                onChange={e => updateActivity(activity.id, 'type', e.target.value as ActivityType)}
                                style={{ flex: 1, padding: '0.25rem', fontSize: '0.875rem', borderRadius: '0.25rem', border: `1px solid ${colors.border}`, backgroundColor: 'rgba(255,255,255,0.7)', outline: 'none' }}
                              >
                                <option value="Telefone">Telefone</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="E-mail">E-mail</option>
                                <option value="Visita">Visita</option>
                                <option value="Reunião">Reunião</option>
                                <option value="Vídeochamada">Vídeochamada</option>
                              </select>
                              <input 
                                type="datetime-local" 
                                value={activity.date} 
                                onChange={e => updateActivity(activity.id, 'date', e.target.value)} 
                                style={{ flex: 1, padding: '0.25rem', fontSize: '0.875rem', borderRadius: '0.25rem', border: `1px solid ${colors.border}`, backgroundColor: 'rgba(255,255,255,0.7)', outline: 'none' }}
                              />
                            </div>
                            <textarea 
                              value={activity.notes} 
                              onChange={e => updateActivity(activity.id, 'notes', e.target.value)} 
                              rows={3}
                              style={{ 
                                width: '100%', 
                                padding: '0.5rem', 
                                borderRadius: '0.25rem', 
                                border: `1px solid ${colors.border}`, 
                                backgroundColor: 'rgba(255,255,255,0.7)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {activity.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activities.length === 0 && <p className="text-sm text-muted">Nenhum atendimento registrado.</p>}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Leads</h1>
        <button className="btn btn-primary" onClick={() => openEdit()}>
          Novo Lead
        </button>
      </header>

      <div className="page-body">
        <div className="dashboard-grid">
          {companies.map(company => {
            const openOpps = getOpenOpportunities(company.id);
            return (
              <div 
                key={company.id} 
                className="kanban-card" 
                style={{ 
                  gridColumn: 'span 12', 
                  cursor: 'pointer', 
                  transform: 'none', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  padding: '1.5rem'
                }}
                onClick={() => openEdit(company)}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                  
                  {/* Left Column: Company Info */}
                  <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Building2 size={24} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>{company.fantasyName}</h3>
                      </div>
                      {company.corporateName && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{company.corporateName}</div>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
                      {company.segment && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <Briefcase size={16} /> {company.segment}
                        </div>
                      )}
                      
                      {company.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }}>
                          <Globe size={16} color="var(--text-muted)" />
                          <a 
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: 'var(--primary-color)', textDecoration: 'none' }} 
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      
                      {company.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }}>
                          <Phone size={16} color="var(--text-muted)" />
                          <span>{company.phone}</span>
                        </div>
                      )}

                      {(company.city || company.address) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <MapPin size={16} />
                          <span>{[company.city, company.address ? company.address.split(',')[0] : ''].filter(Boolean).join(' - ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Oportunidades Section */}
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: openOpps.length > 0 ? '#FEFCE8' : '#F9FAFB', 
                      border: `1px solid ${openOpps.length > 0 ? '#FEF08A' : 'var(--border-color)'}` 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: openOpps.length > 0 ? '0.5rem' : '0' }}>
                        <ActivityIcon size={16} style={{ color: openOpps.length > 0 ? '#CA8A04' : '#9CA3AF' }} />
                        <span style={{ color: openOpps.length > 0 ? '#854D0E' : '#6B7280' }}>
                          {openOpps.length > 0 ? `${openOpps.length} Oportunidade(s) em Aberto` : 'Nenhuma oportunidade em aberto'}
                        </span>
                      </div>
                      {openOpps.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1.5rem' }}>
                          {openOpps.map(o => (
                            <div 
                              key={o.id} 
                              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={(e) => { e.stopPropagation(); setSelectedOppForSummary(o); }}
                            >
                              • <strong style={{ color: 'var(--primary-color)' }} className="hover:underline" title="Clique para ver o resumo">{o.name}</strong> - {o.status} ({o.responsible})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contacts */}
                  <div style={{ flex: '1 1 350px' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <User size={16} /> Contatos ({company.contacts.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {company.contacts.map(c => (
                        <div key={c.id} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span>{c.name || 'Sem nome'}</span>
                            <span className="badge" style={{ backgroundColor: c.profile === 'Sócio' ? '#E0E7FF' : '#F1F5F9', color: c.profile === 'Sócio' ? '#3730A3' : '#475569', fontSize: '0.65rem' }}>{c.profile}</span>
                          </div>
                          {c.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              <Mail size={12} style={{ flexShrink: 0 }} /> 
                              <a href={`mailto:${c.email}`} style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>{c.email}</a>
                            </div>
                          )}
                          {c.whatsapp && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <Phone size={12} style={{ flexShrink: 0 }} /> 
                              <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>{c.whatsapp}</a>
                            </div>
                          )}
                        </div>
                      ))}
                      {company.contacts.length === 0 && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhum contato cadastrado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {companies.length === 0 && (
            <div className="p-8 text-center text-muted" style={{ gridColumn: 'span 12' }}>
              Nenhum lead/empresa cadastrado no sistema.
            </div>
          )}
        </div>
      </div>



      {selectedOppForSummary && (
        <div className="modal-overlay" onClick={() => setSelectedOppForSummary(null)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Resumo da Oportunidade</h2>
              <button onClick={() => setSelectedOppForSummary(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <h3 
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                className="hover:underline"
                onClick={() => {
                  setSelectedOppForSummary(null);
                  if (onNavigateToPipeline) onNavigateToPipeline(selectedOppForSummary.id);
                }}
                title="Clique para editar no Pipeline"
              >
                {selectedOppForSummary.name} <ExternalLink size={16} />
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status Atual:</span>
                  <span style={{ fontWeight: 500 }}>{selectedOppForSummary.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Valor Estimado:</span>
                  <span style={{ fontWeight: 500, color: 'var(--success-color)' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOppForSummary.estimatedValue)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Responsável:</span>
                  <span style={{ fontWeight: 500 }}>{selectedOppForSummary.responsible}</span>
                </div>
                {selectedOppForSummary.expectedClosingDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Previsão de Fechamento:</span>
                    <span style={{ fontWeight: 500 }}>{new Date(selectedOppForSummary.expectedClosingDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                  </div>
                )}
                {selectedOppForSummary.nextFollowUp && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Próximo Follow-up:</span>
                    <span style={{ fontWeight: 500, color: '#4338CA' }}>{new Date(selectedOppForSummary.nextFollowUp).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              {selectedOppForSummary.lastFollowUpNotes && (
                <div style={{ marginTop: '1rem', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Últimas Notas:</div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{selectedOppForSummary.lastFollowUpNotes}</div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedOppForSummary(null);
                  if (onNavigateToPipeline) onNavigateToPipeline(selectedOppForSummary.id);
                }}
              >
                Abrir no Pipeline Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Leads;
