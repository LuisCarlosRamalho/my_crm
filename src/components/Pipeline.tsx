import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Calendar, User, DollarSign } from 'lucide-react';
import {
  getOpportunities, saveOpportunity, deleteOpportunity,
  getCompanies, getStageConfigs, saveStageConfigs, getCurrentUser
} from '../store';
import type { Opportunity, OpportunityStatus, Company, StageConfig } from '../store';
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

interface PipelineProps {
  initialEditOppId?: string | null;
  onClearEdit?: () => void;
}

const Pipeline: React.FC<PipelineProps> = ({ initialEditOppId, onClearEdit }) => {
  const [columns, setColumns] = useState<StageConfig[]>([]);
  const [opportunities, setLocalOpportunities] = useState<Opportunity[]>([]);
  const [companies, setLocalCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(0);
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [companySearch, setCompanySearch] = useState('');

  const currentUser = getCurrentUser();
  const isMaster = currentUser?.role === 'master';

  useEffect(() => {
    Promise.all([getStageConfigs(), getOpportunities(), getCompanies()])
      .then(([cols, opps, comps]) => {
        setColumns(cols);
        setLocalOpportunities(opps);
        setLocalCompanies(comps);
        if (initialEditOppId) {
          const oppToEdit = opps.find(o => o.id === initialEditOppId);
          if (oppToEdit) {
            setFormData(oppToEdit);
            setCompanySearch(comps.find(c => c.id === oppToEdit.companyId)?.fantasyName || '');
            setShowModal(true);
          }
          if (onClearEdit) onClearEdit();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'COLUMN') {
      if (source.index === destination.index) return;
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      await saveStageConfigs(newColumns);
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const itemCopied = opportunities.find(o => o.id === result.draggableId);
    if (!itemCopied) return;

    const destStatus = destination.droppableId as OpportunityStatus;
    const sourceStatus = source.droppableId as OpportunityStatus;
    const destIndex = columns.findIndex(c => c.name === destStatus);
    const sourceIndex = columns.findIndex(c => c.name === sourceStatus);

    if (destIndex > sourceIndex) {
      const company = companies.find(c => c.id === itemCopied.companyId);
      const hasValidContact = company?.contacts.some(c => c.profile === 'Sócio' || c.profile === 'Influenciador');
      if (!hasValidContact) {
        alert('Não é possível avançar a oportunidade. A empresa vinculada precisa de pelo menos um Sócio ou Influenciador cadastrado.');
        return;
      }
    }

    const updated = { ...itemCopied, status: destStatus };
    setLocalOpportunities(opportunities.map(o => o.id === updated.id ? updated : o));
    await saveOpportunity(updated);
  };

  const openAdd = () => {
    setFormData({ status: columns.length > 0 ? columns[0].name : 'Prospecção', expectedClosingDate: new Date().toISOString().split('T')[0] });
    setCompanySearch('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.companyId || !formData.estimatedValue) {
      alert('Por favor, preencha o Nome da Oportunidade, selecione uma Empresa válida e informe o Valor Estimado.');
      return;
    }
    setSaving(true);
    const opp: Opportunity = {
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
      isLost: formData.isLost || false,
    };
    await saveOpportunity(opp);
    const updated = formData.id
      ? opportunities.map(o => o.id === formData.id ? opp : o)
      : [...opportunities, opp];
    setLocalOpportunities(updated);
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade permanentemente?')) return;
    await deleteOpportunity(formData.id);
    setLocalOpportunities(opportunities.filter(o => o.id !== formData.id));
    setShowModal(false);
  };

  const handleSaveStage = async () => {
    if (!newStageName.trim()) { alert('Por favor, informe o nome da etapa.'); return; }
    const newConfig: StageConfig = { name: newStageName.trim(), colorTheme: newStageColor };
    const newColumns = [...columns, newConfig];
    setColumns(newColumns);
    await saveStageConfigs(newColumns);
    setShowStageModal(false);
  };

  const getCompany = (id: string) => companies.find(c => c.id === id);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Pipeline de Vendas</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nova Oportunidade
        </button>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando pipeline...</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
                    {columns.map((columnConfig, index) => {
                      const column = columnConfig.name;
                      const colorTheme = COLUMN_COLORS[columnConfig.colorTheme % COLUMN_COLORS.length];
                      return (
                        <Draggable key={column} draggableId={column} index={index}>
                          {(provided) => (
                            <div
                              className="kanban-column"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ backgroundColor: colorTheme.bg, borderTop: `3px solid ${colorTheme.border}`, ...provided.draggableProps.style }}
                            >
                              <div className="kanban-column-header" {...provided.dragHandleProps} style={{ cursor: 'grab' }}>
                                <div className="kanban-column-title" style={{ color: colorTheme.text }}>
                                  {column}
                                  <span className="badge">{opportunities.filter(o => !o.isLost && o.status === column).length}</span>
                                </div>
                              </div>

                              <Droppable droppableId={column} type="CARD">
                                {(provided, snapshot) => (
                                  <div
                                    className="kanban-cards"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{ backgroundColor: snapshot.isDraggingOver ? 'rgba(79, 70, 229, 0.05)' : '' }}
                                  >
                                    {opportunities.filter(o => !o.isLost && o.status === column).map((opp, index) => (
                                      <Draggable key={opp.id} draggableId={opp.id} index={index} isDragDisabled={!isMaster}>
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
                                            <div className="card-company">{getCompany(opp.companyId)?.fantasyName || 'Empresa Desconhecida'}</div>
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
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {isMaster && (
                <div
                  className="kanban-column"
                  style={{ background: 'transparent', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => { setNewStageName(''); setNewStageColor(0); setShowStageModal(true); }}
                >
                  <div className="flex items-center gap-2 text-muted font-medium p-4">
                    <Plus size={20} /> Nova Etapa
                  </div>
                </div>
              )}
            </div>
          </DragDropContext>
        )}
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
                <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input
                  list="companies-list"
                  value={companySearch}
                  onChange={e => {
                    setCompanySearch(e.target.value);
                    const found = companies.find(c => c.fantasyName === e.target.value);
                    setFormData({ ...formData, companyId: found ? found.id : '' });
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
                  <input type="number" value={formData.estimatedValue || ''} onChange={e => setFormData({ ...formData, estimatedValue: Number(e.target.value) })} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Data de Fechamento Prevista</label>
                  <input type="date" value={formData.expectedClosingDate || ''} onChange={e => setFormData({ ...formData, expectedClosingDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Responsável</label>
                  <input
                    list="responsibles-list"
                    value={formData.responsible || ''}
                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
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
                  <select value={formData.status || (columns.length > 0 ? columns[0].name : '')} onChange={e => setFormData({ ...formData, status: e.target.value as OpportunityStatus })}>
                    {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Próximo Follow-up</label>
                <input type="datetime-local" value={formData.nextFollowUp || ''} onChange={e => setFormData({ ...formData, nextFollowUp: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Resumo do Último Follow-up</label>
                <textarea rows={3} value={formData.lastFollowUpNotes || ''} onChange={e => setFormData({ ...formData, lastFollowUpNotes: e.target.value })} placeholder="Ex: Cliente pediu para retornar semana que vem..." />
              </div>
              <div className="form-group flex items-center gap-2 mt-4 p-3 rounded" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <input
                  type="checkbox"
                  id="isLost"
                  checked={formData.isLost || false}
                  onChange={e => setFormData({ ...formData, isLost: e.target.checked })}
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                  disabled={!!formData.id && !isMaster}
                />
                <label htmlFor="isLost" className="form-label mb-0" style={{ color: '#B91C1C', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                  Marcar Oportunidade como Perdida
                </label>
              </div>
              {!!formData.id && !isMaster && <p className="text-xs text-muted italic mt-2">Apenas usuários Master podem editar os dados da oportunidade.</p>}
            </div>
            <div className="modal-footer" style={{ justifyContent: formData.id ? 'space-between' : 'flex-end' }}>
              {formData.id && isMaster && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>Excluir</button>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                {(!formData.id || isMaster) && (
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Oportunidade'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStageModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Etapa</h2>
              <button onClick={() => setShowStageModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome da Etapa</label>
                <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Ex: Qualificação" />
              </div>
              <div className="form-group">
                <label className="form-label">Cor da Etapa</label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLUMN_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewStageColor(idx)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: color.bg,
                        border: `2px solid ${newStageColor === idx ? color.border : 'transparent'}`,
                        boxShadow: newStageColor === idx ? '0 0 0 2px var(--surface-color), 0 0 0 4px var(--primary-color)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                      }}
                    >
                      <div style={{ width: '60%', height: '60%', borderRadius: '50%', backgroundColor: color.border }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStageModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveStage}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pipeline;
