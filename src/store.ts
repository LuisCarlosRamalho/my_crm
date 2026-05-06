// src/store.ts
// Integração completa com Supabase — substitui localStorage
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { supabase } from './lib/supabase';

// ============================================================
// TIPOS (mantidos idênticos ao original)
// ============================================================

export type ContactProfile = 'Sócio' | 'Influenciador' | 'Contato Operacional';
export type ActivityType = 'Telefone' | 'WhatsApp' | 'E-mail' | 'Visita' | 'Reunião' | 'Vídeochamada' | string;
export type OpportunityStatus = string;

export interface StageConfig {
  name: string;
  colorTheme: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  profile: ContactProfile;
}

export interface Activity {
  id: string;
  type: ActivityType;
  notes: string;
  date: string;
  opportunityId?: string;
  author?: string;
}

export interface Company {
  id: string;
  fantasyName: string;
  corporateName: string;
  cnpj: string;
  segment: string;
  website?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  zipCode?: string;
  phone?: string;
  contacts: Contact[];
  activities: Activity[];
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

export interface Opportunity {
  id: string;
  companyId: string;
  name: string;
  estimatedValue: number;
  expectedClosingDate: string;
  responsible: string;
  status: OpportunityStatus;
  tasks: Task[];
  nextFollowUp?: string;
  lastFollowUpNotes?: string;
  isLost?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ultra_admin' | 'master' | 'user';
  phone?: string;
  roleTitle?: string;
  companyName?: string;
}

export interface SystemLog {
  id: string;
  created_at: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}

// ============================================================
// AUTH LOCAL (mantém sessão em localStorage - sem dados sensíveis)
// ============================================================

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem('crm_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('crm_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('crm_current_user');
  }
};

// ============================================================
// USUÁRIOS
// ============================================================

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    phone: row.phone,
    roleTitle: row.role_title,
    companyName: row.company_name,
  }));
};

export const saveUsers = async (users: User[]): Promise<void> => {
  for (const user of users) {
    const row = {
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      phone: user.phone || null,
      role_title: user.roleTitle || null,
      company_name: user.companyName || null,
    };
    const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
    if (error) console.error('Erro ao salvar usuário:', error);
    else await logAction('UPDATE/CREATE', 'USER', user.id, `Usuário salvo: ${user.name} (${user.role})`);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) console.error('Erro ao deletar usuário:', error);
  else await logAction('DELETE', 'USER', id, `Usuário deletado`);
};

export const ensureMasterUser = async (): Promise<void> => {
  const { data } = await supabase.from('users').select('id').eq('role', 'master').maybeSingle();
  if (!data) {
    const masterUser = {
      id: 'master-user-1',
      name: 'Luis Carlos',
      email: 'luiscarlos@crm.com.br',
      password_hash: CryptoJS.SHA256('Stratovarius@088').toString(),
      role: 'master',
      phone: null,
      role_title: null,
      company_name: null,
    };
    const { error } = await supabase.from('users').insert(masterUser);
    if (error) console.error('Erro ao criar usuário master:', error);
  }
};

// ============================================================
// EMPRESAS
// ============================================================

export const getCompanies = async (): Promise<Company[]> => {
  const { data: companiesData, error: compError } = await supabase
    .from('companies')
    .select('*')
    .order('fantasy_name');

  if (compError) {
    console.error('Erro ao buscar empresas:', compError);
    return [];
  }

  const { data: contactsData } = await supabase.from('contacts').select('*');
  const { data: activitiesData } = await supabase.from('activities').select('*');

  return (companiesData || []).map(c => ({
    id: c.id,
    fantasyName: c.fantasy_name,
    corporateName: c.corporate_name || '',
    cnpj: c.cnpj || '',
    segment: c.segment || '',
    website: c.website || '',
    address: c.address || '',
    city: c.city || '',
    neighborhood: c.neighborhood || '',
    zipCode: c.zip_code || '',
    phone: c.phone || '',
    contacts: (contactsData || [])
      .filter(ct => ct.company_id === c.id)
      .map(ct => ({
        id: ct.id,
        name: ct.name,
        email: ct.email || '',
        whatsapp: ct.whatsapp || '',
        profile: ct.profile as ContactProfile,
      })),
    activities: (activitiesData || [])
      .filter(a => a.company_id === c.id)
      .map(a => ({
        id: a.id,
        type: a.type,
        notes: a.notes || '',
        date: a.date,
        opportunityId: a.opportunity_id || undefined,
        author: a.author || undefined,
      })),
  }));
};

