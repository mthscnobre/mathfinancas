import { Transaction, Recurrence, CreditCard } from '@/types'
import { format, addDays, addMonths, startOfDay, isWithinInterval, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface CashflowEntry {
  date: string // YYYY-MM-DD
  description: string
  amount: number
  type: 'income' | 'expense'
  source: 'recurrence' | 'installment' | 'invoice'
  category?: string
  cardName?: string
}

export interface CashflowDay {
  date: string // YYYY-MM-DD
  label: string // "hoje", "amanhã", "seg 12/06"
  entries: CashflowEntry[]
  totalIncome: number
  totalExpense: number
  balance: number // saldo do dia
  runningBalance: number // saldo acumulado
}

export function buildCashflow(
  transactions: Transaction[],
  recurrences: Recurrence[],
  creditCards: CreditCard[],
  currentBalance: number,
  days: number = 60
): CashflowDay[] {
  const today = startOfDay(new Date())
  const result: CashflowDay[] = []

  // Monta mapa de entradas por data
  const entriesByDate: Record<string, CashflowEntry[]> = {}

  const addEntry = (date: string, entry: CashflowEntry) => {
    if (!entriesByDate[date]) entriesByDate[date] = []
    entriesByDate[date].push(entry)
  }

  // 1 — Recorrências ativas
  for (const rec of recurrences.filter((r) => r.active)) {
    for (let i = 0; i < 2; i++) { // próximos 2 meses
      const targetMonth = addMonths(today, i)
      const year = targetMonth.getFullYear()
      const month = targetMonth.getMonth()
      const daysInMonth = getDaysInMonth(targetMonth)
      const day = Math.min(rec.dayOfMonth, daysInMonth)
      const date = new Date(year, month, day)

      if (date >= today && date <= addDays(today, days)) {
        addEntry(format(date, 'yyyy-MM-dd'), {
          date: format(date, 'yyyy-MM-dd'),
          description: rec.description,
          amount: rec.amount,
          type: rec.type,
          source: 'recurrence',
          category: rec.category,
        })
      }
    }
  }

  // 2 — Parcelas em andamento
  const installmentGroups: Record<string, Transaction[]> = {}
  for (const tx of transactions) {
    if (tx.installmentTotal && tx.installmentCurrent && tx.installmentCurrent < tx.installmentTotal) {
      const baseDesc = tx.description.replace(/\s*\(\d+\/\d+\)$/, '')
      if (!installmentGroups[baseDesc]) installmentGroups[baseDesc] = []
      installmentGroups[baseDesc].push(tx)
    }
  }

  for (const [baseDesc, txs] of Object.entries(installmentGroups)) {
    const lastTx = txs.sort((a, b) => b.date.localeCompare(a.date))[0]
    const remaining = lastTx.installmentTotal! - lastTx.installmentCurrent!

    for (let i = 1; i <= remaining; i++) {
      const nextDate = addMonths(new Date(lastTx.date), i)
      if (nextDate >= today && nextDate <= addDays(today, days)) {
        const current = lastTx.installmentCurrent! + i
        addEntry(format(nextDate, 'yyyy-MM-dd'), {
          date: format(nextDate, 'yyyy-MM-dd'),
          description: `${baseDesc} (${current}/${lastTx.installmentTotal})`,
          amount: lastTx.amount,
          type: 'expense',
          source: 'installment',
          category: lastTx.category,
        })
      }
    }
  }

  // 3 — Faturas de cartão
  for (const card of creditCards) {
    for (let i = 0; i < 2; i++) {
      const targetMonth = addMonths(today, i)
      const year = targetMonth.getFullYear()
      const month = targetMonth.getMonth()
      const daysInMonth = getDaysInMonth(targetMonth)
      const dueDay = Math.min(card.dueDay, daysInMonth)
      const dueDate = new Date(year, month, dueDay)

      if (dueDate >= today && dueDate <= addDays(today, days)) {
        // Calcula valor da fatura do mês anterior ao vencimento
        const billingMonth = format(addMonths(dueDate, -1), 'yyyy-MM')
        const invoiceAmount = transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.paymentMethod === 'credit_card' &&
              t.creditCardId === card.id &&
              t.billingMonth === billingMonth
          )
          .reduce((acc, t) => acc + t.amount, 0)

        if (invoiceAmount > 0) {
          addEntry(format(dueDate, 'yyyy-MM-dd'), {
            date: format(dueDate, 'yyyy-MM-dd'),
            description: `Fatura ${card.name}`,
            amount: invoiceAmount,
            type: 'expense',
            source: 'invoice',
            cardName: card.name,
          })
        }
      }
    }
  }

  // Monta os dias
  let runningBalance = currentBalance

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const entries = entriesByDate[dateStr] || []

    if (entries.length === 0 && i > 7) continue // pula dias vazios após primeira semana

    const totalIncome = entries
      .filter((e) => e.type === 'income')
      .reduce((acc, e) => acc + e.amount, 0)

    const totalExpense = entries
      .filter((e) => e.type === 'expense')
      .reduce((acc, e) => acc + e.amount, 0)

    runningBalance += totalIncome - totalExpense

    let label: string
    if (i === 0) label = 'Hoje'
    else if (i === 1) label = 'Amanhã'
    else label = format(date, "EEE dd/MM", { locale: ptBR })

    result.push({
      date: dateStr,
      label,
      entries,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      runningBalance,
    })
  }

  return result.filter((d) => d.entries.length > 0)
}