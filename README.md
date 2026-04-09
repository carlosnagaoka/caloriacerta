# CaloriaCerta

Aplicativo de rastreamento nutricional com identificação de alimentos por IA a partir de fotos de refeições.

## Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** OpenAI GPT-4o-mini (visão computacional)
- **Hospedagem:** Vercel

## Funcionalidades

- Cadastro e autenticação de usuários
- Registro de refeições com foto
- Identificação automática de alimentos via IA (foto → lista de alimentos + calorias estimadas)
- Correção manual dos alimentos identificados com busca no banco de dados
- Dashboard diário com navegação por data
- Barra de progresso da meta calórica diária
- Exclusão de refeições
- Índice de Consistência (IC) e streak diário

## Estrutura

```
caloriacerta/
├── apps/
│   └── web/                        # Aplicação Next.js
│       ├── app/
│       │   ├── app/
│       │   │   ├── dashboard/      # Dashboard do usuário
│       │   │   └── refeicao/       # Registro de refeição + IA
│       │   ├── api/cadastro/       # API de cadastro
│       │   ├── cadastro/           # Página de cadastro
│       │   ├── login/              # Página de login
│       │   └── logout/             # Rota de logout
│       ├── components/
│       │   └── MealForm.tsx        # Formulário de refeição
│       └── lib/                    # Clientes Supabase
└── supabase/
    └── seed.sql                    # Dados iniciais (alimentos)
```

## Configuração

### Pré-requisitos

- Node.js 18+
- Conta Supabase
- Chave de API OpenAI (com créditos ativos)

### Variáveis de ambiente

Crie `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalação

```bash
cd apps/web
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Supabase Storage

O bucket `meal-photos` deve estar configurado com política de leitura pública (`anon` + `authenticated`) para que a OpenAI consiga acessar as imagens enviadas.
