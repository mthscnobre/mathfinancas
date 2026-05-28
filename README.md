# MathFinanças

> Controle financeiro pessoal com assistente de IA integrado.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth%20%2B%20FCM-orange?logo=firebase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![PWA](https://img.shields.io/badge/PWA-instalável-purple)

**URL de produção:** https://mathfinancas.nobretecnologia.com

---

## Sobre

MathFinanças é um app de finanças pessoais construído para uso próprio — com foco em controle real de gastos, não em dashboards bonitos. O diferencial é o **Julius**, um assistente financeiro com IA que conhece o histórico e o perfil do usuário e responde de forma direta, sem rodeios.

---

## Funcionalidades

### Controle financeiro
- Lançamento de receitas e despesas com categorias, forma de pagamento, local e observações
- Suporte a parcelas — lança automaticamente N transações com descrição numerada
- Edição de transações existentes
- Transações recorrentes mensais (salário, aluguel, assinaturas)
- Cartões de crédito com controle de fatura atual e próxima
- Caixinhas de poupança com ou sem meta
- Investimentos (CDB, LCI, LCA, Tesouro Direto, Ações, FII etc.)
- Metas financeiras com progresso
- Orçamentos por categoria com alertas de 80% e 100%
- Fluxo de caixa futuro (30/60/90 dias) baseado em recorrências, parcelas e faturas

### Categorização
- 10 categorias padrão do sistema
- Categorias personalizadas com cor customizável (ColorPicker)
- **Motor de regras de categorização automática** — regras condicionais (AND/OR) aplicadas nas importações via Open Finance

### Julius — Assistente de IA
- Modelo: DeepSeek V4 Flash via OpenRouter
- Memória persistente via Mem0 — aprende padrões ao longo do tempo
- Histórico de conversa salvo no Firestore
- Contexto financeiro real injetado em cada mensagem (saldo, categorias, metas, transações recentes)
- Relatório mensal automático gerado no dia 1 de cada mês

### Infraestrutura
- PWA instalável (Android e iOS)
- Push Notifications via Firebase Cloud Messaging
- Cloud Functions agendadas: alertas de fatura, alertas de orçamento, relatório mensal
- Open Finance via Pluggy (aguardando aprovação de produção)
- Modo escuro / claro
- Ocultação global de valores (privacidade)
- Sidebar recolhível

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Banco de dados | Firebase Firestore |
| Autenticação | Firebase Authentication |
| Notificações | Firebase Cloud Messaging (FCM) |
| Cloud Functions | Firebase Functions v2 (Node.js 24) |
| IA | DeepSeek V4 Flash via OpenRouter |
| Memória IA | Mem0 |
| Open Finance | Pluggy |
| Gráficos | Recharts |
| Estado global | Zustand |
| Datas | date-fns |
| Deploy | Vercel |

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/login/           ← autenticação
│   ├── (dashboard)/            ← páginas principais
│   │   ├── dashboard/
│   │   ├── transacoes/
│   │   ├── recorrencias/
│   │   ├── metas/
│   │   ├── patrimonio/
│   │   ├── orcamentos/
│   │   ├── fluxo/
│   │   ├── julius/
│   │   └── configuracoes/
│   └── api/
│       ├── julius/             ← endpoint do assistente
│       ├── pluggy/             ← connect-token, transactions, save-item
│       └── webhooks/pluggy/    ← sync automático via webhook
├── components/
│   ├── ui/                     ← componentes shadcn
│   └── shared/                 ← componentes reutilizáveis do projeto
├── hooks/                      ← useAuth, useFinanceData, useCategories, useRules...
├── lib/                        ← firebase, firestore, julius, categorization, cashflow...
└── types/                      ← tipos TypeScript centralizados

functions/
└── src/index.ts                ← Cloud Functions agendadas
```

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# OpenRouter (Julius)
OPENROUTER_API_KEY=

# Mem0
MEM0_API_KEY=

# Pluggy (Open Finance)
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

As mesmas variáveis devem ser configuradas em **Settings → Environment Variables** na Vercel.

---

## Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy

O deploy é automático via Vercel a cada push na branch `main`.

Para as Cloud Functions:

```bash
firebase deploy --only functions
```

---

## Modelo de dados (Firestore)

```
users/{userId}/
  transactions/{txId}
  goals/{goalId}
  recurrences/{recId}
  creditCards/{cardId}
  piggybanks/{piggyId}
  investments/{investId}
  budgets/{budgetId}
  categorizationRules/{ruleId}
  julius_history/{msgId}
  julius_reports/{YYYY-MM}
  settings/preferences
  settings/notifications
  settings/pluggy

pluggy_items/{itemId}           ← mapeamento itemId → userId para webhooks
```

---

## Licença

Projeto pessoal — uso privado.