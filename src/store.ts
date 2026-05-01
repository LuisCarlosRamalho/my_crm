import { v4 as uuidv4 } from 'uuid';

export type ContactProfile = 'Sócio' | 'Influenciador' | 'Contato Operacional';
export type ActivityType = 'WhatsApp' | 'E-mail' | 'Ligação' | 'Reunião Presencial';
export type OpportunityStatus = string;

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
}

export interface Company {
  id: string;
  fantasyName: string;
  corporateName: string;
  cnpj: string;
  segment: string;
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
const defaultStages = ['Prospecção', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechamento'];

export const getStages = (): string[] => {
  const data = localStorage.getItem(STAGES_KEY);
  return data ? JSON.parse(data) : defaultStages;
};

export const saveStages = (stages: string[]) => {
  localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
};

