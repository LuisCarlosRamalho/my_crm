import React, { useState, useEffect } from 'react';
import { Plus, Edit2, UserPlus, Building2, Trash2 } from 'lucide-react';
import { getCompanies, saveCompany, deleteCompany, getCurrentUser } from '../store';
import type { Company, Contact, ContactProfile } from '../store';
import { v4 as uuidv4 } from 'uuid';

const Companies: React.FC = () => {
  const [companies, setLocalCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    getCompanies()
      .then(setLocalCompanies)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!formData.fantasyName) {
      alert('Por favor, preencha o Nome Fantasia da empresa.');
      return;
    }
    setSaving(true);
    const company: Company = {
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
      contacts,
      activities: formData.activities || [],
    };
    await saveCompany(company);
    const updated = formData.id
      ? companies.map(c => c.id === formData.id ? company : c)
      : [...companies, company];
    setLocalCompanies(updated);
    setShowModal(false);
    setFormData({});
    setContacts([]);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta empresa?')) return;
    await deleteCompany(id);
    setLocalCompanies(companies.filter(c => c.id !== id));
  };

  const openAdd = () => { setFormData({}); setContacts([]); setShowModal(true); };
  const openEdit = (c: Company) => { setFormData(c); setContacts(c.contacts); setShowModal(true); };
  const addContact = () => setContacts([...contacts, { id: uuidv4(), name: '', email: '', whatsapp: '', profile: 'Contato Operacional' }]);
  const updateContact = (id: string, field: keyof Contact, value: string) =>
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Empresas</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nova Empresa
        </button>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando empresas...</div>
        ) : (
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
                  {currentUser?.role === 'master' ? (
                    <>
                      <button className="text-muted hover:text-primary transition-colors" title="Editar" onClick={() => openEdit(c)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-danger hover:opacity-80 transition-opacity" title="Excluir" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted italic">Apenas Master</span>
                  )}
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="p-4 text-center text-muted">Nenhuma empresa cadastrada.</div>
            )}
          </div>
        )}
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
                <input value={formData.fantasyName || ''} onChange={e => setFormData({ ...formData, fantasyName: e.target.value })} placeholder="Ex: Tech Solutions" />
              </div>
              <div className="form-group">
                <label className="form-label">Razão Social</label>
                <input value={formData.corporateName || ''} onChange={e => setFormData({ ...formData, corporateName: e.target.value })} placeholder="Ex: Tech Solutions LTDA" />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">CNPJ</label>
                  <input value={formData.cnpj || ''} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Segmento</label>
                  <input value={formData.segment || ''} onChange={e => setFormData({ ...formData, segment: e.target.value })} placeholder="Ex: Tecnologia" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-[2]">
                  <label className="form-label">Site da Empresa</label>
                  <input value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.empresa.com.br" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Telefone</label>
                  <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 0000-0000" />
                </div>
              </div>

              <h3 className="font-medium mt-4 mb-2 border-b pb-1 text-muted">Localização</h3>
              <div className="flex gap-4">
                <div className="form-group flex-[2]">
                  <label className="form-label">Endereço</label>
                  <input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Av. Paulista, 1000 - Sala 42" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">CEP</label>
                  <input value={formData.zipCode || ''} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} placeholder="00000-000" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Bairro</label>
                  <input value={formData.neighborhood || ''} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} placeholder="Ex: Bela Vista" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Cidade / UF</label>
                  <input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="São Paulo / SP" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-4 border-b pb-1">
                  <h3 className="font-medium text-muted">Contatos</h3>
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
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Companies;
