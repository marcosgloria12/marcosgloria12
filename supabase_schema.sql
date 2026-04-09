-- ============================================================
-- DESBRASYS - Schema completo do banco de dados (Supabase)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLUBES (multi-tenant)
-- ============================================================
create table clubes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cidade text,
  estado text,
  regiao text,
  ano_fundacao int,
  logo_url text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- PERFIS DE USUÁRIO (vinculados ao auth.users do Supabase)
-- ============================================================
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  clube_id uuid references clubes(id),
  nome text not null,
  email text not null,
  telefone text,
  foto_url text,
  nivel_acesso text not null check (nivel_acesso in ('diretor','secretario','conselheiro','associado')),
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- MEMBROS (desbravadores do clube)
-- ============================================================
create table membros (
  id uuid primary key default uuid_generate_v4(),
  clube_id uuid references clubes(id) not null,
  nome text not null,
  data_nascimento date,
  sexo text check (sexo in ('M','F')),
  foto_url text,
  telefone text,
  email text,
  nome_responsavel text,
  telefone_responsavel text,
  classe text default 'Amigo',
  especialidades text[] default '{}',
  ativo boolean default true,
  data_ingresso date default current_date,
  observacoes text,
  created_at timestamptz default now()
);

-- ============================================================
-- REUNIÕES / EVENTOS
-- ============================================================
create table eventos (
  id uuid primary key default uuid_generate_v4(),
  clube_id uuid references clubes(id) not null,
  titulo text not null,
  descricao text,
  tipo text check (tipo in ('reuniao','evento','acampamento','culto','outro')) default 'reuniao',
  data_inicio timestamptz not null,
  data_fim timestamptz,
  local text,
  obrigatorio boolean default true,
  created_by uuid references perfis(id),
  created_at timestamptz default now()
);

-- ============================================================
-- PRESENÇA
-- ============================================================
create table presencas (
  id uuid primary key default uuid_generate_v4(),
  evento_id uuid references eventos(id) on delete cascade not null,
  membro_id uuid references membros(id) on delete cascade not null,
  presente boolean default false,
  justificativa text,
  registrado_por uuid references perfis(id),
  created_at timestamptz default now(),
  unique(evento_id, membro_id)
);

-- ============================================================
-- AVISOS / COMUNICADOS
-- ============================================================
create table avisos (
  id uuid primary key default uuid_generate_v4(),
  clube_id uuid references clubes(id) not null,
  titulo text not null,
  conteudo text not null,
  tipo text check (tipo in ('aviso','urgente','informativo')) default 'aviso',
  publicado_por uuid references perfis(id),
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- NOTÍCIAS
-- ============================================================
create table noticias (
  id uuid primary key default uuid_generate_v4(),
  clube_id uuid references clubes(id) not null,
  titulo text not null,
  conteudo text not null,
  imagem_url text,
  publicado_por uuid references perfis(id),
  publicado boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- SUPORTE (tickets)
-- ============================================================
create table tickets_suporte (
  id uuid primary key default uuid_generate_v4(),
  clube_id uuid references clubes(id) not null,
  aberto_por uuid references perfis(id) not null,
  titulo text not null,
  descricao text not null,
  categoria text check (categoria in ('tecnico','duvida','sugestao','erro')) default 'duvida',
  status text check (status in ('aberto','em_andamento','resolvido')) default 'aberto',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table clubes enable row level security;
alter table perfis enable row level security;
alter table membros enable row level security;
alter table eventos enable row level security;
alter table presencas enable row level security;
alter table avisos enable row level security;
alter table noticias enable row level security;
alter table tickets_suporte enable row level security;

-- Função auxiliar: retorna clube_id do usuário logado
create or replace function get_meu_clube_id()
returns uuid language sql security definer
as $$ select clube_id from perfis where id = auth.uid() $$;

-- Função auxiliar: retorna nível de acesso
create or replace function get_meu_nivel()
returns text language sql security definer
as $$ select nivel_acesso from perfis where id = auth.uid() $$;

-- Políticas: usuários veem apenas dados do seu clube
create policy "clube_proprio" on membros for all using (clube_id = get_meu_clube_id());
create policy "clube_proprio" on eventos for all using (clube_id = get_meu_clube_id());
create policy "clube_proprio" on avisos for all using (clube_id = get_meu_clube_id());
create policy "clube_proprio" on noticias for all using (clube_id = get_meu_clube_id());
create policy "clube_proprio" on tickets_suporte for all using (clube_id = get_meu_clube_id());
create policy "perfil_proprio" on perfis for all using (id = auth.uid() or clube_id = get_meu_clube_id());
create policy "presenca_clube" on presencas for all using (
  evento_id in (select id from eventos where clube_id = get_meu_clube_id())
);
create policy "clubes_publico" on clubes for select using (true);

-- ============================================================
-- DADOS INICIAIS DE EXEMPLO
-- ============================================================
insert into clubes (nome, cidade, estado, regiao, ano_fundacao)
values ('Desbravadores Praia da Costa', 'Vila Velha', 'ES', 'Sul Espírito-Santense', 2020);