export const saveCompany = async (company: Company): Promise<void> => {
  const row = {
    id: company.id,
    fantasy_name: company.fantasyName,
    corporate_name: company.corporateName,
    cnpj: company.cnpj,
    segment: company.segment,
    website: company.website || null,
    address: company.address || null,
    city: company.city || null,
    neighborhood: company.neighborhood || null,
    zip_code: company.zipCode || null,
    phone: company.phone || null,
  };

  const { error } = await supabase.from('companies').upsert(row, { onConflict: 'id' });
  if (error) { console.error('Erro ao salvar empresa:', error); return; }

  await logAction('UPDATE/CREATE', 'COMPANY', company.id, `Empresa salva: ${company.fantasyName}`);

  // Sincronizar contatos
  await supabase.from('contacts').delete().eq('company_id', company.id);
  if (company.contacts.length > 0) {
    const contactRows = company.contacts.map(ct => ({
      id: ct.id,
      company_id: company.id,
      name: ct.name,
      email: ct.email || null,
      whatsapp: ct.whatsapp || null,
      profile: ct.profile,
    }));
    const { error: ctErr } = await supabase.from('contacts').insert(contactRows);
    if (ctErr) console.error('Erro ao salvar contatos:', ctErr);
  }

  // Sincronizar atividades
  await supabase.from('activities').delete().eq('company_id', company.id);
  if (company.activities.length > 0) {
    const actRows = company.activities.map(a => ({
      id: a.id,
      company_id: company.id,
      opportunity_id: a.opportunityId || null,
      type: a.type,
      notes: a.notes || null,
      date: a.date,
      author: a.author || null,
    }));
    const { error: actErr } = await supabase.from('activities').insert(actRows);
    if (actErr) console.error('Erro ao salvar atividades:', actErr);
  }
};

export const saveCompanies = async (companies: Company[]): Promise<void> => {
  for (const company of companies) {
    await saveCompany(company);
  }
};

export const deleteCompany = async (id: string): Promise<void> => {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) console.error('Erro ao deletar empresa:', error);
  else await logAction('DELETE', 'COMPANY', id, `Empresa deletada`);
};

// ============================================================
// OPORTUNIDADES
// ============================================================

export const getOpportunities = async (): Promise<Opportunity[]> => {
  const { data: oppsData, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar oportunidades:', error);
    return [];
  }

  const { data: tasksData } = await supabase.from('tasks').select('*');

  return (oppsData || []).map(o => ({
    id: o.id,
    companyId: o.company_id || '',
    name: o.name,
    estimatedValue: Number(o.estimated_value) || 0,
    expectedClosingDate: o.expected_closing_date || '',
    responsible: o.responsible || '',
    status: o.status,
    isLost: o.is_lost || false,
    nextFollowUp: o.next_follow_up || undefined,
    lastFollowUpNotes: o.last_follow_up_notes || undefined,
    tasks: (tasksData || [])
      .filter(t => t.opportunity_id === o.id)
      .map(t => ({
        id: t.id,
        description: t.description,
        completed: t.completed,
      })),
  }));
};

