import { FinancialSummary } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const JULIUS_SYSTEM_PROMPT = `Você é Julius, o pai da família do seriado "Todo Mundo Odeia o Chris". 
Você é extremamente econômico, dramático com dinheiro, engraçado e direto. 
Você trabalha muito e sabe o valor de cada centavo.

Sua personalidade:
- Dramático quando vê gastos desnecessários
- Sabe exatamente quanto custa tudo
- Dá conselhos financeiros práticos e contextualizados
- Usa humor para educar sobre finanças
- É genuinamente preocupado com o bem-estar financeiro do usuário
- Faz referências ao seu trabalho duro para ganhar dinheiro

Suas capacidades:
- Analisa padrões de gastos e identifica comportamentos
- Detecta anomalias comparando com médias históricas
- Sugere tipos de investimento adequados ao perfil (CDB, LCI, LCA, Tesouro Direto — nunca renda variável específica)
- Monta planos estruturados para metas financeiras
- Educa sobre conceitos financeiros de forma simples e divertida
- Calcula projeções baseadas nos dados reais do usuário

Regras:
- Nunca indique ações, FIIs ou ativos de renda variável específicos
- Sempre baseie suas análises nos dados financeiros fornecidos
- Mantenha o tom do Julius — engraçado mas genuinamente útil
- Responda sempre em português brasileiro
- Seja conciso mas completo`

export function buildFinancialContext(summary: FinancialSummary): string {
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const recentTransactions = summary.transactions
    .slice(0, 20)
    .map(
      (t) =>
        `${t.date} | ${t.type === 'income' ? 'ENTRADA' : 'SAÍDA'} | R$ ${t.amount.toFixed(2)} | ${t.category} | ${t.description}${t.local ? ` | ${t.local}` : ''}`
    )
    .join('\n')

  const topCategories = summary.topCategories
    .map((c) => `${c.category}: R$ ${c.amount.toFixed(2)}`)
    .join(', ')

  const goals = summary.goals
    .map(
      (g) =>
        `${g.title}: R$ ${g.currentAmount.toFixed(2)} / R$ ${g.targetAmount.toFixed(2)} (prazo: ${g.deadline})`
    )
    .join('\n')

  return `
DATA ATUAL: ${now}

RESUMO FINANCEIRO:
- Receita total: R$ ${summary.totalIncome.toFixed(2)}
- Despesas totais: R$ ${summary.totalExpenses.toFixed(2)}
- Saldo atual: R$ ${summary.balance.toFixed(2)}
- Média mensal de receita: R$ ${summary.monthlyAvgIncome.toFixed(2)}
- Média mensal de despesas: R$ ${summary.monthlyAvgExpenses.toFixed(2)}

TOP CATEGORIAS DE GASTOS:
${topCategories}

METAS FINANCEIRAS:
${goals || 'Nenhuma meta cadastrada'}

ÚLTIMAS 20 TRANSAÇÕES:
${recentTransactions || 'Nenhuma transação registrada'}
`
}

export async function askJulius(
  userMessage: string,
  summary: FinancialSummary,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const financialContext = buildFinancialContext(summary)

  const messages = [
    ...conversationHistory.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `${JULIUS_SYSTEM_PROMPT}\n\nDADOS FINANCEIROS DO USUÁRIO:\n${financialContext}`,
        },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao consultar o Julius')
  }

  const data = await response.json()
  return data.choices[0].message.content
}