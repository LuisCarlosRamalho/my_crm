import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
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

// Encryption configuration
const SECRET_KEY = 'crm_b2b_secret_key_2026'; // Em uma aplicação real, viria de variáveis de ambiente

const encryptData = (data: any) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (ciphertext: string | null) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.error("Erro ao descriptografar os dados:", error);
    // Tenta fazer o parse diretamente para não quebrar dados antigos que não estavam criptografados
    try {
      return JSON.parse(ciphertext);
    } catch {
      return null;
    }
  }
};

// Initial Data
const initialCompanies: Company[] = [];
const initialOpportunities: Opportunity[] = [];

// Local Storage Keys
const COMPANIES_KEY = 'crm_companies';
const OPPS_KEY = 'crm_opportunities';

export const getCompanies = (): Company[] => {
  const data = localStorage.getItem(COMPANIES_KEY);
  return decryptData(data) || initialCompanies;
};

export const saveCompanies = (companies: Company[]) => {
  localStorage.setItem(COMPANIES_KEY, encryptData(companies));
};

export const getOpportunities = (): Opportunity[] => {
  const data = localStorage.getItem(OPPS_KEY);
  return decryptData(data) || initialOpportunities;
};

export const saveOpportunities = (opps: Opportunity[]) => {
  localStorage.setItem(OPPS_KEY, encryptData(opps));
};

const STAGES_KEY = 'crm_stages';
const STAGES_CONFIG_KEY = 'crm_stages_config';

const defaultStages = ['Prospecção', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechamento'];

export const getStageConfigs = (): StageConfig[] => {
  const configData = localStorage.getItem(STAGES_CONFIG_KEY);
  if (configData) {
    return decryptData(configData) || [];
  }
  
  // Fallback to old stages
  const oldData = localStorage.getItem(STAGES_KEY);
  const stages = oldData ? (decryptData(oldData) || defaultStages) : defaultStages;
  
  return stages.map((name: string, index: number) => ({
    name,
    colorTheme: index % 7 // Assuming 7 colors available
  }));
};

export const saveStageConfigs = (configs: StageConfig[]) => {
  localStorage.setItem(STAGES_CONFIG_KEY, encryptData(configs));
  // Keep old key in sync just in case
  localStorage.setItem(STAGES_KEY, encryptData(configs.map(c => c.name)));
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
  const usersStr = localStorage.getItem('crm_users');
  const users = decryptData(usersStr);
  if (users) return users;
  
  // Usando CryptoJS.SHA256 para o hash da senha master
  const masterUser: User = {
    id: 'master-user-1',
    name: 'Luis Carlos',
    email: 'luiscarlos@crm.com.br',
    passwordHash: CryptoJS.SHA256('Stratovarius@088').toString(),
    role: 'master'
  };
  localStorage.setItem('crm_users', encryptData([masterUser]));
  return [masterUser];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('crm_users', encryptData(users));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('crm_current_user');
  return decryptData(userStr);
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('crm_current_user', encryptData(user));
  } else {
    localStorage.removeItem('crm_current_user');
  }
};

