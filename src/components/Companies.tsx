import React, { useState, useEffect } from 'react';
import { Plus, Edit2, UserPlus, Phone, Mail, Building2, Eye } from 'lucide-react';
import { getCompanies, saveCompanies } from '../store';
import type { Company, Contact, ContactProfile } from '../store';
import { v4 as uuidv4 } from 'uuid';

const Companies: React.FC = () => {
  const [companies, setLocalCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    setLocalCompanies(getCompanies());
  }, []);

  const handleSave = () => {
    if (!formData.fantasyName) {
      alert("Por favor, preencha o Nome Fantasia da empresa.");
      return;
    }
    
    const newCompany: Company = {
      id: formData.id || uuidv4(),
      fantasyName: formData.fantasyName,
      corporateName: formData.corporateName || '',
      cnpj: formData.cnpj || '',
      segment: formData.segment || '',
      contacts: contacts,
      activities: formData.activities || []
    };

    let updated;
    if (formData.id) {
      updated = companies.map(c => c.id === formData.id ? newCompany : c);
    } else {
      updated = [...companies, newCompany];
    }

    setLocalCompanies(updated);
    saveCompanies(updated);
    setShowModal(false);
    setFormData({});
    setContacts([]);
  };

  const openAdd = () => {
    setFormData({});
    setContacts([]);
    setShowModal(true);
  };

  const openEdit = (c: Company) => {
    setFormData(c);
    setContacts(c.contacts);
    setShowModal(true);
  };

  const addContact = () => {
    setContacts([...contacts, { id: uuidv4(), name: '', email: '', whatsapp: '', profile: 'Contato Operacional' }]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Empresas</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nova Empresa
        </button>
      </header>
      
      <div className="page-body">
        <div className="list-container">
          <div className="list-header">
            <div>Nome Fantasia</div>
            <div>CNPJ</div>
            <div>Segmento</div>
            <div>Ações</div>
          </div>
          {companies.map(c => (
            <div className="list-row" key={c.id}>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted" />
                <span className="font-medium">{c.fantasyName}</span>
              </div>
              <div className="text-muted">{c.cnpj}</div>
              <div>{c.segment}</div>
              <div className="flex gap-2">
                <button className="text-muted" onClick={() => openEdit(c)}><Edit2 size={16} /></button>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="p-4 text-center text-muted">Nenhuma empresa cadastrada.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{formData.id ? 'Editar Empresa' : 'Nova Empresa'}</h2>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome Fantasia</label>
                <input 
                  value={formData.fantasyName || ''} 
                  onChange={e => setFormData({...formData, fantasyName: e.target.value})} 
                  placeholder="Ex: Tech Solutions"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Razão Social</label>
                <input 
                  value={formData.corporateName || ''} 
                  onChange={e => setFormData({...formData, corporateName: e.target.value})} 
                  placeholder="Ex: Tech Solutions LTDA"
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">CNPJ</label>
                  <input 
                    value={formData.cnpj || ''} 
                    onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Segmento</label>
                  <input 
                    value={formData.segment || ''} 
                    onChange={e => setFormData({...formData, segment: e.target.value})} 
                    placeholder="Ex: Tecnologia"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Contatos</h3>
                  <button className="btn btn-secondary btn-sm" onClick={addContact}>
                    <UserPlus size={14} /> Adicionar Contato
                  </button>
                </div>
                
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="p-4 border border-color rounded-md mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm">Contato {index + 1}</span>
                      <button className="text-danger" onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}>&times;</button>
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
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Salvar Empresa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Companies;
