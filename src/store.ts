import { v4 as uuidv4 } from 'uuid';
// Force Vite HMR reload

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
  estimatedValue: number; // Pode representar LTV ou MRR
  expectedClosingDate: string;
  responsible: string;
  status: OpportunityStatus;
  tasks: Task[];
  nextFollowUp?: string;
  lastFollowUpNotes?: string;
  isLost?: boolean;
}

// Initial Data
const initialCompanies: Company[] = [];
const initialOpportunities: Opportunity[] = [];

// Local Storage Keys
const COMPANIES_KEY = 'crm_companies';
const OPPS_KEY = 'crm_opportunities';

export const getCompanies = (): Company[] => {
  const data = localStorage.getItem(COMPANIES_KEY);
  return data ? JSON.parse(data) : initialCompanies;
};

export const saveCompanies = (companies: Company[]) => {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
};

export const getOpportunities = (): Opportunity[] => {
  const data = localStorage.getItem(OPPS_KEY);
  return data ? JSON.parse(data) : initialOpportunities;
};

export const saveOpportunities = (opps: Opportunity[]) => {
  localStorage.setItem(OPPS_KEY, JSON.stringify(opps));
};

const STAGES_KEY = 'crm_stages';
const STAGES_CONFIG_KEY = 'crm_stages_config';

const defaultStages = ['Prospecção', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechamento'];

export const getStageConfigs = (): StageConfig[] => {
  const configData = localStorage.getItem(STAGES_CONFIG_KEY);
  if (configData) {
    return JSON.parse(configData);
  }
  
  // Fallback to old stages
  const oldData = localStorage.getItem(STAGES_KEY);
  const stages = oldData ? JSON.parse(oldData) : defaultStages;
  
  return stages.map((name: string, index: number) => ({
    name,
    colorTheme: index % 7 // Assuming 7 colors available
  }));
};

export const saveStageConfigs = (configs: StageConfig[]) => {
  localStorage.setItem(STAGES_CONFIG_KEY, JSON.stringify(configs));
  // Keep old key in sync just in case
  localStorage.setItem(STAGES_KEY, JSON.stringify(configs.map(c => c.name)));
};

export const getStages = (): string[] => {
  return getStageConfigs().map(c => c.name);
};

export const saveStages = (stages: string[]) => {
  const currentConfigs = getStageConfigs();
  const newConfigs = stages.map((name, index) => {
    const existing = currentConfigs.find(c => c.name === name);
    return existing || { name, colorTheme: index % 7 };
  });
  saveStageConfigs(newConfigs);
};

// Auth and Users
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'master' | 'user';
  phone?: string;
  roleTitle?: string;
  companyName?: string;
}

export const getUsers = (): User[] => {
  const users = localStorage.getItem('crm_users');
  if (users) return JSON.parse(users);
  
  const masterUser: User = {
    id: 'master-user-1',
    name: 'Luis Carlos',
    email: 'luiscarlos@crm.com.br',
    passwordHash: btoa('Stratovarius@088'),
    role: 'master'
  };
  localStorage.setItem('crm_users', JSON.stringify([masterUser]));
  return [masterUser];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('crm_users', JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('crm_current_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('crm_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('crm_current_user');
  }
};