export const saveOpportunity = async (opp: Opportunity): Promise<void> => {
  const row = {
    id: opp.id,
    company_id: opp.companyId || null,
    name: opp.name,
    estimated_value: opp.estimatedValue,
    expected_closing_date: opp.expectedClosingDate || null,
    responsible: opp.responsible || null,
    status: opp.status,
    is_lost: opp.isLost || false,
    next_follow_up: opp.nextFollowUp || null,
    last_follow_up_notes: opp.lastFollowUpNotes || null,
  };

  const { error } = await supabase.from('opportunities').upsert(row, { onConflict: 'id' });
  if (error) { console.error('Erro ao salvar oportunidade:', error); return; }

  await logAction('UPDATE/CREATE', 'OPPORTUNITY', opp.id, `Oportunidade salva: ${opp.name} (Status: ${opp.status})`);

  // Sincronizar tarefas
  await supabase.from('tasks').delete().eq('opportunity_id', opp.id);
  if (opp.tasks.length > 0) {
    const taskRows = opp.tasks.map(t => ({
      id: t.id,
      opportunity_id: opp.id,
      description: t.description,
      completed: t.completed,
    }));
    const { error: tErr } = await supabase.from('tasks').insert(taskRows);
    if (tErr) console.error('Erro ao salvar tarefas:', tErr);
  }
};

export const saveOpportunities = async (opps: Opportunity[]): Promise<void> => {
  for (const opp of opps) {
    await saveOpportunity(opp);
  }
};

export const deleteOpportunity = async (id: string): Promise<void> => {
  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  if (error) console.error('Erro ao deletar oportunidade:', error);
  else await logAction('DELETE', 'OPPORTUNITY', id, `Oportunidade deletada`);
};

// ============================================================
// ESTÁGIOS DO PIPELINE
// ============================================================

const defaultStages: StageConfig[] = [
  { name: 'Prospecção',  colorTheme: 0 },
  { name: 'Diagnóstico', colorTheme: 1 },
  { name: 'Proposta',    colorTheme: 2 },
  { name: 'Negociação',  colorTheme: 3 },
  { name: 'Fechamento',  colorTheme: 4 },
];

export const getStageConfigs = async (): Promise<StageConfig[]> => {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .order('position');

  if (error || !data || data.length === 0) {
    console.error('Erro ao buscar estágios, usando padrão:', error);
    return defaultStages;
  }

  return data.map(s => ({
    name: s.name,
    colorTheme: s.color_theme,
  }));
};

export const saveStageConfigs = async (configs: StageConfig[]): Promise<void> => {
  // Deletar todos e reinserir na nova ordem
  await supabase.from('stages').delete().neq('id', 0); // deleta todos
  const rows = configs.map((c, index) => ({
    name: c.name,
    color_theme: c.colorTheme,
    position: index,
  }));
  const { error } = await supabase.from('stages').insert(rows);
  if (error) console.error('Erro ao salvar estágios:', error);
};

export const getStages = async (): Promise<string[]> => {
  const configs = await getStageConfigs();
  return configs.map(c => c.name);
};

export const saveStages = async (stages: string[]): Promise<void> => {
  const currentConfigs = await getStageConfigs();
  const newConfigs = stages.map((name, index) => {
    const existing = currentConfigs.find(c => c.name === name);
    return existing || { name, colorTheme: index % 7 };
  });
  await saveStageConfigs(newConfigs);
  await logAction('UPDATE', 'PIPELINE_STAGES', 'all', `Estágios do funil atualizados`);
};

// ============================================================
// LOGS DE SISTEMA
// ============================================================

export const getLogs = async (): Promise<SystemLog[]> => {
  const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar logs:', error);
    return [];
  }
  return data || [];
};

export const logAction = async (action: string, entity_type: string, entity_id: string, details: string): Promise<void> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const row = {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    user_name: currentUser.name,
    action,
    entity_type,
    entity_id,
    details
  };
  const { error } = await supabase.from('logs').insert([row]);
  if (error) console.error('Erro ao salvar log:', error);
};

// ============================================================
// EXPORTAR uuidv4 para uso nos componentes
// ============================================================
export { uuidv4 };

