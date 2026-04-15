-- aqui pedi ajuda ao claude pra dar um help pra ser mais rapido

-- ============================================================
-- DESBRASYS — Schema completo para Supabase
-- Execute no SQL Editor do Supabase (em ordem)
-- ============================================================

-- 1. Tabela de clubes
create table if not exists public.clubes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cidade      text,
  estado      text,
  created_at  timestamptz default now()
);

-- 2. Tabela de perfis (vinculada ao Supabase Auth)
create table if not exists public.perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text not null,
  email          text not null,
  nivel_acesso   text not null default 'membro' check (nivel_acesso in ('admin', 'diretor', 'secretario', 'membro')),
  clube_id       uuid references public.clubes(id),
  ativo          boolean default true,
  created_at     timestamptz default now()
);

-- 3. Tabela de membros (desbravadores)
create table if not exists public.membros (
  id                    uuid primary key default gen_random_uuid(),
  clube_id              uuid not null references public.clubes(id),
  nome                  text not null,
  data_nascimento       date,
  sexo                  text check (sexo in ('M', 'F')),
  telefone              text,
  email                 text,
  nome_responsavel      text,
  telefone_responsavel  text,
  classe                text default 'Amigo',
  observacoes           text,
  ativo                 boolean default true,
  data_ingresso         date default current_date,
  created_at            timestamptz default now()
);

-- 4. Tabela de eventos
create table if not exists public.eventos (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references public.clubes(id),
  titulo       text not null,
  descricao    text,
  tipo         text default 'evento' check (tipo in ('reuniao', 'evento', 'acampamento', 'culto', 'outro')),
  data_inicio  timestamptz not null,
  data_fim     timestamptz,
  local        text,
  obrigatorio  boolean default false,
  created_by   uuid references public.perfis(id),
  created_at   timestamptz default now()
);

-- 5. Tabela de presenças
create table if not exists public.presencas (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references public.eventos(id) on delete cascade,
  membro_id  uuid not null references public.membros(id) on delete cascade,
  presente   boolean default false,
  created_at timestamptz default now(),
  unique(evento_id, membro_id)
);

-- 6. Tabela de avisos
create table if not exists public.avisos (
  id             uuid primary key default gen_random_uuid(),
  clube_id       uuid not null references public.clubes(id),
  titulo         text not null,
  conteudo       text not null,
  tipo           text default 'aviso' check (tipo in ('urgente', 'aviso', 'informativo')),
  ativo          boolean default true,
  publicado_por  uuid references public.perfis(id),
  created_at     timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.clubes    enable row level security;
alter table public.perfis    enable row level security;
alter table public.membros   enable row level security;
alter table public.eventos   enable row level security;
alter table public.presencas enable row level security;
alter table public.avisos    enable row level security;

-- Helper: retorna o clube_id do usuário autenticado
create or replace function public.meu_clube_id()
returns uuid language sql stable security definer as $$
  select clube_id from public.perfis where id = auth.uid()
$$;

-- Helper: retorna o nivel_acesso do usuário autenticado
create or replace function public.meu_nivel()
returns text language sql stable security definer as $$
  select nivel_acesso from public.perfis where id = auth.uid()
$$;

-- Clubes: todos veem o próprio clube
create policy "ver proprio clube" on public.clubes
  for select using (id = public.meu_clube_id());

-- Perfis: cada um vê os do próprio clube
create policy "ver perfis do clube" on public.perfis
  for select using (clube_id = public.meu_clube_id());

create policy "atualizar proprio perfil" on public.perfis
  for update using (id = auth.uid());

-- Admin pode tudo nos perfis
create policy "admin gerencia perfis" on public.perfis
  for all using (public.meu_nivel() in ('admin', 'diretor'));

-- Membros: leitura para todos do clube, escrita para diretor+
create policy "ver membros do clube" on public.membros
  for select using (clube_id = public.meu_clube_id());

create policy "editar membros" on public.membros
  for all using (
    clube_id = public.meu_clube_id()
    and public.meu_nivel() in ('admin', 'diretor', 'secretario')
  );

-- Eventos
create policy "ver eventos do clube" on public.eventos
  for select using (clube_id = public.meu_clube_id());

create policy "editar eventos" on public.eventos
  for all using (
    clube_id = public.meu_clube_id()
    and public.meu_nivel() in ('admin', 'diretor', 'secretario')
  );

-- Presenças
create policy "ver presencas" on public.presencas
  for select using (
    evento_id in (
      select id from public.eventos where clube_id = public.meu_clube_id()
    )
  );

create policy "editar presencas" on public.presencas
  for all using (
    evento_id in (
      select id from public.eventos where clube_id = public.meu_clube_id()
    )
    and public.meu_nivel() in ('admin', 'diretor', 'secretario')
  );

-- Avisos
create policy "ver avisos do clube" on public.avisos
  for select using (clube_id = public.meu_clube_id());

create policy "editar avisos" on public.avisos
  for all using (
    clube_id = public.meu_clube_id()
    and public.meu_nivel() in ('admin', 'diretor', 'secretario')
  );

-- ============================================================
-- TRIGGER: cria perfil automaticamente após signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfis (id, nome, email, nivel_acesso)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'nivel_acesso', 'membro')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DADOS INICIAIS: clube e admin padrão
-- ============================================================

-- Insira manualmente após criar o usuário admin via Supabase Dashboard ou signUp:
-- update public.perfis set nivel_acesso = 'admin', clube_id = '<ID_DO_CLUBE>' where email = 'admin@seuclube.com';