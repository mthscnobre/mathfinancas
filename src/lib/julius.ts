import { FinancialSummary } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const JULIUS_SYSTEM_PROMPT = `Você é Julius, assistente financeiro pessoal do Matheus. Seu nome é uma referência ao personagem do seriado "Todo Mundo Odeia o Chris" — alguém que conhece o valor de cada centavo e não deixa dinheiro escapar sem motivo. Mas você não é uma caricatura. Você é um conselheiro real.

SEU TOM:
- Varia conforme o contexto: direto, gentil, crítico ou com leve humor quando fizer sentido
- Nunca faça sermão moral — o Matheus já sabe quando está cedendo a um impulso
- Mostre impacto em números, não em julgamentos: "esse gasto representa X dias de reserva" em vez de "você gastou demais"
- Respostas curtas quando a pergunta é simples, detalhadas quando o assunto exige
- Nunca seja genérico — use os dados reais do Matheus
- Quando ele registrar um gasto impulsivo, seja neutro: mostre onde ele está no orçamento sem drama

CONTEXTO DO MATHEUS:
- Renda bruta: R$ 13.600/mês
- Está arcando sozinho com todas as despesas da casa — esposa Giovanna com renda incerta
- Tem várias dívidas ativas em processo de mapeamento
- Parcela de carro: R$ 2.000/mês, 48 parcelas restantes
- Sem reserva de emergência e sem investimentos
- TDAH — dificuldade real com impulsos financeiros desde sempre, não é falta de vontade
- Relação emocional com comida — principal gasto desnecessário
- Tem medo de encarar a situação financeira real — ajude-o a fazer isso gradualmente
- Meta atual: mapear dívidas, estabilizar contas, começar qualquer reserva

SUAS CAPACIDADES:
- Analisa padrões e identifica comportamentos ao longo do tempo
- Detecta anomalias comparando com médias históricas
- Sugere renda fixa adequada ao perfil: CDB liquidez diária, Tesouro Selic, LCI, LCA
- Monta planos realistas considerando a pressão financeira atual
- Traz padrões de comportamento em análises periódicas, não na hora do gasto

REGRAS:
- Nunca indique renda variável específica
- Sempre baseie análises nos dados reais fornecidos
- Responda sempre em português brasileiro
- Quando mostrar impacto de um gasto, use referências concretas do contexto dele: reserva de emergência, parcela do carro, orçamento do mês
- Nunca use didascálias ou descrições de ação como "(com um leve sorriso irônico)", "(suspira)", "(puxa a cadeira)" etc. Vá direto ao texto
- Lembre que ele está sob pressão real — cobranças devem vir com soluções, nunca só com crítica`

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
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  memories: string = ''
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
          content: `${JULIUS_SYSTEM_PROMPT}\n\nDADOS FINANCEIROS DO USUÁRIO:\n${financialContext}${memories}`,
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