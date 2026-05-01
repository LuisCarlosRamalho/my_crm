import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Calendar, User, DollarSign, MessageCircle } from 'lucide-react';
import { getOpportunities, saveOpportunities, getCompanies, getStages, saveStages } from '../store';
import type { Opportunity, OpportunityStatus, Company } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const COLUMN_COLORS = [
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' },
  { bg: '#FAF5FF', border: '#A855F7', text: '#7E22CE' },
  { bg: '#FEFCE8', border: '#EAB308', text: '#A16207' },
  { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
  { bg: '#F0FDF4', border: '#22C55E', text: '#15803D' },
  { bg: '#FDF2F8', border: '#EC4899', text: '#BE185D' },
  { bg: '#F0F9FF', border: '#0EA5E9', text: '#0369A1' },
];

const Pipeline: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [opportunities, setLocalOpportunities] = useState<Opportunity[]>([]);
  const [companies, setLocalCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [companySearch, setCompanySearch] = useState('');

  useEffect(() => {
    setColumns(getStages());
    setLocalOpportunities(getOpportunities());
    setLocalCompanies(getCompanies());
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const itemCopied = opportunities.find(o => o.id === result.draggableId);
    if (!itemCopied) return;

    // Regra de Negócio: Impedir avanço sem Sócio ou Influenciador
    const destStatus = destination.droppableId as OpportunityStatus;
    const sourceStatus = source.droppableId as OpportunityStatus;
    
    if (columns.indexOf(destStatus) > columns.indexOf(sourceStatus)) {
      const company = companies.find(c => c.id === itemCopied.companyId);
      const hasValidContact = company?.contacts.some(c => c.profile === 'Sócio' || c.profile === 'Influenciador');
      
      if (!hasValidContact) {
        alert('Não é possível avançar a oportunidade. A empresa vinculada precisa de pelo menos um Sócio ou Influenciador cadastrado.');
        return;
      }
    }

    const updatedOpps = opportunities.map(o => 
      o.id === itemCopied.id ? { ...o, status: destStatus } : o
    );

    setLocalOpportunities(updatedOpps);
    saveOpportunities(updatedOpps);
  };

  const openAdd = () => {
    setFormData({ status: columns[0] || 'Prospecção', expectedClosingDate: new Date().toISOString().split('T')[0] });
    setCompanySearch('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.companyId || !formData.estimatedValue) {
      alert('Por favor, preencha o Nome da Oportunidade, selecione uma Empresa válida da lista e informe o Valor Estimado.');
      return;
    }

    const newOpp: Opportunity = {
      id: formData.id || uuidv4(),
      companyId: formData.companyId,
      name: formData.name,
      estimatedValue: Number(formData.estimatedValue),
      expectedClosingDate: formData.expectedClosingDate || '',
      responsible: formData.responsible || 'Usuário Atual',
      status: formData.status as OpportunityStatus,
      tasks: formData.tasks || [],
      nextFollowUp: formData.nextFollowUp,
      lastFollowUpNotes: formData.lastFollowUpNotes,
      isLost: formData.isLost || false
    };

    const updated = formData.id 
      ? opportunities.map(o => o.id === formData.id ? newOpp : o)
      : [...opportunities, newOpp];

    setLocalOpportunities(updated);
    saveOpportunities(updated);
    setShowModal(false);
  };

  const getCompany = (id: string) => companies.find(c => c.id === id);

  const handleAddColumn = () => {
    const name = window.prompt('Nome da nova etapa:');
    if (name && name.trim()) {
      const newColumns = [...columns, name.trim()];
      setColumns(newColumns);
      saveStages(newColumns);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Pipeline de Vendas</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nova Oportunidade
        </button>
      </header>

      <div className="page-body">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {columns.map((column, colIndex) => {
              const colorTheme = COLUMN_COLORS[colIndex % COLUMN_COLORS.length];
              return (
              <div className="kanban-column" key={column} style={{ backgroundColor: colorTheme.bg, borderTop: `3px solid ${colorTheme.border}` }}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title" style={{ color: colorTheme.text }}>
                    {column}
                    <span className="badge">{opportunities.filter(o => !o.isLost && o.status === column).length}</span>
                  </div>
                </div>
                
                <Droppable droppableId={column}>
                  {(provided, snapshot) => (
                    <div
                      className="kanban-cards"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ backgroundColor: snapshot.isDraggingOver ? 'rgba(79, 70, 229, 0.05)' : '' }}
                    >
                      {opportunities.filter(o => !o.isLost && o.status === column).map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`kanban-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => { 
                                setFormData(opp); 
                                setCompanySearch(getCompany(opp.companyId)?.fantasyName || '');
                                setShowModal(true); 
                              }}
                            >
                              <div className="card-title">{opp.name}</div>
                              <div className="card-company">
                                {getCompany(opp.companyId)?.fantasyName || 'Empresa Desconhecida'}
                              </div>
                              {opp.nextFollowUp && (
                                <div className="card-followup">
                                  <Calendar size={12} /> Próx: {format(new Date(opp.nextFollowUp), 'dd/MM/yyyy')}
                                </div>
                              )}
                              {opp.lastFollowUpNotes && (
                                <div className="card-last-notes">
                                  <strong>Último:</strong> {opp.lastFollowUpNotes.length > 60 ? opp.lastFollowUpNotes.substring(0, 60) + '...' : opp.lastFollowUpNotes}
                                </div>
                              )}
                              <div className="card-footer">
                                <div className="flex items-center gap-1 text-muted">
                                  <User size={14} /> {opp.responsible}
                                </div>
                                <div className="card-value">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.estimatedValue)}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              );
            })}
            <div className="kanban-column" style={{ background: 'transparent', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleAddColumn}>
              <div className="flex items-center gap-2 text-muted font-medium p-4">
                <Plus size={20} /> Nova Etapa
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{formData.id ? 'Detalhes da Oportunidade' : 'Nova Oportunidade'}</h2>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome da Oportunidade</label>
                <input 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input 
                  list="companies-list"
                  value={companySearch}
                  onChange={e => {
                    setCompanySearch(e.target.value);
                    const found = companies.find(c => c.fantasyName === e.target.value);
                    if (found) {
                      setFormData({...formData, companyId: found.id});
                    } else {
                      setFormData({...formData, companyId: ''});
                    }
                  }}
                  placeholder="Digite para buscar a empresa..."
                />
                <datalist id="companies-list">
                  {companies.map(c => <option key={c.id} value={c.fantasyName} />)}
                </datalist>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Valor Estimado (LTV/MRR)</label>
                  <input 
                    type="number"
                    value={formData.estimatedValue || ''} 
                    onChange={e => setFormData({...formData, estimatedValue: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Data de Fechamento Prevista</label>
                  <input 
                    type="date"
                    value={formData.expectedClosingDate || ''} 
                    onChange={e => setFormData({...formData, expectedClosingDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Responsável</label>
                  <input 
                    list="responsibles-list"
                    value={formData.responsible || ''} 
                    onChange={e => setFormData({...formData, responsible: e.target.value})} 
                    placeholder="Ex: Michel"
                  />
                  <datalist id="responsibles-list">
                    {Array.from(new Set(opportunities.map(o => o.responsible).filter(Boolean))).map(r => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Status</label>
                  <select 
                    value={formData.status || columns[0]} 
                    onChange={e => setFormData({...formData, status: e.target.value as OpportunityStatus})}
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Próximo Follow-up</label>
                <input 
                  type="datetime-local"
                  value={formData.nextFollowUp || ''} 
                  onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} 
                />
                <small className="text-muted block mt-1">Ao definir o follow-up, o histórico da empresa será atualizado automaticamente se houver notas em uma futura atualização.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Resumo do Último Follow-up</label>
                <textarea 
                  rows={3}
                  value={formData.lastFollowUpNotes || ''} 
                  onChange={e => setFormData({...formData, lastFollowUpNotes: e.target.value})} 
                  placeholder="Ex: Cliente pediu para retornar semana que vem com a proposta comercial revisada..."
                />
              </div>
              <div className="form-group flex items-center gap-2 mt-4 p-3 rounded" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <input 
                  type="checkbox" 
                  id="isLost"
                  checked={formData.isLost || false} 
                  onChange={e => setFormData({...formData, isLost: e.target.checked})} 
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                <label htmlFor="isLost" className="form-label mb-0" style={{ color: '#B91C1C', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                  Marcar Oportunidade como Perdida
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Salvar Oportunidade</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pipeline;
