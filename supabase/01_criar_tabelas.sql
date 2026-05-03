-- ============================================================
-- CRM B2B - Script SQL para Supabase
-- Execute no SQL Editor do Supabase: https://app.supabase.com
-- ============================================================

-- 1. USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('master', 'user')),
  phone TEXT,
  role_title TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EMPRESAS
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  fantasy_name TEXT NOT NULL,
  corporate_name TEXT,
  cnpj TEXT,
  segment TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  zip_code TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CONTATOS (vinculados a empresa)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  profile TEXT DEFAULT 'Contato Operacional'
    CHECK (profile IN ('Sócio', 'Influenciador', 'Contato Operacional')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ESTÁGIOS DO PIPELINE
CREATE TABLE IF NOT EXISTS stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_theme INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir estágios padrão
INSERT INTO stages (name, color_theme, position) VALUES
  ('Prospecção',  0, 0),
  ('Diagnóstico', 1, 1),
  ('Proposta',    2, 2),
  ('Negociação',  3, 3),
  ('Fechamento',  4, 4)
ON CONFLICT (name) DO NOTHING;

-- 5. OPORTUNIDADES
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  estimated_value NUMERIC(14, 2) DEFAULT 0,
  expected_closing_date TEXT,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'Prospecção',
  next_follow_up TEXT,
  last_follow_up_notes TEXT,
  is_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TAREFAS (vinculadas a oportunidade)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ATIVIDADES (vinculadas a empresa e opcionalmente a oportunidade)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES para melhorar performance das consultas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_opportunity_id ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON activities(opportunity_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Desativado para uso inicial
-- Ative depois ao implementar autenticação via Supabase Auth
-- ============================================================
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies      DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       DISABLE ROW LEVEL SECURITY;
ALTER TABLE stages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities  DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities     DISABLE ROW LEVEL SECURITY;
