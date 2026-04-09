# DesbraSys — Sistema de Gestão de Clubes de Desbravadores

PWA completa construída com **React 18 + Supabase**. Funciona no navegador e pode ser instalada como app no celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, React Router 6 |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Deploy | Vercel / Netlify (recomendado) |

---

## Pré-requisitos

- Node.js 18+
- Conta gratuita no Supabase (supabase.com)

---

## Passo 1 — Configurar o Supabase

1. Crie um projeto novo em app.supabase.com
2. Vá em SQL Editor e execute todo o conteúdo de supabase_schema.sql
3. Vá em Settings > API e copie a Project URL e anon public key

---

## Passo 2 — Variáveis de ambiente

Crie um arquivo .env na raiz do projeto:

  REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
  REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

---

## Passo 3 — Criar o primeiro usuário (Diretor)

No Supabase: Authentication > Users > Add user (crie e-mail e senha).

Depois execute no SQL Editor:

  INSERT INTO perfis (id, clube_id, nome, email, nivel_acesso)
  VALUES (
    'UUID_DO_USUARIO',
    (SELECT id FROM clubes LIMIT 1),
    'Seu Nome',
    'seu@email.com',
    'diretor'
  );

---

## Passo 4 — Rodar localmente

  npm install
  npm start

Acesse: http://localhost:3000

---

## Passo 5 — Deploy (Vercel)

  npm install -g vercel
  vercel

Configure as variáveis de ambiente no painel da Vercel.

---

## Estrutura do projeto

  src/
  ├── components/layout/AppLayout.jsx   # Sidebar + topbar + mobile nav
  ├── hooks/useAuth.js                  # Contexto de autenticação
  ├── lib/supabase.js                   # Cliente Supabase
  ├── pages/
  │   ├── Login.jsx                     # Tela de login
  │   ├── Dashboard.jsx                 # Painel principal
  │   ├── Membros.jsx                   # CRUD de membros
  │   ├── Presenca.jsx                  # Registro de presença
  │   ├── Avisos.jsx                    # Comunicados
  │   ├── Eventos.jsx                   # Calendário
  │   ├── Relatorios.jsx                # Gráficos e dados
  │   └── OutrasPages.jsx               # Notícias, Suporte, Config
  ├── styles/global.css                 # Design system
  └── App.js                            # Rotas

---

## Módulos

  Dashboard    → métricas, atividades, avisos, próximos eventos
  Membros      → CRUD completo com busca, filtros e responsável
  Presença     → registro por evento com % de frequência
  Avisos       → comunicados por tipo (urgente/aviso/informativo)
  Eventos      → reuniões e eventos com data/local/tipo
  Notícias     → publicações com imagem e rascunho
  Relatórios   → gráficos de presença, classe e sexo
  Suporte      → chamados com categoria e status
  Configurações → edição de perfil

---

## Níveis de acesso

  Diretor     → editar + excluir + admin
  Secretário  → cadastrar + editar
  Conselheiro → somente leitura
  Associado   → somente leitura

O RLS do Supabase garante isolamento total entre clubes.

---

## PWA no celular

Chrome: menu > Adicionar à tela inicial
Safari: compartilhar > Adicionar à Tela de Início
